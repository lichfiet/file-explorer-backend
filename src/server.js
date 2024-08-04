const dotenv = require("dotenv"); // for use of environment variables
const config = dotenv.config(); // Prints Local Variables

/**
 ** Observability
 */
const logger = require("./utils/logger.js"); // logging

/**
 * * Environment Variables
*/
logger.debug(`Printing Env Vars: `);

function logKeys() {
  const vars = {
    port: config.parsed.PORT,
    logLevel: config.parsed.LOG_LEVEL, 
    awsRegion: config.parsed.AWS_REGION,
    pgDatabase: config.parsed.PG_DATABASE,
    pgHost: config.parsed.PG_HOST
  };

  for (let key in vars) {
    logger.info(`${key}: ${vars[key]}`);
  }
};

logKeys();


/**
 ** App Packages
 */
const express = require("express");
const fs = require("fs");
const http = require("http");


/**
 ** Express Setup & Middleware
 */
const app = express();


const cors = require("cors"); // Cross Origin Resource Sharing
const traceMiddleware = require("./middlewares/traceMiddleware.js"); // Distributed Tracing
const loggerMiddleware = require("./middlewares/loggingMiddleware.js"); // Request Logging
const { validationMiddleware } = require("./middlewares/reqValidationMiddleware.js"); // Request Validation
const multer = require("multer"); // File Uploads
const upload = multer({ dest: "../uploads" }); // Set up multer for handling file uploads

app.use(express.json());
app.use(cors());
app.use(traceMiddleware);
app.use(validationMiddleware);
app.use(loggerMiddleware);



//const dbController = require("./utils/db.js"); // test
//dbController.connect(); // connect to sql DB
//dbController.refreshModels();

/**
 * *Import Utilities
 */
const { fileAccessMethodController } = require("./utils/fileAccess/fileAccessMethodController.js"); // For s3 / sftp connections
const { validationController } = require("./middlewares/reqValidationMiddleware.js"); // For request validation
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
    await getFile();
  } catch (err) {
    res.status(500).send(err);
  } finally {
  }
});

/**
 * * /listFilesDev to fetch file list
 */
app.get("/listFilesDev", async (req, res) => {
  

  const method = req.headers["method"]; // Look for connection method in HTTP header
  logger.debug(`User (${"trevor"}) Made Request For File List With Connection Method: ${method}`); // Log it

  const getFileList = async () => {
    res.status(200).send(await fileAccessMethodController.listFiles(fileAccessConfig.ftp, method));
  };

  try {
    getFileList();
  } catch (err) {
    logger.error("Error Retrieving File List: " + err);
    res.status(400).send("Error: " + err.message);
  }
});

/**
 * * /listFilesDev to fetch file list
 */
app.get("/listFiles/*", async (req, res) => {
  
  const method = req.headers["method"]; // Look for connection method in HTTP header
  const directory = req.params[0]; // Combine the directory and any additional subdirectories

  const getFileListInDirectory = async () => {
    res.status(200).send(await fileAccessMethodController.listFilesInFolder(directory, fileAccessConfig.ftp, method)); // Pass the directory to the listFiles method
  };

  try {
    getFileListInDirectory();
  } catch (err) {
    logger.error("Error Retrieving File List: " + err);
    res.status(400).send("Error: " + err.message);
  }
});

/**
 * * /uploadFile to upload file to sftp or s3
 */
app.post("/uploadFile", upload.single("fileUpload"), async (req, res) => {
  
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
    await uploadFile();
  } catch (err) {
    res.status(500).send(err)
  } finally {
    fs.unlinkSync(req.file.path);
  }
});

/**
 * * /deleteFile to delete files
 */
app.delete("/deleteFile/:fileName", async (req, res) => {
  

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
app.put("/modifyFile/:fileName", async (req, res) => {
  
  
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
    modifyFile();
  } catch (err) {
    logger.error(err);
    res.status(500).send(err);
  }
});

app.post("/createFolder/:folderName", async (req, res) => {
  
  const folderName = req.params.folderName;
  const method = req.headers.method;

  const createFolder = async () => {
    const request = await fileAccessMethodController.createFolder(folderName, fileAccessConfig.ftp, method);
    res.status(200).send(await request.message);
  };

  try {
    createFolder();
  } catch (err) {
    logger.error(err);
    res.status(500).send(err);
  }
});

app.delete("/deleteFolder/:folderName", async (req, res) => {

  const folderName = req.params.folderName;
  const method = req.headers.method;

  const deleteFolder = async () => {
    const request = await fileAccessMethodController.deleteFolder(folderName, fileAccessConfig.ftp, method);
    res.status(200).send(await request.message);
  };

  try {
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
logger.info("Starting server....");
const httpServer = http.createServer(app);
httpServer.listen(process.env.PORT, () => {
  logger.info(`Server is running on port ${process.env.PORT}`);
});
