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
      ignoreUrls: [/localhost/],
    }),
  ],
  resource: new Resource({
    // highlight-next-line
    [SemanticResourceAttributes.SERVICE_NAME]: 'node_app',
  }),
})

module.exports = { sdk };
