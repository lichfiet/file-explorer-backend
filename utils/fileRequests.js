const axios = require('axios');
const utils = require('./utils.js');
const logger = require('./logger.js');

const SftpClient = require('ssh2-sftp-client');
const sftpConfig = {
    host: 'localhost',
    port: '22', // Typically 22 for SFTP
    username: 'ftpuser',
    password: 'pass'
}

const client = new SftpClient()

const sftpConnect = () => client.connect(sftpConfig)
const sftpDisconnect = () => client.end()

module.exports = files = {
    s3Functions: {

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
                    const fileExtension = utils.extension.getFromFileName(name);
                    const extensionType = (utils.extension.checkValid(fileExtension))[0]; // 0: Img, 1: Gif, 2: Video

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

    },
    sftpFunctions: {

        // GET Endpoint to retrieve files
        get: async function (fileName) {

            logger.info("Attempting Connection with file server...");
            await sftpConnect()

            logger.info("Communication Success...", '\n');

            let file = await (client.get(fileName))

            await sftpDisconnect()
            logger.info("Request fulfilled, closing connection.", '\n')

            logger.info("Sending the file to client...");
            return (file);
        },

        // GET Endpoint to retrieve directory contents
        list: async function () {
            logger.info("Attempting Connection with file server...");
            await sftpConnect()

            logger.info("Communication Success...", '\n');

            let list = await client.list('/home/ftpuser/')

            await sftpDisconnect()
            logger.info("Request fulfilled, closing connection.", '\n')

            logger.info("Sending the file list to client...");

            const formattedContents = [];
            for (var key in list) {
        
              const name = list[key]["name"]
              const type = list[key]["type"]
              const fileExtension = utils.extension.getFromFileName(name);
              const extensionType = (utils.extension.checkValid(fileExtension))[0]; // 0: Img, 1: Gif, 2: Video
        
              // Build array with item name and type (dir or file)
              formattedContents.push({
                fileName: name, 
                fileType: type, 
                fileExtension: (type === "-" ? fileExtension : "Dir"), // If File, add extension
                fileExtensionType: (type === "-" ? extensionType : "Dir"), // If File, add extension type
              })
        
            }
        
            logger.info(formattedContents); // Return console log of contents

            return(formattedContents);

        },

        // PUT endpoint to upload file
        upload: async function (fileData, test) {
            logger.info("Attempting Connection with file server...");
            await sftpConnect()

            logger.info("Communication Success...", '\n');

            let upload = await client.put(fileData, test)

            await sftpDisconnect()
            logger.info("Request fulfilled, closing connection.", '\n')

            logger.info("Sending the file list to client...");
            return (upload);
        },

        delete: async function (fileName) {
            logger.info("Attempting Connection with file server...");
            await sftpConnect()

            logger.info("Communication Success...", '\n');

            let del = await client.delete(fileName)

            await sftpDisconnect()
            logger.info("Request fulfilled, closing connection.", '\n')

            logger.info("Sending the file list to client...");
            return (del);


        }

    }
}


