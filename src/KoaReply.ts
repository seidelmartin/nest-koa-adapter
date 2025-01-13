import Koa from 'koa';
import { Stream } from 'stream';
import { OutgoingHttpHeaders, ServerResponse } from 'http';

interface ResponseOverwrites {
  status: number;
  headers: [string, string][];
}

function getOverwrites(
  response: Koa.Response,
  statusCode?: number,
): ResponseOverwrites {
  return {
    status: response.status,
    headers: Object.entries(response.headers) as [string, string][],
  };
}

function applyOverwrites(
  response: ServerResponse,
  overwrites: ResponseOverwrites,
) {
  const headers = overwrites.headers.reduce<OutgoingHttpHeaders>(
    (headers, [header, value]) => {
      headers[header] = value;
      return headers;
    },
    {},
  );

  response.writeHead(response.statusCode, headers);
}

export const koaReply = (
  response: Koa.Response,
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  body: any,
  statusCode?: number,
): void => {
  const overwrites = getOverwrites(response, statusCode);

  response.ctx.respond = false;
  response.status = statusCode || overwrites.status;

  const { writable, status, ctx, res: rawResponse } = response;

  const { headersSent } = rawResponse;

  if (!writable) {
    return;
  }

  // Empty response
  if ([null, undefined].includes(body)) {
    applyOverwrites(rawResponse, overwrites);

    body =
      ctx.req.httpVersionMajor >= 2
        ? String(status)
        : ctx.message || String(status);

    if (!headersSent) {
      ctx.type = 'text';
      ctx.length = Buffer.byteLength(body);
    }

    rawResponse.end(body);

    return;
  }

  response.body = body;
  applyOverwrites(rawResponse, overwrites);
  // Other responses
  switch (true) {
    case Buffer.isBuffer(body):
    case typeof body === 'string':
      rawResponse.end(body);
      return;
    case body instanceof Stream:
      body.pipe(rawResponse);
      return;
    default:
      const stringifiedBody = JSON.stringify(body);
      if (!headersSent) {
        ctx.length = Buffer.byteLength(stringifiedBody);
      }
      rawResponse.end(stringifiedBody);
      return;
  }
};
