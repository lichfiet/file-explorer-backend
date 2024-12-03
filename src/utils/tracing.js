'use strict';

const process = require('process');
const opentelemetry = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');
const {
  LoggerProvider,
  BatchLogRecordProcessor,
} = require('@opentelemetry/sdk-logs');
const { OTLPLogExporter } = require('@opentelemetry/exporter-logs-otlp-http');
const { SeverityNumber } = require('@opentelemetry/api-logs');

// Trace Exporter Configuration
const exporterOptions = {
  url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT + '/v1/traces',
  headers: {
    'OT-Tracer-Span-Export': 'true',
  },
};

const traceExporter = new OTLPTraceExporter(exporterOptions);
const sdk = new opentelemetry.NodeSDK({
  traceExporter,
  instrumentations: [getNodeAutoInstrumentations()],
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'node_app',
  }),
});

// Log Exporter Configuration
const logExporterOptions = {
  url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT + '/v1/logs', // Replace with your OTLP collector URL
  concurrencyLimit: 1,
};

const logExporter = new OTLPLogExporter(logExporterOptions);
const loggerProvider = new LoggerProvider();

loggerProvider.addLogRecordProcessor(new BatchLogRecordProcessor(logExporter));

// Retrieve a logger instance
const logger = loggerProvider.getLogger('node_app_logger', '1.0.0');

// Emit a log example
logger.emit({
  severityNumber: SeverityNumber.INFO,
  severityText: 'info',
  body: 'OpenTelemetry logging initialized successfully.',
  attributes: { 'log.type': 'startup' },
});

// Start the SDK and return it
sdk.start().then(() => {
  logger.emit({
    severityNumber: SeverityNumber.INFO,
    severityText: 'info',
    body: 'OpenTelemetry SDK started successfully.',
    attributes: { 'log.type': 'lifecycle' },
  });
}).catch((error) => {
  logger.emit({
    severityNumber: SeverityNumber.ERROR,
    severityText: 'error',
    body: 'Failed to start OpenTelemetry SDK.',
    attributes: { 'error.message': error.message, 'log.type': 'lifecycle' },
  });
});

module.exports = { sdk, logger };
