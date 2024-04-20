const parser = require('xml2json');

/**
 * Local Vars
 */


/* Extention Tools */
const extensionFromFilenameParser = (fileName) => { return (fileName.split('.').pop()) }

const extensionCheck = (fileExtension) => {
    if (RegExp((/^(jpg|jpeg|png)$/i)).test(fileExtension) === true) {
        return ([0, null, "JPG/JPEG/PNG"]) // unsure what other value to return
    } else if (RegExp((/^(gif)$/i)).test(fileExtension) == true) {
        return ([1, null, "GIF"]) // unsure what other value to return
    } else if (RegExp((/^(mov|avi|mp4)$/i)).test(fileExtension) == true) {
        return ([2, null, "MOV/AVI/MP4"]) // unsure what other value to return
    } else {
        return ([3, null, "Directory"])
    };
}

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
        } else if (extensionCheck(extensionFromFilenameParser(fileName))[0] === 3) {
            return { message: `Invalid file extension detected, valid extensions look like: MP4, PNG, JPG, JPEG, GIF, AVI, MOV. Your extension looks like: ${fileExtension}`, status: 400, };
        } else {
            return null
        }
    },
};

const validate = {
        Default: (headers) => {
            return (validationHandlers.defaultValidations(headers) !== null)
        },
        FileInfo: (fileName) => {
            return (validationHandlers.fileInfoValidations(fileName, extensionFromFilenameParser(fileName)) !== null)
        }
};

const requestValidationController = {
    getFile: (headers, fileName) => {
        if (validate.Default(headers) === true) {
            return validate.Default(headers)
        } else if (validate.FileInfo(fileName) === true) {
            return validate.FileInfo(fileName)
        } else {
            return { message: "Valid Request", status: 200, };
        }
    },
    listFiles: (headers) => {
        if (validate.Default(headers) === true) {
            return validate.Default(headers)
        } else {
            return { message: "Valid Request", status: 200, };
        }
    },
    deleteFile: (headers, fileName) => {
        if (validate.Default(headers) === true) {
            return validate.Default(headers)
        } else if (validate.FileInfo(fileName) === true) {
            return validate.FileInfo(fileName)
        } else {
            return { message: "Valid Request", status: 200, };
        }
    },
    uploadFile: (headers, fileName) => {
        if (validate.Default(headers) === true) {
            return validate.Default(headers)
        } else if (validate.FileInfo(fileName) === true) {
            return validate.FileInfo(fileName)
        } else {
            return { message: "Valid Request", status: 200, };
        }
    }
}

/* Data Tools */
const parseJson = (xml) => parser.toJson(xml)


module.exports = utils = {
    extension: {
        getFromFileName: (fileName) => extensionFromFilenameParser(fileName),
        checkValid: (fileExtension) => extensionCheck(fileExtension)
    },

    data: {
        xmlToJson: (xml) => parseJson(xml)
    },

    validateRequest: {
        getFile: (headers, fileName) => requestValidationController.getFile(headers, fileName),
        listFiles: (headers) => requestValidationController.listFiles(headers),
        deleteFile: (headers, fileName) => requestValidationController.deleteFile(headers, fileName),
        uploadFile: (headers, fileName) => requestValidationController.uploadFile(headers, fileName),
        modifyFile: (fileProperties, fileName) => requestValidationController.modifyFile(headers, fileName),
    }
}
