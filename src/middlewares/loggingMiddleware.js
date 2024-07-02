const logger = require('../utils/logger.js');

const loggerMiddleware = (req, res, next) => {

    if (req.originalUrl === "/") {
        //logger.debug(`Request to ${req.originalUrl} has been made. TraceId: ${req.traceId}`);
    } else if (req.originalUrl === "/listFiles") {
        logger.debug(`Request to ${req.originalUrl} has been made. TraceId: ${req.traceId}`);
    } else if (req.originalUrl === "/deleteFile") {
        logger.debug(`Request to ${req.originalUrl} has been made. TraceId: ${req.traceId}`);
    } else if (req.originalUrl === "/uploadFile") {
        logger.debug(`Request to ${req.originalUrl} has been made. TraceId: ${req.traceId}`);
    } else if (req.originalUrl === "/modifyFile") {
        logger.debug(`Request to ${req.originalUrl} has been made. TraceId: ${req.traceId}`);
    } else if (req.originalUrl === "/createFolder") {
        logger.debug(`Request to ${req.originalUrl} has been made. TraceId: ${req.traceId}`);
    } else if (req.originalUrl === "/deleteFolder") {
        logger.debug(`Request to ${req.originalUrl} has been made. TraceId: ${req.traceId}`);
    } else {
        logger.debug(`Request to ${req.originalUrl} has been made. TraceId: ${req.traceId}`);
    }

    res.on('finish', async () => {
        logger.debug(`Request to ${req.originalUrl} has been completed with status code ${res.statusCode}. TraceId: ${ req.traceId}`);
    });

    next();
};

module.exports = loggerMiddleware;