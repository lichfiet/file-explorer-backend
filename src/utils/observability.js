'use strict';

const process = require('process');
const opentelemetry = require('@opentelemetry/sdk-node');
const { PinoInstrumentation } = require('@opentelemetry/instrumentation-pino');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
const { OTLPLogExporter } = require('@opentelemetry/exporter-logs-otlp-http');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');
const pino = require('pino')

if (process.env.OTEL_EXPORTER_OTLP_ENDPOINT) {
  const observability = require("./utils/observability.js");
  observability.sdk.start();

  process.on('SIGTERM', () => {
    observability.sdk
      .shutdown()
      .then(() => console.log('Tracing terminated'))
      .catch((error) => console.log('Error terminating tracing', error))
      .finally(() => process.exit(0))
  })
  console.info("Initializing logging");
}




// Trace Exporter Configuration
const exporterOptions = {
  url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT + '/v1/traces',
  headers: {
    'OT-Tracer-Span-Export': 'true',
  },
};
const traceExporter = new OTLPTraceExporter(exporterOptions)



let otelUrl = "localhost:4317";
if (process.env.OTEL_EXPORTER_OTLP_ENDPOINT) {
  otelUrl = process.env.OTEL_EXPORTER_OTLP_ENDPOINT
}

const logExporter = {
  url: otelUrl + '/v1/logs'
};

const sdk = new opentelemetry.NodeSDK({
  traceExporter,
  logRecordProcessors: [new opentelemetry.logs.SimpleLogRecordProcessor(new OTLPLogExporter(logExporter))],
  instrumentations: [
    getNodeAutoInstrumentations(),
    new PinoInstrumentation({
      logLevel: process.env.LOG_LEVEL || 'info',
    }),
  ],
  resource: new Resource({
    // highlight-next-line
    [SemanticResourceAttributes.SERVICE_NAME]: '',
  }),
})

let logger = pino()

logger.info("test")

module.exports = { sdk };
