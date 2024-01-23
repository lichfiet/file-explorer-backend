/** 
 ** App Packages 
 */
const express = require('express');
const app = express();
const cors = require('cors');
const dotenv = require('dotenv') // for use of environment variables
const multer = require('multer');
const fs = require('fs');
//* Logging
const logger = require('./utils/logger.js')
//

logger.info('STARTING SERVER' + '\n')


/**
 ** App Setup
 */
app.use(cors())
logger.info("Local Variables: " + JSON.stringify(dotenv.config({ path: './config.env' }))); // Prints Local Variables
const upload = multer({ dest: 'uploads/' }); // Set up multer for handling file uploads


/**
 * *Import Utilities 
*/
const utils = require('./utils/utils.js');
const files = require('./utils/fileRequests.js'); // For s3 / sftp connections
logger.info("Imported Utilities");



/**
 * 
 * Routes:
 * - /(Static Index Page)
 * - /getFile
 * - /listFiles
 * - /uploadFile
 * - /deleteFile
 * - /copyFile // TO BE ADDED
 * 
 */



/**
 * Static Index Page
 */
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});


/**
 * 
 * /getFile - Endpoint to fetch a file by its name
 * 
 * currently just takes /getFile/{fileName} argument in the URL,
 * 
 */
app.get('/getFile/:fileName', async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const method = req.headers.method; // Look for connection method in HTTP header
  logger.info('Connection Method: ' + JSON.stringify(method)); // Log it

  const fileName = (req.params.fileName) // Init file name from URL
  const fileExtension = utils.extension.getFromFileName(fileName) // Get the file extension from file name

  //* Checking if the file extension is valid
  if (utils.extension.checkValid(fileExtension)) {
    logger.info("Request for file: " + fileName + " has been made", '\n')

    const config = {
      // to be deprecated once the connection info can be queried from a sql server
      host: process.env.SFTP_URL,
      port: process.env.SFTP_PORT, // Typically 22 for SFTP
      username: process.env.SFTP_USERNAME,
      password: process.env.SFTP_PASSWORD
    }

    const validation = files.requestValidation(req.headers) //! will move to the auth section or have a whole different validation handler

    try {

      logger.info(validation)

      if (validation.status !== 200) {
        throw new Error('Error Validating Request, ')
      } else {
        logger.info('Request Validated');
      };

        if (method === 'S3') {
        // IF S3
        logger.info("Grabbing S3 File..."); //Get file from the S3 server

        const s3Data = await files.s3Functions.getFile(fileName);

        res.contentType('image/*');

        res.status(200).send(s3Data); //

      } else if (method === 'SFTP') {

        logger.info("Grabbing file from the file server...");
        const imageBuffer = await files.sftpFunctions.get(fileName, config); // Retrieve the file from the SFTP server

        res.contentType('image/*'); // Define Content Type
        res.status(200).send(imageBuffer); // Send blob as response

      }

    } catch (err) {
      logger.error('\n', err);
      res.status((validation.status !== undefined ? validation.status : 400)).send((validation.message !== undefined ? err + validation.message : "Error Retrieving File: " + err));
      logger.error("Error Retrieving File (" + err + ")")
    }

  } else {
    logger.error("Request for file: " + fileName + " has not been made, please check file extension")
    res.status(400).send("Request for file: " + fileName + " has not been made, please check file extension");
  }
});


/**
 *  /listFilesDev to fetch file list
 */
app.get('/listFilesDev', async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const method = req.headers['method']; // Look for connection method in HTTP header
  logger.info('Connection Method: ' + method); // Log it

  const config = {
    // to be deprecated once the connection info can be queried from a sql server
    host: process.env.SFTP_URL,
    port: process.env.SFTP_PORT, // Typically 22 for SFTP
    username: process.env.SFTP_USERNAME,
    password: process.env.SFTP_PASSWORD
  }

  const validation = files.requestValidation(req.headers) //! will move to the auth section or have a whole different validation handler

  try {

    if (validation.status !== 200) {
      throw new Error('Error Validating Request, ')
    } else {
      logger.info('Request Validated');
    };

    if (method === 'S3') {

      // IF S3
      logger.info("Listing S3 Files..."); // List files from the S3 server
      res.status(200).send(await files.s3Functions.listFiles());

    } else if (method === 'SFTP') {

      // IF SFTP
      logger.info("Listing SFTP Files..."); // List files from the SFTP server
      res.status(200).send(await files.sftpFunctions.list(config));

    }
  } catch (err) {

    // Send error to the client and log it
    res.status(500).send('Error Retrieving File List: ' + err);
    logger.error('Error Retrieving File List: ' + err);

  } finally {

    logger.info('File List Request Completed')

  }
}
);

