const axios = require('axios');
const apiTools = require('./apiTools.js');

module.exports = files = {

    listFiles: async () => {
        
        const response = await axios.get(`https://dl4z61qaj4.execute-api.us-east-1.amazonaws.com/dev/listFiles/file-conv-bucket`)

        const jsonData = apiTools.xmlToJson(response.data);

        const extractedFiles = JSON.parse(jsonData).ListBucketResult.Contents.map((key) => key.Key)


        console.log(extractedFiles)

        return(extractedFiles)
    }

} 
