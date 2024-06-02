const parser = require('xml2json');
const logger = require('../middlewares/logger');

/**
 * Local Vars
 */


/* Extention Tools */
const getExtentionFromFileName = (fileName) => {

    const splitFileName = fileName.split('.');
    let fileExtension = splitFileName[splitFileName.length - 1];

    const directoryCheck = (fileName) => {
        const lastChar = fileName[fileName.length - 1];
        lastChar === '/' ? fileExtension = '/' : null;
    };

    directoryCheck(fileName);

    return fileExtension
};

const extensionCheck = (fileExtension) => {

    const checkExtension = (fileExtension) => {
        if (RegExp((/^(jpg|jpeg|png)$/i)).test(fileExtension) === true) {
            return ([0, null, "JPG/JPEG/PNG"]) // unsure what other value to return
        } else if (RegExp((/^(gif)$/i)).test(fileExtension) == true) {
            return ([1, null, "GIF"]) // unsure what other value to return
        } else if (RegExp((/^(mov|avi|mp4)$/i)).test(fileExtension) == true) {
            return ([2, null, "MOV/AVI/MP4"]) // unsure what other value to return
        } else if (fileExtension === '/' || fileExtension === undefined) {
            return ([3, null, "Directory"])
        } else {
            return ([99, null, "N/A"])   
        };
    }

    return checkExtension(fileExtension);
};

/* Data Tools */
const xmlToJsonParser = (xml) => parser.toJson(xml)


module.exports = utils = {
    extension: {
        getFromFileName: (fileName) => getExtentionFromFileName(fileName),
        checkValid: (fileExtension) => extensionCheck(fileExtension)
    },

    data: {
        xmlToJson: (xml) => xmlToJsonParser(xml)
    },

}
