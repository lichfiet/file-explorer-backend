const parser = require('xml2json');

/**
 * Local Vars
 */


/* Extention Tools */
const getExtentionFromFileName = (fileName) => { return (fileName.split('.').pop()) }

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
