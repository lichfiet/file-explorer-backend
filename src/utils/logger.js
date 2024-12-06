const pino = require('pino');

// Create a pino logger instance
const logger = pino({
  transport: {
    target: 'pino-pretty', // Optional: Makes logs human-readable in development
  },
  hooks: {
    logMethod(inputArgs, method) {
      if (process.env.OTEL_EXPORTER_OTLP_ENDPOINT) {
        const { trace, context } = require('@opentelemetry/api');
        // Add traceId to the log
        const span = trace.getSpan(context.active());
        if (span) {
          const traceId = span.spanContext().traceId;
          inputArgs[0] = 'TraceID: ' + traceId + ' ' + inputArgs[0];
        }
      }
      return method.apply(this, inputArgs);
    },
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
  