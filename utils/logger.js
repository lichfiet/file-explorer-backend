const pino = require('pino');

module.exports = logger = pino({
  level: 'info',
  transport: {
    target: 'pino-pretty'
  }
  });