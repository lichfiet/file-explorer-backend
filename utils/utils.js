const parser = require('xml2json');

module.exports = utils = {
    extension: {

        getFromFileName: function(fileName) {
            return(fileName.split('.').pop());
        },

        checkValid: function (fileExtension) {
            if (RegExp((/^(jpg|jpeg|png)$/i)).test(fileExtension) === true) {
                return ([0, null, "JPG/JPEG/PNG"]) // unsure what other value to return

            } else if (RegExp((/^(gif)$/i)).test(fileExtension) == true) {
                return ([1, null, "GIF"]) // unsure what other value to return

            } else if (RegExp((/^(mov|avi|mp4)$/i)).test(fileExtension) == true) {
                return ([2, null, "MOV/AVI/MP4"]) // unsure what other value to return

            } else {
                return ([3, null, "Directory"])
            };
        },

    },

    data: {
        xmlToJson: (xml) => {
            let data = parser.toJson(xml); // turns xml to Json
            return (data)
        }

    }
};