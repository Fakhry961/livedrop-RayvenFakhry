// src/middleware/errorHandler.js (ESM)
export function errorHandler(err, req, res, _next) {
  const status = err.status || 500;
  if (process.env.NODE_ENV !== 'test') {
    // eslint-disable-next-line no-console
    console.error('[ERROR]', status, err.stack || err);
  }
  res.status(status).json({
    error: {
      code: status,
      message: err.message || 'Internal Server Error',
      details: err.details,
    },
  });
}
