/**
 * App Packages
 */
const axios = require('axios');
const utils = require('./utils.js');
const logger = require('./logger.js');
const SftpClient = require('ssh2-sftp-client');
const he = require('he');

/**
 * Var Setup
 */
const client = new SftpClient()
const sftpConnect = (config) => client.connect(config)
const sftpDisconnect = () => client.end()

class File {
    constructor(fileName, fileType, fileExtension, fileExtensionType) {
        this.fileName = fileName;
        this.fileType = fileType;
        this.fileExtension = fileExtension;
        this.fileExtensionType = fileExtensionType;
    }
}

const createFile = (name) => {
    const type = (name.search("/") === -1 ? "-" : "d");
    const fileExtension = (type === "-" ? utils.extension.getFromFileName(name) : "Dir");
    const extensionType = (type === "-" ? (utils.extension.checkValid(fileExtension))[0] : "Dir");
    return new File(name, type, fileExtension, extensionType);
};


module.exports = files = {
    s3Functions: {

        listFiles: async () => {
            logger.info('Requesting files from S3 Bucket');

            try {
                // Get data from s3 and convert to JSON
                const response = await axios.get(`${process.env.S3_URL}/listFiles/file-explorer-s3-bucket`);
                let jsonData = utils.data.xmlToJson(response.data);
                const extractedFiles = JSON.parse(jsonData).ListBucketResult.Contents;
                logger.info('Files Extracted: ' + JSON.stringify(extractedFiles));

                // Format files into array of File objects
                let formattedContents = [];
                if (extractedFiles === undefined) {
                    logger.info('No Files Found');
                    formattedContents = [new File("No Files", "d", "Dir", "Dir")];
                } else {
                    logger.info('Files found, formatting...');
                    formattedContents = [].concat(extractedFiles).map(file => createFile(file.Key));
                    logger.info('Files Returned: ' + formattedContents.length);
                }

                return formattedContents;
            } catch (err) {
                logger.error('Error Occured Requesting File From Bucket: ' + err);
            } finally {
                logger.info('S3 Request Completed');
            }
        },
        getFile: async (fileName) => {

            try {

                logger.info(`Requesting file ${fileName} from S3 Bucket`)
                const response = await axios.get(`${process.env.S3_URL}/getFile/file-explorer-s3-bucket/${fileName}`, {
                    responseType: 'arraybuffer', // Ensure that response type is set to arraybuffer
                });

                logger.info('File Grabbed.');

                if (response.data && response.data.length > 0) {
                    return Buffer.from(response.data, 'binary'); // Convert array buffer to Buffer
                } else {
                    logger.error('Empty response data.');
                    return null;
                }
            } catch (err) {
                logger.error('Error Occurred Requesting File From Bucket: ' + err);
                throw err;
            } finally {
                logger.info('S3 List Request Completed');
            }

        },
        uploadFile: async function (fileData, fileName) {
            logger.info("Uploading file to S3 Bucket");

            try {

                let upload = await axios.put(`${process.env.S3_URL}/uploadFile/file-explorer-s3-bucket/${fileName}`, fileData)
    
                logger.info("Sending upload status");
                return (upload.body);

            } catch (err) {
                logger.error('Error Occurred Uploading File To Bucket: ' + err);
            } finally {
                logger.info('S3 Upload Request Completed');
            }
        },
        deleteFile: async (fileName) => {
            logger.info('Deleting file from S3 Bucket')
            try {
                // list files and see if request is valid before deleting
                const fileList = await axios.get(`${process.env.S3_URL}/listFiles/file-explorer-s3-bucket`) // get data from s3

                const extractedFiles = JSON.parse(utils.data.xmlToJson(fileList.data)).ListBucketResult.Contents // define variable with the array of files

                let formattedContents = [];

                if (extractedFiles.constructor !== Array) {
                    logger.error("SINFGLE GFE")
                   formattedContents.push(extractedFiles.Key)
                } else {
                    for (var key in extractedFiles) {formattedContents.push(extractedFiles[key]["Key"])} 
                }
                
                logger.info("Extracted File List")

                logger.info(formattedContents)
                
                // if the file is a file in the bucket, then else
                if (formattedContents.includes(fileName) === true) {
                    const response = await axios.delete(`${process.env.S3_URL}/deleteFile/file-explorer-s3-bucket/${fileName}`) // get data from s3
                    // if response from aws is good
                    if (response.status !== 200) {
                        throw new Error(`Error received from S3 API: ${response.body}`)
                    } else {
                        return("File successfully deleted from S3 Bucket")
                    }
                } else {
                    throw new Error(`File requested for deletion does not exist, files look like: ${formattedContents}`)
                }

            } catch (err) {
                logger.error(err.message)
                throw new Error(err.message)
            } finally {
                logger.info('S3 Request Completed')
            }
        }

    },
    sftpFunctions: {

        // GET Endpoint to retrieve files
        get: async function (fileName, config) {

            logger.info("Attempting Connection with file server...");
            await sftpConnect(config)

            logger.info("Communication Success...", '\n');

            let file = await (client.get(fileName))

            await sftpDisconnect()
            logger.info("Request fulfilled, closing connection.", '\n')

            logger.info("Sending the file to client...");
            return Buffer.from(file); // Convert array buffer to Buffer
        },

        // GET Endpoint to retrieve directory contents
        list: async function (config) {
            logger.info("Attempting Connection with file server...");

            await sftpConnect(config)

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

            return (formattedContents);

        },

        // PUT endpoint to upload file
        upload: async function (fileData, test, config) {
            logger.info("Attempting Connection with file server...");
            await sftpConnect(config)

            logger.info("Communication Success...", '\n');

            let upload = await client.put(fileData, test)

            await sftpDisconnect()
            logger.info("Request fulfilled, closing connection.", '\n')

            logger.info("Sending upload status");
            return (upload);
        },

        delete: async function (fileName, config) {

            try {
                logger.info("Attempting Connection with file server...");
                await sftpConnect(config)
                logger.info("Communication Success...");
                let list = await client.list('/home/ftpuser/')

                // grab file list
                const formattedContents = [];
                for (var key in list) {formattedContents.push(list[key]["name"])}

                // check if file requested is in list
                if (formattedContents.includes(fileName) === true) {
                    await client.delete(fileName)
                    return("File successfully deleted from SFTP Folder")
                } else {
                    throw new Error(`File requested for deletion does not exist, files look like: ${formattedContents}`)
                }

            } catch (err) {
                throw new Error(err.message)
            } finally {
                await sftpDisconnect()
                logger.info("Request fulfilled, closing connection.")
            }
        }

    },

    requestValidation: (headers, fileExtension) => {

        let method = headers.method
        let sessionid = headers.sessionid

        let validateFunction = (sessionid) => {
            return (sessionid !== 'true' ? false : true)
        }

        if (headers.method === undefined) {

            return({
                message: `Missing Connection Method Header. Header looks like 'method'`,
                status: 400
            });

        } else if (!(method === 'S3' || method === 'SFTP')) {

            return({
                message: `Invalid Connection Method. Valid Methods Look Like: S3, SFTP`,
                status: 400
            });

        } else if (sessionid === undefined) {

            return ({
                message: `Bad Request, Missing Session Token Header. Header looks like 'sessionid'`,
                status: 401
            });

        } else if (validateFunction(sessionid) !== true) {

            return ({
                message: `Unable to Authenticate`,
                status: 401
            });

        } else if (fileExtension === `listFiles`) {
            return ({
                message: `N/A`,
                status: 200
            }); 
        } else if (utils.extension.checkValid(fileExtension)[0] === 3) {

            return ({
                message: `Invalid file extension detected, valid extensions look like: MP4, PNG, JPG, JPEG, GIF, AVI, MOV. Your extension looks like: ${fileExtension}`,
                status: 400
            });            

        } else {

            return ({
                message: 'Valid Request',
                status: 200
            });

        }

    }
}


