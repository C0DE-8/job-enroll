function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  const status = error.statusCode || error.status || 500;
  res.status(status).json({
    ok: false,
    error: status === 500 ? "Internal server error" : error.message
  });
}

module.exports = errorHandler;
