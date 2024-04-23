const utils = require ('./utilityWrapper.js')

/* Request Validation Tools */
const validationHandlers = {
    defaultValidations: (headers) => {
        if (headers.method === undefined) {
            return { message: `Missing Connection Method Header. Header looks like 'method'`, status: 400, };
        } else if (!(headers.method === "S3" || headers.method === "SFTP")) {
            return { message: `Invalid Connection Method. Valid Methods Look Like: S3, SFTP`, status: 400, };
        } else if (headers.sessionid === undefined) {
            return { message: `Bad Request, Missing Session Token Header. Header looks like 'sessionid'`, status: 401, };
        } else {
            return null
        }
    },
    fileInfoValidations: (fileName) => {
        if (fileName === undefined) {
            return { message: `Bad Request, Missing File Name`, status: 400, };
        } else if (utils.extension.checkValid(utils.extension.getFromFileName(fileName))[0] === 3) {
            return { message: `Invalid file extension detected, valid extensions look like: MP4, PNG, JPG, JPEG, GIF, AVI, MOV. Your extension looks like: ${fileExtension}`, status: 400, };
        } else {
            return null
        }
    },
};

const validationTypes = {
        Default: (headers) => {
            return (validationHandlers.defaultValidations(headers) !== null)
        },
        FileInfo: (fileName) => {
            return (validationHandlers.fileInfoValidations(fileName, utils.extension.getFromFileName(fileName)) !== null)
        }
};

const requestValidatior = {
    getFile: (headers, fileName) => {
        if (validationTypes.Default(headers) === true) {
            return validationTypes.Default(headers)
        } else if (validationTypes.FileInfo(fileName) === true) {
            return validationTypes.FileInfo(fileName)
        } else {
            return { message: "Valid Request", status: 200, };
        }
    },
    listFiles: (headers) => {
        if (validationTypes.Default(headers) === true) {
            return validationTypes.Default(headers)
        } else {
            return { message: "Valid Request", status: 200, };
        }
    },
    deleteFile: (headers, fileName) => {
        if (validationTypes.Default(headers) === true) {
            return validationTypes.Default(headers)
        } else if (validationTypes.FileInfo(fileName) === true) {
            return validationTypes.FileInfo(fileName)
        } else {
            return { message: "Valid Request", status: 200, };
        }
    },
    uploadFile: (headers, fileName) => {
        if (validationTypes.Default(headers) === true) {
            return validationTypes.Default(headers)
        } else if (validationTypes.FileInfo(fileName) === true) {
            return validationTypes.FileInfo(fileName)
        } else {
            return { message: "Valid Request", status: 200, };
        }
    }
}




module.exports = {
    validationController: {
        getFile: (headers, fileName) => requestValidatior.getFile(headers, fileName),
        listFiles: (headers) => requestValidatior.listFiles(headers),
        deleteFile: (headers, fileName) => requestValidatior.deleteFile(headers, fileName),
        uploadFile: (headers, fileName) => requestValidatior.uploadFile(headers, fileName),
        modifyFile: (fileProperties, fileName) => requestValidatior.modifyFile(headers, fileName),
    }
}