var parser = require('xml2json');

module.exports = apiTools = {

    xmlToJson: (xml) => {
        //console.log("xml input -> %s", xml)

        let data = parser.toJson(xml);

        return(data)
    }

}