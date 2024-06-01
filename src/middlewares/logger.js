const pino = require('pino');

console.error = function(message) {
  logger.error(message);
};

console.warn = function(message) {
  logger.warn(message);
};

console.log = function(message) {
  logger.info(message);
};

console.debug = function(message) {
  logger.debug(message);
};

module.exports = logger = pino({
  level: `${process.env.LOG_LEVEL}` || `info`, // log level for development
  transport: {
    target: 'pino-pretty'
  }
  });