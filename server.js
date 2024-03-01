/** 
 ** App Packages 
 */
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv') // for use of environment variables
const multer = require('multer');
const fs = require('fs');
const https = require('https');
const http = require('http');

/** 
 * * Observability
 */
const logger = require('./utils/logger.js') // logging

/**
 ** App Setup
 */
const app = express();
app.use(cors());
const config = dotenv.config({ path: './config.env' }); // Prints Local Variables
const upload = multer({ dest: 'uploads/' }); // Set up multer for handling file uploads
logger.info("Env Vars: " + JSON.stringify(config))
const db = require('./utils/db.js'); // test
db.connect(); // connect to sql DB
db.refreshModels();

const PORT = process.env.PORT



/**
 * *Import Utilities 
*/
const utils = require('./utils/utils.js');
const files = require('./utils/fileRequests.js'); // For s3 / sftp connections
logger.info("Imported Utilities");

/**
 * * HTTPS Setup
 */
const privateKey = fs.readFileSync('sslcert/server.key', 'utf8'); // key
const certificate = fs.readFileSync('sslcert/server.crt', 'utf8'); // cert
const credentials = {key: privateKey, cert: certificate};  
const httpsServer = https.createServer(credentials, app); // server var

const httpServer = http.createServer(app); // server var
/**
 * 
 * Routes:
 * - /(Static Index Page)
 * - /getFile
 * - /listFiles
 * - /uploadFile
 * - /deleteFile
 * - /copyFile // TO BE ADDED
 * - /renameFile // TO BE ADDED
 * 
 */

logger.info('Starting server....')

/**
 * Static Index Page
 */
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

/**
 * * /getFile - Endpoint to fetch a file by its name
 * 
 * currently just takes /getFile/{fileName} argument in the URL,
 */
app.get('/getFile/:fileName', async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const method = req.headers.method; // Look for connection method in HTTP header
  const fileName = (req.params.fileName) // Init file name from URL
  const fileExtension = utils.extension.getFromFileName(fileName) // Get the file extension from file name

  const validation = files.requestValidation(req.headers, fileExtension) //! will move to the auth section or have a whole different validation handler

  logger.info("Request for file: " + fileName + " has been made")

    try {

      if (validation.status !== 200) {
        // Check request headers and auth
        throw new Error(`Error Validating Request, ${validation.message}`)
      } else if (1 + 1 !== 2 /** will replace with authentication handler */) {
        // authenticate request
        throw new Error(`Error Authenticating Request, ${validation.message}`)
      }

      logger.info(validation.message)

      const config = {
        // to be deprecated once the connection info can be queried from a sql server
        host: process.env.SFTP_URL,
        port: process.env.SFTP_PORT, // Typically 22 for SFTP
        username: process.env.SFTP_USERNAME,
        password: process.env.SFTP_PASSWORD
      }

      if (method === 'S3') {

        logger.info("Grabbing S3 File..."); // logging
        const s3Data = await files.s3Functions.getFile(fileName); //Get file from the S3 server
        res.contentType('image/*'); // set response content type
        res.status(200).send(s3Data); // send image

      } else if (method === 'SFTP') {

        logger.info("Grabbing file from the file server..."); // logging
        const imageBuffer = await files.sftpFunctions.get(fileName, config); // Retrieve the file from the SFTP server
        res.contentType('image/*'); // Define Content Type
        res.status(200).send(imageBuffer); // Send blob as response

      }

    } catch (err) {
      logger.error(validation.message) // log

      res.status((validation.status !== undefined ? validation.status : 400)).send((validation.message !== undefined ? `${err}` : `Error Retrieving File: ${err}`));

    } finally {
      logger.info(`Request completed`)
    }


});

/**
 * * /listFilesDev to fetch file list
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

  const validation = files.requestValidation(req.headers, "listFiles") //! will move to the auth section or have a whole different validation handler

  try {

    if (validation.status !== 200) {
      // Check request headers and auth
      throw new Error(`Error Validating Request, ${validation.message}`)
    } else if (1 + 1 !== 2 /** will replace with authentication handler */) {
      // authenticate request
      throw new Error(`Error Authenticating Request, ${validation.message}`)
    }

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

    logger.error('Error Retrieving File List: ' + err);

    // Send error to the client and log it
    res.status(400).send('Error: ' + err.message);
    

  } finally {

    logger.info('File List Request Completed')

  }
}
);

/**
 * * /uploadFile to upload file to sftp or s3
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

  //const validation = files.requestValidation(req.headers) //! will move to the auth section or have a whole different validation handler

  try {

    /**
    if (validation.status !== 200) {
      throw new Error('Error Validating Request, ')
    } else if (!req.file) {
      throw new Error('Bad Request, missing file data')
    } else {
      logger.info('Request Validated');
    }; */

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

      res.status(200).send(`File uploaded successfully. /home/ftpuser/files/ ${req.file.originalname}`);
    }

  } catch (err) {
    logger.error(err);
    res.status(400).send({ "status": 'Error uploading file.' });
  } finally {
    fs.unlinkSync(req.file.path);
  }
});

/**
 * * /deleteFile to delete files
 */
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

  const validation = files.requestValidation(req.headers, utils.extension.getFromFileName(fileName)) //! will move to the auth section or have a whole different validation handler

  try {

    // validate request
    if (validation.status !== 200) {
      throw new Error(`Error Validating Request, ${validation.message}`)
    } else {
      logger.info(validation.message);
    };

    logger.info("Deleting File....")

    // if s3
    if (method === 'S3') {
      try {
        res.status(200).send( await files.s3Functions.deleteFile(fileName))
      } catch (err) {
        res.status(400).send(`Error: ${err.message}`)
      }
    }
    
    // if sftp
    if (method === 'SFTP') {    
      try {
        res.status(200).send(await files.sftpFunctions.delete(fileName, config));
      } catch (err) {
        res.status(400).send(`Error: ${err.message}`);
      }

    } 

  } catch (err) {
    res.status(400).send(`Error: ${err}`);
  } finally {
  }
});

/**
 * * /health for healthchecks in the future
 */
app.get('/health', async (req, res) => {
  res.status(200).send('Server Running')
})

app.get('/sqlTest', async (req, res) => {
  const meow = await db.test()
  logger.info("test2")

  let files = ['meow', 'bob']

  for (var key in meow) {
    if (files.includes(meow[key].fileName) === true) {
      logger.error('exists');
    } else {
      files.push(meow[key].fileName);
    }
  }

  res.status(200).send(files)
})

// START SERVER
httpServer.listen(PORT, () => {

  logger.info(`Server is running on port ${PORT}`);

});
