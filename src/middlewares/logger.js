const pino = require('pino');

module.exports = logger = pino({
  level: `${process.env.LOG_LEVEL}` || `info`, // log level for development
  transport: {
    target: 'pino-pretty'
  }
  });