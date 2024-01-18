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
logger.info("Local Variables: " + JSON.stringify(dotenv.config({path: './config.env'}))); // Prints Local Variables
const upload = multer({ dest: 'uploads/' }); // Set up multer for handling file uploads


/** Import Utilities */
const extension = require('./utils/extensiontools.js');
const sftp = require('./utils/sftpTools.js');
const s3Functions = require('./utils/s3Functions.js'); // file formatting functions, will deprecate use of extension tools with utils and other functions
const utils = require('./utils/utils.js');
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
 * * /getFile - Endpoint to fetch a file by its name
 * 
 * currently just takes /getFile/{fileName} argument in the URL,
 * 
 * TODO: but will soon set it up in request params and use jwt to encode the requests and responses
 * 
 */
app.get('/getFile/:fileName', async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const fileName = (req.params.fileName) // Init file name from URL
  const fileExtension = utils.extension.getFromFileName(fileName) // Get the file extension from file name

  //* Checking if the file extension is valid
  if (utils.extension.checkValid(fileExtension)) {
    logger.info("Request for file: " + fileName + " has been made", '\n')


    try {      
      logger.info("Grabbing file from the file server...", '\n');
      const imageBuffer = await sftp.get(fileName); // Retrieve the file from the SFTP server

      res.contentType("/blob"); // Define Content Type
      res.status(200).send(imageBuffer); // Send blob as response

    } catch (err) {
      logger.error('\n', err);
      res.status(500).send("Error Retrieving File (" + err + ")");
      logger.error("Error Retrieving File (" + err + ")")
    }
    
  } else {
    logger.error("Request for file: " + fileName + " has not been made, please check file extension", '\n')
    res.status(400).send("Invalid File Input Type");
  }
});

app.get('/listFilesDev', async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");

  var connectMethod = req.headers['method']; // Look for connection method in HTTP header
  logger.warn(connectMethod);

  try {
    if (connectMethod === undefined) {
      res.status(400).send('Bad Request, missing Connection Method Header');
    } else if (!(connectMethod === 'S3' || connectMethod === 'SFTP')) {
      res.status(400).send('Bad Request, invalid Connection Method');
    } else if (connectMethod === 'S3') {

      // IF S3
      res.status(200).send(await s3Functions.files.listFiles());

    } else if (connectMethod === 'SFTP') {
      // List files from the SFTP server
      logger.info("Listing Files...");
      const fileList = await sftp.list();
      logger.info("Grabbed List....");

      const testarr = [];
      // Grab File Names
      for (var key in fileList) {
        const name = "name"
        logger.info(fileList[key][name])
        testarr.push(fileList[key][name])
        logger.info(key);
        logger.info(fileList[key]);
      }
      logger.info(testarr)

      res.status(200).send(JSON.stringify(testarr));

    }
  } catch (err) {
    res.status(500).send('Error Retrieving File List: ' + err);
    logger.error('Error Retrieving File List: ' + err);
  } finally {

  }
}
);

// Endpoint to get a list of files
app.get('/listFiles', async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");

  try {
    // List files from the SFTP server
    logger.info("Listing Files...");
    const fileList = await sftp.list();
    logger.info("Grabbed List....");

    const testarr = [];
    // Grab File Names
    for (var key in fileList) {
      const name = "name"
      logger.info(fileList[key][name])
      testarr.push(fileList[key][name])
      logger.info(key);
      logger.info(fileList[key]);
    }
    logger.info(testarr)

    res.status(200).send(JSON.stringify(testarr));
  } catch (err) {
    logger.error(err);
    res.status(500).send('Error retrieving image from SFTP');
  }
});

// Handle file upload
app.post('/uploadFile', upload.single('fileUpload'), async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");

  logger.info("Upload Initiated...");
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  try {
    // Read the local file
    logger.info("Reading File...");
    const localFilePath = req.file.path;
    const fileData = fs.createReadStream(localFilePath);

    const test = req.file.originalname;

    // Upload file to SFTP server
    logger.info("Uploading File....")
    await sftp.upload(fileData, test);

    res.status(200).send({"status": 'File uploaded successfully.', "pathto": `/home/ftpuser/files/${req.file.originalname}`});
  } catch (err) {
    logger.error(err);
    res.status(500).send({"status": 'Error uploading file.'});
  } finally {
    fs.unlinkSync(req.file.path);
  }
});

app.delete('/deleteFile/:fileName', async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");

  logger.info("Deleting...");

  let fileName = (req.params.fileName)
  logger.info(req.params.fileName)

  try {
    // Read the local file
    logger.info("Grabbing file name from request...");

    // Upload file to SFTP server
    logger.info("Deleting File....")
    await sftp.delete(fileName);

    res.status(200).send({"status": 'File deleted successfully.'});
  } catch (err) {
    logger.error(err);
    res.status(500).send('Error uploading file.');
  } finally {
  }
});

// Endpoint to get a list of files v.2
app.get('/listFilesFromDir', async (req, res) => {

  res.setHeader("Access-Control-Allow-Origin", "*"); // Set Header for CORS thing

  // Try Getting Files From Server
  try {

    // Get directory contents from the SFTP server
    logger.info("Listing Contents...");
    const fileList = await sftp.list();
    logger.info("Grabbed List....");


    // Grab File Names
    const formattedContents = [];
    for (var key in fileList) {

      const name = fileList[key]["name"]
      const type = fileList[key]["type"]
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

    res.send(JSON.stringify(formattedContents));
  } catch (err) {
    logger.error(err);
    res.status(500).send('Error retrieving image from SFTP');
  }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info('\n', `Server is running on port ${PORT}`, '\n');
});
