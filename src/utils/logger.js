const { logger } = require('./observability.js')

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

console.log("Initialized Logging");

module.exports = logger;
  