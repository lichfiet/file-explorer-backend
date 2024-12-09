/**
 ** Observability
 */
const log = require("./utils/log.js");

// if (process.env.OTEL_EXPORTER_OTLP_ENDPOINT) {
//   const observability = require("./utils/observability.js");
//   observability.sdk.start();
//   observability.logger.info("Starting tracing");

//   process.on('SIGTERM', () => {
//     observability.logger.info("Shutting down tracing");
//     observability.sdk
//       .shutdown()
//       .then(() => console.log('Tracing terminated'))
//       .catch((error) => console.log('Error terminating tracing', error))
//       .finally(() => process.exit(0))
//   })
//   observability.logger.info("Initializing logging");
// }



// load environment variables if local .env file exists
var config = {};
if (process.env.NODE_ENV === 'development') {
  const dotenv = require("dotenv"); // for use of environment variables
  config = dotenv.config(); // Prints Local Variables
}

/**
 * * Environment Variables
*/
const vars = {
  port: config.parsed?.PORT || process.env.PORT,
  logLevel: config.parsed?.LOG_LEVEL || process.env.LOG_LEVEL,
  appName: config.parsed?.APP_NAME || process.env.APP_NAME,
  rabbitMQHost: config.parsed?.RABBITMQ_HOST || process.env.RABBITMQ_HOST,
  awsRegion: config.parsed?.AWS_REGION || process.env.AWS_REGION,
  awsAccessKeyId: config.parsed?.AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID,
  awsS3Bucket: config.parsed?.AWS_S3_BUCKET || process.env.AWS_S3_BUCKET,
  awsS3Endpoint: config.parsed?.AWS_S3_ENDPOINT || process.env.AWS_S3_ENDPOINT,
  k8sPodName: process.env.K8S_POD || '',
  k8sNamespace: process.env.K8S_NAMESPACE || '',
  k8sNodeName: process.env.K8S_NODE || '',
  k8sDeploymentName: process.env.K8S_POD_IP || '',
};

console.debug(`Env Vars`);
console.debug(vars);



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
const multer = require("multer"); // File Uploads
const upload = multer({ dest: "../uploads" }); // Set up multer for handling file uploads

app.use(express.json());
app.use(cors());



/**
 * *Import Utilities
 */
const { fileAccessMethodController } = require("./utils/fileAccess/fileAccessMethodController.js"); // For s3 / sftp connections
const errorHandler = require("./middlewares/error.js"); // error handling
const rabbit = require("./utils/rabbit.js");
const redis = require("./utils/redis.js");
console.info("Imported Utilities");

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
  }
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

  const fileName = req.params.fileName;

  // Get the File From Remote
  const getFile = async () => {
    const fileAsBuffer = await fileAccessMethodController.getFile(fileName);

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
app.get("/listFiles/*", async (req, res) => {

  const method = req.headers["method"]; // Look for connection method in HTTP header
  const directory = req.params[0]; // Combine the directory and any additional subdirectories

  const getFileListInDirectory = async () => {
    res.status(200).send(await fileAccessMethodController.listFilesInFolder(directory, fileAccessConfig.ftp, method)); // Pass the directory to the listFiles method
  };

  try {
    await getFileListInDirectory();
  } catch (err) {
    console.error("Error Retrieving File List: " + err);
    res.status(400).send("Error: " + err.message);
  }
});

/**
 * * /uploadFile to upload file to sftp or s3
 */
app.post("/uploadFile", upload.single("fileUpload"), async (req, res) => {

  const fileName = req.file.originalname;

  const localFilePath = req.file.path;
  const fileData = fs.createReadStream(localFilePath);

  const uploadFile = async () => {
    const upload = await fileAccessMethodController.uploadFile(fileData, fileName);

    if (upload.status !== undefined) {
      res.status(upload.status).send(upload.message);
    } else {
      res.status(200).send(upload);
    }

  };

  const generateThumbnail = async () => {
    await rabbit.sendGenerateThumbnailMessage(process.env.AWS_S3_BUCKET, fileName);
  };


  try {
    await uploadFile();
  } catch (err) {
    res.status(500).send(err)
  } finally {
    fs.unlinkSync(req.file.path);
    await generateThumbnail();
  }
});

/**
 * * /deleteFile to delete files
 */



/**
 * * /renameFile to rename files
 */
app.put("/modifyFile/:fileName", async (req, res, next) => {

  const fileName = req.params.fileName;
  const fileProperties = req.body.fileProperties;
  const method = req.headers.method;


  const modifyFile = async () => {

    const request = await fileAccessMethodController.modifyFile(fileProperties, fileName, fileAccessConfig.ftp, method);
    res.status(200).send(await request.message);

    // if (request.status === 200) {
    //   res.status(request.status).send(request.message);
    // } else if (request.status === 500) {
    //   throw new Error(request.message);
    // }
  };

  const generateThumbnail = async () => {
    await rabbit.sendGenerateThumbnailMessage(process.env.AWS_S3_BUCKET, fileProperties.name);
  };

  const deleteThumbnail = async () => {
    await rabbit.sendDeleteThumbnailMessage(process.env.AWS_S3_BUCKET, fileName);
  };

  try {
    modifyFile();
  } catch (err) {
    console.error(err);
    res.status(500).send(err);
  } finally {
    await generateThumbnail();
    await deleteThumbnail();
  }
});


app.use('/createFolder', require('./routes/folder/CreateFolder.js'));
app.use('/deleteFile', require('./routes/file/DeleteFile.js'));


/**
 * * /health for healthchecks in the future
 */
app.get("/health", async (req, res) => {
  console.log(req);
  res.status(200).send("Server Running");
});

app.get("/test", async (req, res, next) => {
  const rabbit = require("./utils/rabbit.js");
  await rabbit.initialize();
  res.status(200).send("Test");
});


redis.connect();
rabbit.initialize();

// START SERVER
console.info("Starting server....");
const httpServer = http.createServer(app);
httpServer.listen(process.env.PORT, () => {
  console.info(`Server is running on port ${process.env.PORT}`);
});


app.use(errorHandler);


process.on('uncaughtException', function (err) {
  console.error(err);
});