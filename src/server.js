/**
 ** App Packages
 */
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv"); // for use of environment variables
const multer = require("multer");
const fs = require("fs");
const http = require("http");

const config = dotenv.config(); // Prints Local Variables

/**
 * * Observability
 */
const logger = require("./middlewares/logger.js"); // logging

/**
 ** App Setup
 */
const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: "../uploads" }); // Set up multer for handling file uploads
logger.debug("Env Vars: " + JSON.stringify(config));
//const dbController = require("./utils/db.js"); // test
//dbController.connect(); // connect to sql DB
//dbController.refreshModels();

/**
 * *Import Utilities
 */
const { fileAccessMethodController } = require("./utils/fileAccess/fileAccessMethodController.js"); // For s3 / sftp connections
const { validationController } = require("./middlewares/validation.js"); // For request validation
logger.info("Imported Utilities");

/**
 *
 * Routes:
 * - /(Static Index Page)
 * - /getFile
 * - /listFiles
 * - /uploadFile
 * - /deleteFile
 * - /renameFile // TO BE ADDED
 * - /copyFile // TO BE ADDED
 *
 */

// ! TEMPORARY UNTIL I CAN KEEP CONFIG FOR METHODS SENT WITH THE REQUESTS
const fileAccessConfig = {
  s3: {
    url: process.env.S3_URL,
    //apiKey: process.env.S3_API_KEY
  },
  ftp: {
    host: process.env.SFTP_URL,
    port: process.env.SFTP_PORT, // Typically 22 for SFTP
    username: process.env.SFTP_USERNAME,
    password: process.env.SFTP_PASSWORD,
  },
};

logger.info("Starting server....");

/**
 * Static Index Page
 */
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

/**
 * * /getFile - Endpoint to fetch a file by its name
 *
 * currently just takes /getFile/{fileName} argument in the URL,
 */
app.get("/getFile/:fileName", validationController.getFile, async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const method = req.headers.method;
  const fileName = req.params.fileName;

  // Get the File From Remote
  const getFile = async () => {
    const fileAsBuffer = await fileAccessMethodController.getFile(fileName, fileAccessConfig.ftp, method);

    if (fileAsBuffer.status !== undefined) {
      res.status(fileAsBuffer.status).send(fileAsBuffer.message);
    } else {
      res.status(200).contentType("image/*").attachment(fileName).send(fileAsBuffer); // send image
    }
  };

  try {
    logger.info(`Request for file: ${fileName} has been made, using ${method} method.`);
    await getFile();
  } catch (err) {
    res.status(500).send(err);
  } finally {
    logger.info(`Request for file: ${fileName} was completed.`);
  }
});

/**
 * * /listFilesDev to fetch file list
 */
app.get("/listFilesDev", validationController.listFiles, async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const method = req.headers["method"]; // Look for connection method in HTTP header
  logger.debug(`User (${"trevor"}) Made Request For File List With Connection Method: ${method}`); // Log it

  const getFileList = async () => {
    res.status(200).send(await fileAccessMethodController.listFiles(fileAccessConfig.ftp, method));
  };

  try {
    logger.debug(`Request to list files has been made, using ${method} method.`);
    getFileList();
  } catch (err) {
    logger.error("Error Retrieving File List: " + err);
    res.status(400).send("Error: " + err.message);
  } finally {
    logger.debug("File List Request Completed");
  }
});

/**
 * * /listFilesDev to fetch file list
 */
app.get("/listFiles/*", validationController.listFiles, async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const method = req.headers["method"]; // Look for connection method in HTTP header
  const directory = req.params[0]; // Combine the directory and any additional subdirectories

  logger.debug(`User (${"trevor"}) Made Request For File List With Connection Method: ${method}, to folder: ${directory}`); // Log it

  const getFileListInDirectory = async () => {
    res.status(200).send(await fileAccessMethodController.listFilesInFolder(directory, fileAccessConfig.ftp, method)); // Pass the directory to the listFiles method
  };

  try {
    logger.debug(`Request to list files has been made, using ${method} method.`);
    getFileListInDirectory();
  } catch (err) {
    logger.error("Error Retrieving File List: " + err);
    res.status(400).send("Error: " + err.message);
  } finally {
    logger.debug("File List Request Completed");
  }
});

