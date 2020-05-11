import Koa from 'koa';
import { Stream } from 'stream';

interface ResponseOverwrites {
  status: number;
  headers: [string, string][];
}

function getOverwrites(response: Koa.Response): ResponseOverwrites {
  return {
    status: response.status,
    headers: Object.entries(response.headers) as [string, string][],
  };
}

function applyOverwrites(ctx: Koa.Context, overwrites: ResponseOverwrites) {
  ctx.status = overwrites.status;

  overwrites.headers.forEach(([header, value]) => {
    ctx.set(header, value);
  });
}

export const koaReply = (
  response: Koa.Response,
  body: any,
  statusCode?: number,
) => {
  response.ctx.respond = false;
  response.body = body;

  if (statusCode) {
    response.status = statusCode;
  }

  const overwrites = getOverwrites(response);
  const { writable, status, ctx, res: rawResponse } = response;
  const { headersSent } = rawResponse;

  if (!writable) {
    return;
  }

  // Empty response
  if ([null, undefined].includes(body)) {
    body =
      ctx.req.httpVersionMajor >= 2
        ? String(status)
        : ctx.message || String(status);

    if (!headersSent) {
      ctx.type = 'text';
      ctx.length = Buffer.byteLength(body);
    }

    applyOverwrites(ctx, overwrites);
    return rawResponse.end(body);
  }

  // Other responses
  switch (true) {
    case Buffer.isBuffer(body):
    case typeof body === 'string':
      applyOverwrites(ctx, overwrites);
      return rawResponse.end(body);
    case body instanceof Stream:
      return body.pipe(rawResponse);
    default:
      const stringifiedBody = JSON.stringify(body);
      if (!headersSent) {
        ctx.length = Buffer.byteLength(stringifiedBody);
      }
      applyOverwrites(ctx, overwrites);
      return rawResponse.end(stringifiedBody);
  }
};
