const utils = require('../utils/utilityWrapper.js');
const logger = require('../utils/logger.js');

const handleError = (err, res) => {
    logger.error(err.message);
    const status = err.status || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).send(message);
};

const requestValidatior = {};

const validationMiddleware = (req, res, next) => {
    try {
        // logger.debug(`Validation Middleware has been called. TraceId: ${req.traceId}`);
        next();
    } catch (err) {
        handleError(err, res);
    }
}




module.exports = {
    validationController: {
        getFile: (req, res, next) => requestValidatior.getFile(req, res, next),
        listFiles: (req, res, next) => requestValidatior.listFiles(req, res, next),
        deleteFile: (req, res, next) => requestValidatior.deleteFile(req, res, next),
        uploadFile: (req, res, next) => requestValidatior.uploadFile(req, res, next),
        modifyFile: (req, res, next) => requestValidatior.modifyFile(req, res, next),
        createFolder: (req, res, next) => requestValidatior.createFolder(req, res, next),
        deleteFolder: (req, res, next) => requestValidatior.deleteFolder(req, res, next),
    },
    validationMiddleware
}