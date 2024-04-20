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

const config = dotenv.config({ path: "./config.env" }); // Prints Local Variables

/**
 * * Observability
 */
const logger = require("./utils/logger.js"); // logging

/**
 ** App Setup
 */
const app = express();
app.use(cors());

const upload = multer({ dest: "../uploads/" }); // Set up multer for handling file uploads
logger.debug("Env Vars: " + JSON.stringify(config));
const db = require("./utils/db.js"); // test
db.connect(); // connect to sql DB
db.refreshModels();

/**
 * *Import Utilities
 */
const utils = require("./utils/utils.js");
const { files, file } = require("./utils/fileRequests.js"); // For s3 / sftp connections
logger.info("Imported Utilities");

/**
 * * HTTPS Setup
 */
const privateKey = fs.readFileSync("sslcert/server.key", "utf8"); // key
const certificate = fs.readFileSync("sslcert/server.crt", "utf8"); // cert
const credentials = { key: privateKey, cert: certificate };
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
app.get("/getFile/:fileName", async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const method = req.headers.method;
  const fileName = req.params.fileName;
  const validation = utils.validateRequest.getFile(req.headers, fileName); //! will move to the auth section or have a whole different validation handler

  // Validate the Request
  const validateRequest = () => {
    if (validation.status !== 200) {
      throw new Error(`Error Validating Request, ${validation.message}`);
    }
  };

  // Get the File From Remote
  const getFile = async () => {
    const fileAsBuffer = await file.getFile(
      fileName,
      fileAccessConfig.ftp,
      method
    );

    if (fileAsBuffer === null) {
      res
        .status(404)
        .contentType("text/utf8")
        .send("Error: File Not Found On Remote"); // send image
    } else {
      res
        .status(200)
        .contentType("image/*")
        .attachment(fileName)
        .send(fileAsBuffer); // send image
    }
  };

  const handleErrors = (err) => {
    res.status(validation.status !== undefined ? validation.status : 400);
    res.send(validation.message !== undefined ? `${err}` : `Error Retrieving File: ${err}`);
  };

  logger.info(
    `Request for file: ${fileName} has been made, using ${method} method.`
  );

  try {
    validateRequest();
    getFile();
  } catch (err) {
    handleErrors(err);
  } finally {
    logger.info(`File request completed.`);
  }
});

/**
 * * /listFilesDev to fetch file list
 */
app.get("/listFilesDev", async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const method = req.headers["method"]; // Look for connection method in HTTP header
  logger.info("Connection Method: " + method); // Log it

  
  const validation = utils.validateRequest.listFiles(req.headers);
  const validateRequest = () => {
    if (validation.status !== 200) {
      throw new Error(`Error Validating Request, ${validation.message}`);
    }
  };

  const getFileList = async () => {
    res.status(200).send(await file.listFiles(fileAccessConfig.ftp, method));
  };

  try {
    validateRequest();
    getFileList();
  } catch (err) {
    logger.error("Error Retrieving File List: " + err);
    res.status(400).send("Error: " + err.message);
  } finally {
    logger.info("File List Request Completed");
  }
});

/**
 * * /uploadFile to upload file to sftp or s3
 */
app.post("/uploadFile", upload.single("fileUpload"), async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const method = req.headers.method;
  const fileName = req.file.originalname;

  logger.info("Upload Initiated...");

  const validation = utils.validateRequest.uploadFile(req.headers, fileName);
  const validateRequest = () => {
    if (validation.status !== 200) {
      throw new Error(`Error Validating Request, ${validation.message}`);
    }
  };

  const localFilePath = req.file.path;
  const fileData = fs.createReadStream(localFilePath);

  const uploadFile = async () => {
    const upload = await file.uploadFile(fileData, fileName, fileAccessConfig.ftp, method);
    res.status(200).send(`${await upload}`);
  };

  try {
    validateRequest();
    await uploadFile();
    // res.status(200).send(`File uploaded successfully. /home/ftpuser/files/ ${req.file.originalname}`);

  } catch (err) {
    logger.error(err);
    res.status(400).send({ status: "Error uploading file." });
  } finally {
    fs.unlinkSync(req.file.path);
  }
});

/**
 * * /deleteFile to delete files
 */
app.delete("/deleteFile/:fileName", async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const fileName = req.params.fileName;
  const method = req.headers.method;


  const validation = utils.validateRequest.deleteFile(req.headers, fileName);//! will move to the auth section or have a whole different validation handler
  const validateRequest = () => {
    if (validation.status !== 200) {
      throw new Error(`Error Validating Request, ${validation.message}`);
    }
  };

  const deleteFile = async () => {
    res.status(200).send(await file.deleteFile(fileName, fileAccessConfig.ftp, method));
  };

  const handleErrors = (err) => {
    res.status(validation.status !== undefined ? validation.status : 400);
    res.send(validation.message !== undefined ? `${err}` : `Error Retrieving File: ${err}`);
  };

  try {
    validateRequest();
    deleteFile();
  } catch (err) {
    handleErrors(err);
  } finally {
  }
});

/**
 * * /health for healthchecks in the future
 */
app.get("/health", async (req, res) => {
  res.status(200).send("Server Running");
});

app.get("/sqlTest", async (req, res) => {
  const meow = await db.test();
  logger.info("test2");

  let files = ["meow", "bob"];

  for (var key in meow) {
    if (files.includes(meow[key].fileName) === true) {
      logger.error("exists");
    } else {
      files.push(meow[key].fileName);
    }
  }

  res.status(200).send(files);
});

// START SERVER
const PORT = process.env.PORT;
httpServer.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});
