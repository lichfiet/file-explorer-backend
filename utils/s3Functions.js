const axios = require('axios');
const utils = require('./utils.js');
const logger = require('./logger.js');

module.exports = s3Functions = {
  files: {

    listFiles: async () => {

      try {
        logger.info('Requesting files from S3 Bucket')

        const response = await axios.get(process.env.S3_URL) // get data from s3
        let jsonData = utils.data.xmlToJson(response.data); // format xml to json data
  
        const extractedFiles = JSON.parse(jsonData).ListBucketResult.Contents // define variable with the array of files
  
        const formattedContents = [];
        for (var key in extractedFiles) {
  
          const name = extractedFiles[key]["Key"]
          const type = (name.search("/") === -1 ? "-" : "D") // need to implement handler to determine if key is a directory path
          const fileExtension = extension.getFromFileName(name);
          const extensionType = (extension.checkValid(fileExtension))[0]; // 0: Img, 1: Gif, 2: Video
  
          // Build array with item name and type (dir or file)
          formattedContents.push({
            fileName: name, // s3 contents Key value 
            fileType: type, // Directory or File
            fileExtension: (type === "-" ? fileExtension : "Dir"), // If File, add extension
            fileExtensionType: (type === "-" ? extensionType : "Dir"), // If File, add extension type
          })
        }

        logger.info(JSON.stringify(formattedContents))
        return (formattedContents)
        
      } catch (err) {

        logger.error('Error Occured Requesting File From Bucket: ' + err)

      } finally {

        logger.info('S3 Request Completed')

      }

 


    }

  }
}