/**
 * * /uploadFile to upload file to sftp or s3
 */
app.post("/uploadFile", upload.single("fileUpload"), validationController.uploadFile, async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const method = req.headers.method;
  const fileName = req.file.originalname;

  logger.debug(`User (${"trevor"}) Made Request To Upload File: ${fileName} With Connection Method: ${method}`);

  const localFilePath = req.file.path;
  const fileData = fs.createReadStream(localFilePath);

  const uploadFile = async () => {
    const upload = await fileAccessMethodController.uploadFile(fileData, fileName, fileAccessConfig.ftp, method);
    
    if (upload.status !== undefined) {
      res.status(upload.status).send(upload.message);
    } else {
      res.status(200).send(upload);
    } 

  };

  try {
    logger.info(`Request to upload file: ${fileName} has been made, using ${method} method.`);
    await uploadFile();
  } catch (err) {
    res.status(500).send(err)
  } finally {
    fs.unlinkSync(req.file.path);
    logger.info(`File upload request completed.`);
  }
});

/**
 * * /deleteFile to delete files
 */
app.delete("/deleteFile/:fileName", validationController.deleteFile, async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const fileName = req.params.fileName;
  const method = req.headers.method;

  const deleteFile = async () => {
    const request = await fileAccessMethodController.deleteFile(fileName, fileAccessConfig.ftp, method)
    
    // can't see if object exists before delete, succesful response should be good enough for now
    if (request.status !== undefined) {
      res.status(request.status).send(await request.message);
    } else {
      res.status(200).send(await request.message);
    };

  };

  try {
    logger.debug(`Request to delete file: ${fileName} has been made, using ${method} method.`);
    deleteFile();
  } catch (err) {
    res.status(500).send(err);
  } finally {
    logger.info(`File deletion request completed.`);
  }
});


/**
 * * /renameFile to rename files
 */
app.put("/modifyFile/:fileName", validationController.modifyFile, async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  
  const fileName = req.params.fileName;
  const fileProperties = req.body.fileProperties;
  const method = req.headers.method;
  

  const modifyFile = async () => {

    const request = await fileAccessMethodController.modifyFile( fileProperties, fileName, fileAccessConfig.ftp, method);
    res.status(200).send(await request.message);

    // if (request.status === 200) {
    //   res.status(request.status).send(request.message);
    // } else if (request.status === 500) {
    //   throw new Error(request.message);
    // }
  };

  try {
    logger.debug(`Request to modify file: ${fileName} with data ${JSON.stringify(fileProperties)} has been made, using ${method} method.`);
    modifyFile();
  } catch (err) {
    logger.error(err);
    res.status(500).send(err);
  }
});

app.post("/createFolder/:folderName", validationController.createFolder, async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const folderName = req.params.folderName;
  const method = req.headers.method;

  const createFolder = async () => {
    const request = await fileAccessMethodController.createFolder(folderName, fileAccessConfig.ftp, method);
    res.status(200).send(await request.message);
  };

  try {
    logger.debug(`Request to create folder: ${folderName} has been made, using ${method} method.`);
    createFolder();
  } catch (err) {
    logger.error(err);
    res.status(500).send(err);
  }
});

app.delete("/deleteFolder/:folderName", validationController.deleteFolder, async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const folderName = req.params.folderName;
  const method = req.headers.method;

  const deleteFolder = async () => {
    const request = await fileAccessMethodController.deleteFolder(folderName, fileAccessConfig.ftp, method);
    res.status(200).send(await request.message);
  };

  try {
    logger.debug(`Request to delete folder: ${folderName} has been made, using ${method} method.`);
    deleteFolder();
  } catch (err) {
    logger.error(err);
    res.status(500).send(err);
  }
});

/**
 * * /health for healthchecks in the future
 */
app.get("/health", async (req, res) => {
  res.status(200).send("Server Running");
});

process.on('uncaughtException', function (err) {
  logger.error(err);
});

// START SERVER
const httpServer = http.createServer(app);
const PORT = process.env.PORT;
httpServer.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});