/**
 * /uploadFile to upload file to sftp or s3
 */
app.post('/uploadFile', upload.single('fileUpload'), async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const method = req.headers.method

  const config = {
    // to be deprecated once the connection info can be queried from a sql server
    host: process.env.SFTP_URL,
    port: process.env.SFTP_PORT, // Typically 22 for SFTP
    username: process.env.SFTP_USERNAME,
    password: process.env.SFTP_PASSWORD
  }

  logger.info("Upload Initiated...");
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  const validation = files.requestValidation(req.headers) //! will move to the auth section or have a whole different validation handler

  try {

    if (validation.status !== 200) {
      throw new Error('Error Validating Request, ')
    } else {
      logger.info('Request Validated');
    };

    if (method === 'S3') {
            // Read the local file
            logger.info("Reading File...");
            const localFilePath = req.file.path;
            const fileData = fs.createReadStream(localFilePath);
      
            const fileName = req.file.originalname;
      
            // Upload file to SFTP server
            logger.info("Uploading File....")

      // IF S3
      logger.info("Listing S3 Files..."); // List files from the S3 server
      res.status(200).send(await files.s3Functions.uploadFile(fileData, fileName));

    } else if (method === 'SFTP') {
      // Read the local file
      logger.info("Reading File...");
      const localFilePath = req.file.path;
      const fileData = fs.createReadStream(localFilePath);

      const fileName = req.file.originalname;

      // Upload file to SFTP server
      logger.info("Uploading File....")
      await files.sftpFunctions.upload(fileData, fileName, config);

      res.status(200).send({ "status": 'File uploaded successfully.', "pathto": `/home/ftpuser/files/${req.file.originalname}` });

    } else {
      console.log('resume friendly word to handle error');
    }
  } catch (err) {
    logger.error(err);
    res.status(500).send({ "status": 'Error uploading file.' });
  } finally {
    fs.unlinkSync(req.file.path);
  }
});

app.delete('/deleteFile/:fileName', async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");

  let fileName = (req.params.fileName)
  logger.info(req.params.fileName)

  const method = req.headers.method

  const config = {
    // to be deprecated once the connection info can be queried from a sql server
    host: process.env.SFTP_URL,
    port: process.env.SFTP_PORT, // Typically 22 for SFTP
    username: process.env.SFTP_USERNAME,
    password: process.env.SFTP_PASSWORD
  }

  const validation = files.requestValidation(req.headers) //! will move to the auth section or have a whole different validation handler

  logger.info(validation)

  try {

    if (validation.status !== 200) {
      throw new Error('Error Validating Request, ')
    } else {
      logger.info('Request Validated');
    };

    if (method === 'S3') {

      res.status(200).send(await files.s3Functions.deleteFile(fileName))

    } else if (method === 'SFTP') {
      logger.info("Deleting...");
    
      try {
        // Read the local file
        logger.info("Grabbing file name from request...");
    
        // Upload file to SFTP server
        logger.info("Deleting File....")
        await files.sftpFunctions.delete(fileName, config);
    
        res.status(200).send({ "status": 'File deleted successfully.' });
      } catch (err) {
        logger.error(err);
        res.status(500).send('Error uploading file.');
      } finally {
    
        logger.info('File Deletion Request Completed')
    
      }
    } else {
      console.log('resume friendly word to handle error')
    }
  } catch (err) {
    logger.error(err);
    res.status(500).send({ "status": 'Error uploading file.' });
  } finally {
  }
});



const PORT = process.env.PORT
app.listen(PORT, () => {
  logger.info('\n', `Server is running on port ${PORT}`, '\n');
});
