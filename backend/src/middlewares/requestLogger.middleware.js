import logger from '../config/logger.js'

const requestLogger = (req, res, next) => {
  const timestamp = new Date().toISOString()
  
  logger.info({
    method: req.method,
    url: req.url,
    timestamp
  }, 'Incoming request')
  
  next()
}

export default requestLogger