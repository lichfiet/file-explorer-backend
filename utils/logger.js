const pino = require('pino');

module.exports = logger = pino({
  level: `${process.env.LOG_LEVEL}` || `info`, // default level is info
  transport: {
    target: 'pino-pretty'
  }
  });