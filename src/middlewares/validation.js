const utils = require('../utils/utilityWrapper.js');
const logger = require('./logger.js');

const validateMethodHeader = (headers) => {
    let err = new Error();

    if (headers.method === undefined) {
        err.message = `Bad Request, Missing Connection Method`
        err.status = 400
        throw err;
    } else if (!(headers.method === "S3" || headers.method === "SFTP")) {
        err.message = `Invalid Connection Method. Valid Methods Look Like: S3, SFTP`
        err.status = 400
        throw err;
    } else {
        return null
    }
};

const validateFileName = (fileName) => {
    let err = new Error();
    let fileExtension = utils.extension.getFromFileName(fileName);

    if (fileName === undefined) {
        err.message = `Bad Request, Missing File Name`;
        err.status = 400;
        throw err;
    } else if (utils.extension.checkValid(utils.extension.getFromFileName(fileName))[0] === 3) {
        err.message = `Invalid file extension detected, valid extensions look like: MP4, PNG, JPG, JPEG, GIF, AVI, MOV. Your extension looks like: ${fileExtension}`;
        err.status = 400
        throw err;
    } else {
        return null;
    }
};

const validateFileProperties = (file) => {
    let err = new Error();
}


const handleError = (err, res) => {
    logger.error(err.message);
    res.status(err.status).send(err.message);
};

const requestValidatior = {
    getFile: (req, res, next) => {
        try {
            validateMethodHeader(req.headers);
            validateFileName(req.params.fileName);
            next();
        } catch (err) {
            handleError(err, res);
        } finally { };
    },
    listFiles: (req, res, next) => {
        try {
            validateMethodHeader(req.headers);
            next();
        } catch (err) {
            handleError(err, res);
        } finally { };
    },
    deleteFile: (req, res, next) => {
        try {
            validateMethodHeader(req.headers);
            validateFileName(req.params.fileName);
            next();
        } catch (err) {
            handleError(err, res);
        } finally { };
    },
    uploadFile: (req, res, next) => {
        try {
            validateMethodHeader(req.headers);
            validateFileName(req.file.originalname);
            next();
        } catch (err) {
            handleError(err, res);
        } finally { };
    },
    modifyFile: (req, res, next) => {
        try {
            validateMethodHeader(req.headers);
            validateFileProperties(req.body);
            next();
        } catch (err) {
            logger.debug(err);
            //handleError(err, res);
        } finally { };
    }
}




module.exports = {
    validationController: {
        getFile: (req, res, next) => requestValidatior.getFile(req, res, next),
        listFiles: (req, res, next) => requestValidatior.listFiles(req, res, next),
        deleteFile: (req, res, next) => requestValidatior.deleteFile(req, res, next),
        uploadFile: (req, res, next) => requestValidatior.uploadFile(req, res, next),
        modifyFile: (req, res, next) => requestValidatior.modifyFile(req, res, next),
    }
}