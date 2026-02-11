import pino from 'pino'

const isDevelopment = process.env.NODE_ENV !== 'production'

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  base: {
    // Hide pid and hostname
    pid: false,
    hostname: false
  },
  transport: isDevelopment ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname'
    }
  } : undefined
})

export default logger