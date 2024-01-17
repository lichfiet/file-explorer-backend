const express = require('express');
const multer = require('multer');

const fs = require('fs');
const extension = require('./utils/extensiontools.js');
const sftp = require('./utils/sftpTools.js');
const cors = require('cors');

const files = require('./utils/s3Functions.js');

const app = express();

app.use(cors())

// Set up multer for handling file uploads
const upload = multer({ dest: 'uploads/' });

// Display the HTML form
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// Endpoint to fetch a file by its name
app.get('/getFile/:fileName', async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const fileName = (req.params.fileName)
  const fileExtension = fileName.split('.').pop(); // Get the file extension

  // Checking if the file extension is valid
  if (extension.checkValid(fileExtension)) {
    console.log("Request for file: " + fileName + " has been made", '\n')

    try {
      console.log("Grabbing file from the file server...", '\n');

      // Retrieve the file from the SFTP server
      const imageBuffer = await sftp.get(fileName);

      // Define Content Type of Response
      res.contentType("/blob");

      // Send Response
      res.status(200).send(imageBuffer);

    } catch (err) {
      console.error('\n', err);
      res.status(500).send("Error Retrieving File (" + err + ")");
      console.log("Error Retrieving File (" + err + ")")
    }
  } else {
    console.log("Request for file: " + fileName + " has not been made, please check file extension", '\n')
    res.status(400).send("Invalid File Input Type");
  }
});

app.get('/listFilesDev', async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");

  try {

    res.status(200).send(await files.listFiles());

  } catch {

  } finally {

  }

}
);

// Endpoint to get a list of files
app.get('/listFiles', async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");

  try {
    // List files from the SFTP server
    console.log("Listing Files...");
    const fileList = await sftp.list();
    console.log("Grabbed List....");

    const testarr = [];
    // Grab File Names
    for (var key in fileList) {
      const name = "name"
      console.log(fileList[key][name])
      testarr.push(fileList[key][name])
      console.log(key);
      console.log(fileList[key]);
    }
    console.log(testarr)

    res.send(JSON.stringify(testarr));
  } catch (err) {
    console.error(err);
    res.status(500).send('Error retrieving image from SFTP');
  }
});

// Handle file upload
app.post('/uploadFile', upload.single('fileUpload'), async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");

  console.log("Upload Initiated...");
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  try {
    // Read the local file
    console.log("Reading File...");
    const localFilePath = req.file.path;
    const fileData = fs.createReadStream(localFilePath);

    const test = req.file.originalname;

    // Upload file to SFTP server
    console.log("Uploading File....")
    await sftp.upload(fileData, test);

    res.status(200).send({"status": 'File uploaded successfully.', "pathto": `/home/ftpuser/files/${req.file.originalname}`});
  } catch (err) {
    console.error(err);
    res.status(500).send({"status": 'Error uploading file.'});
  } finally {
    fs.unlinkSync(req.file.path);
  }
});

app.delete('/deleteFile/:fileName', async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");

  console.log("Deleting...");

  let fileName = (req.params.fileName)
  console.log(req.params.fileName)

  try {
    // Read the local file
    console.log("Grabbing file name from request...");

    // Upload file to SFTP server
    console.log("Deleting File....")
    await sftp.delete(fileName);

    res.status(200).send({"status": 'File deleted successfully.'});
  } catch (err) {
    console.error(err);
    res.status(500).send('Error uploading file.');
  } finally {
  }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('\n', `Server is running on port ${PORT}`, '\n');
});
