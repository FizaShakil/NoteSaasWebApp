import logger from '../config/logger.js'
import { ApiError } from '../utils/ApiError.js'

const isDevelopment = process.env.NODE_ENV !== 'production'

const errorHandler = (err, req, res, next) => {
  let error = err

  // Convert unknown errors to ApiError
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500
    const message = error.message || 'Something went wrong'
    error = new ApiError(statusCode, message, [], error.stack)
  }

  const statusCode = error.statusCode || 500

  // Log error
  const logData = {
    method: req.method,
    url: req.originalUrl,
    statusCode,
    message: error.message,
    errors: error.errors
  }

  if (isDevelopment && error.stack) {
    logData.stack = error.stack
  }

  logger.error(logData, 'API Error')

  // Keep response format unchanged
  return res.status(statusCode).json({
    statusCode,
    data: error.data,
    message: error.message,
    success: error.success,
    errors: error.errors
  })
}

export default errorHandler
