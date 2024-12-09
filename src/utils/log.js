const pino = require('pino');

const logger = pino({
  level: process.env.LOG_LEVEL ? process.env.LOG_LEVEL.toLowerCase() : 'info',
  transport: {
    target: 'pino-pretty'
  }
});

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

console.info = function(message) {
  logger.info(message);
};

module.exports = logger;