import Koa from 'koa';
import { Stream } from 'stream';

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
    return rawResponse.end(body);
  }

  // Other responses
  switch (true) {
    case Buffer.isBuffer(body):
    case typeof body === 'string':
      return rawResponse.end(body);
    case body instanceof Stream:
      return body.pipe(rawResponse);
    default:
      const stringifiedBody = JSON.stringify(body);
      if (!headersSent) {
        ctx.length = Buffer.byteLength(stringifiedBody);
      }
      return rawResponse.end(stringifiedBody);
  }
};
