'use strict';

const process = require('process');
const opentelemetry = require('@opentelemetry/sdk-node');
const { PinoInstrumentation } = require('@opentelemetry/instrumentation-pino');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
const { OTLPLogExporter } = require('@opentelemetry/exporter-logs-otlp-http');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');

// Trace Exporter Configuration
const exporterOptions = {
  url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT + '/v1/traces',
  headers: {
    'OT-Tracer-Span-Export': 'true',
  },
};

let otelUrl = "localhost:4317";

if (process.env.OTEL_EXPORTER_OTLP_ENDPOINT) {
  otelUrl = process.env.OTEL_EXPORTER_OTLP_ENDPOINT
}

const logExporter = {
  url: otelUrl + '/v1/logs'
};

const traceExporter = new OTLPTraceExporter(exporterOptions)
const sdk = new opentelemetry.NodeSDK({
  traceExporter,
  logRecordProcessors: [new opentelemetry.logs.SimpleLogRecordProcessor(new OTLPLogExporter(logExporter))],
  instrumentations: [
    getNodeAutoInstrumentations(),
    new PinoInstrumentation({
      logLevel: process.env.LOG_LEVEL || 'info',
      ignoreUrls: [
        /localhost/,
        /127.0.0.1/,
      ],
    }),
  ],
  resource: new Resource({
    // highlight-next-line
    [SemanticResourceAttributes.SERVICE_NAME]: 'node_app',
  }),
})

const pino = require('pino');
const logger = pino({
  level: `${(process.env.LOG_LEVEL).toLowerCase()}` || 'info', // log level for development
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

console.log(process.env.OTEL_EXPORTER_OTLP_ENDPOINT);

module.exports = { sdk, logger };
