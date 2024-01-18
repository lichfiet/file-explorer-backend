var parser = require('xml2json');

module.exports = apiTools = {

    /** XML => JSON function
     * @param {xml} // XML format data 
     * @returns {data} // JSON format data
     */
    xmlToJson: (xml) => {
        ////console.log("xml input -> %s", xml)
        // @param {param}
        let data = parser.toJson(xml); // turns xml to Json
        return(data)
    }

}