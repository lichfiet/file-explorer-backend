const pino = require('pino');

// Create a pino logger instance
const logger = pino({
  transport: {
    target: 'pino-pretty', // Optional: Makes logs human-readable in development
  },
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

console.log("Initialized Logging");

module.exports = logger;
  