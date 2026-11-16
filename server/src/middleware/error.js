export const notFoundHandler = (req, res, next) => {
  const error = new Error(`Resource not found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

export const errorHandler = (err, req, res, next) => {
  // If status is still 200, default to err.statusCode or 500
  const statusCode = err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);

  console.error(`[Error] ${req.method} ${req.originalUrl}:`, err.message);
  if (process.env.NODE_ENV !== 'production' && err.stack) {
    console.error(err.stack);
  }

  // Handle Sequelize unique constraint error
  if (err.name === 'SequelizeUniqueConstraintError') {
    const fields = Object.keys(err.fields || {}).join(', ') || 'field';
    return res.status(400).json({
      success: false,
      message: `An entry with this ${fields} already exists.`,
    });
  }

  // Handle Sequelize validation errors
  if (err.name === 'SequelizeValidationError') {
    const messages = (err.errors || []).map((e) => e.message);
    return res.status(400).json({
      success: false,
      message: messages.join(', '),
      errors: messages,
    });
  }

  res.status(statusCode).json({
    success: false,
    message: err.message || 'An unexpected server error occurred.',
    ...(process.env.EXPOSE_ERROR_STACK === 'true' && { stack: err.stack }),
  });
};
