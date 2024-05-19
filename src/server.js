/**
 ** App Packages
 */
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv"); // for use of environment variables
const multer = require("multer");
const fs = require("fs");
const https = require("https");
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

const upload = multer({ dest: "../uploads" }); // Set up multer for handling file uploads
logger.debug("Env Vars: " + JSON.stringify(config));
//const dbController = require("./utils/db.js"); // test
//dbController.connect(); // connect to sql DB
//dbController.refreshModels();

/**
 * *Import Utilities
 */
const { fileAccessMethodController } = require("./utils/fileAccess/fileAccessMethodController.js"); // For s3 / sftp connections
const { validationController } = require("./utils/requestValidationController.js"); // For request validation
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
 * - /renameFile // TO BE ADDED
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

    if (fileAsBuffer === null || fileAsBuffer === undefined) {
      res.status(404).contentType("text/utf8").send("Error: File Not Found On Remote"); // send image
    } else {
      res.status(200).contentType("image/*").attachment(fileName).send(fileAsBuffer); // send image
    }
  };

  try {
    logger.debug(`Request for file: ${fileName} has been made, using ${method} method.`);
    getFile();
  } catch (err) {
    res.status(500).send(err);
  } finally {
    logger.info(`File request completed.`);
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
 * * /uploadFile to upload file to sftp or s3
 */
app.post("/uploadFile", /** validationController.uploadFile ,*/ upload.single("fileUpload"), async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const method = req.headers.method;
  const fileName = req.file.originalname;

  logger.info("Upload Initiated...");

  const localFilePath = req.file.path;
  const fileData = fs.createReadStream(localFilePath);

  const uploadFile = async () => {
    const upload = await fileAccessMethodController.uploadFile(fileData, fileName, fileAccessConfig.ftp, method);
    res.status(200).send(`${await upload}`);
  };

  try {
    logger.debug(`Request to upload file: ${fileName} has been made, using ${method} method.`);
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
    
    if (request.status === 200) {
      res.status(request.status).send(request.message);
    } else if (request.status === 500) {
      throw new Error(request.message);
    }

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
 * * /health for healthchecks in the future
 */
app.get("/health", async (req, res) => {
  res.status(200).send("Server Running");
});


// START SERVER
const httpServer = http.createServer(app);
const PORT = process.env.PORT;
httpServer.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});
