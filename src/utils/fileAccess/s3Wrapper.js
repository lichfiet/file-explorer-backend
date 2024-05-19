/**
 * Local Vars
 */
const axios = require("axios");
const logger = require("../../middlewares/logger");

class File {
	constructor(fileName, fileType, fileExtension, fileExtensionType) {
		this.fileName = fileName;
		this.fileType = fileType;
		this.fileExtension = fileExtension;
		this.fileExtensionType = fileExtensionType;
	}
}

const createFile = (name) => {
	const type = name.search("/") === -1 ? "-" : "d";
	const fileExtension =
		type === "-" ? utils.extension.getFromFileName(name) : "Dir";
	const extensionType =
		type === "-" ? utils.extension.checkValid(fileExtension)[0] : "Dir";
	return new File(name, type, fileExtension, extensionType);
};

/**
 * Public Vars
 */

const getFile = async (fileId, config) => {
	// fileId will eventually be uuid generated on image pull, but right now it's just a file name
	// uuid will be sent down as part of a separate uuid retrievel in a higher level function

	try {

		logger.debug(`Requesting file by uuid ${fileId} from S3 Bucket with config ${config}`);
		const response = await axios.get(`${process.env.S3_URL}/getFile/file-explorer-s3-bucket/${fileId}`, { responseType: "arraybuffer", validateStatus: false });
        
        // ? if response is good, return the file, if not found, return null, if bad request, throw error 
		if (response.data && response.status !== 404) {
			return Buffer.from(response.data, "binary"); // Convert array buffer to Buffer
		} else if (response.status === 404) {
            return null;
        } else if (response.status === 400) {
			logger.error("Bad Request.");
			logger.debug(response);
			throw new Error("Bad Request.");
		} else {
			logger.debug('Received bad reponse from S3.');
			logger.debug(response);
			throw new Error(`Unknown Error. Received Status from S3: ${response.status}`);
		}

	} catch (err) {
		logger.error("Error Occurred Requesting File From Bucket: " + err);
		throw new Error(err);
	} finally {
		logger.debug("S3 Get Request Completed");
	}
};

const listFiles = async (config) => {
	// ! method will be deprecated at some point, will use SQL to index files and then query uuids in folders
	logger.info("Requesting files from S3 Bucket");

	try {
		// Get data from s3 and convert to JSON
		const response = await axios.get(`${process.env.S3_URL}/listFiles/file-explorer-s3-bucket`);
		let jsonData = utils.data.xmlToJson(response.data);
		const extractedFiles = JSON.parse(jsonData).ListBucketResult.Contents;
		logger.info("Files Extracted: " + JSON.stringify(!extractedFiles ? "No Files" : extractedFiles.length));

		// Format files into array of File objects
		let formattedContents = [];
		if (extractedFiles === undefined) {
			logger.info("No Files Found");
			formattedContents = [new File("No Files", "d", "Dir", "Dir")];
		} else {
			logger.info("Files found, formatting...");
			formattedContents = []
				.concat(extractedFiles)
				.map((file) => createFile(file.Key));
			logger.info("Files Returned: " + formattedContents.length);
		}

		return formattedContents;
	} catch (err) {
		logger.error("Error Occured Requesting File From Bucket: " + err);
	} finally {
		logger.info("S3 Request Completed");
	}
};

const uploadFile = async function (fileData, fileName) {
	logger.info("Uploading file to S3 Bucket");

	try {
		const upload = await axios.put( `${process.env.S3_URL}/uploadFile/file-explorer-s3-bucket/${fileName}`, fileData );

		logger.info("Sending upload status");
		return (upload.status === 200) ? "File successfully uploaded to S3 Bucket" : "Error uploading file to S3 Bucket";
	} catch (err) {
		logger.error("Error Occurred Uploading File To Bucket: " + err);
	} finally {
		logger.info("S3 Upload Request Completed");
	}
};

const deleteFile = async (fileName, config) => {
	logger.debug(`Deleting file: ${fileName} from S3 Bucket`);
	try {

		// ! INNEFFICIENT, WILL BE REPLACED WITH POSTGRES SEARCH
		const fileList = (await listFiles(config)).map((file) => file.fileName);
		const response = await axios.delete(`${process.env.S3_URL}/deleteFile/file-explorer-s3-bucket/${fileName}`);

		if (!fileList) {
			return ({message: "No files found in bucket.", status: 200});
		} else if (!fileList.includes(fileName)) {
			return ({message: `File requested for deletion does not exist, files look like: ${fileList}`, status: 200});
		} else if (fileList.includes(fileName) && response.status === 200) {
			return ({message: "File successfully deleted from S3 Bucket", status: 200})
		} else if (response.status !== 200) {
			return ({message: `Error received from S3 API: ${response.body}`, status: 500});
		};

	} catch (err) {
		logger.error(`Error Occurred Deleting File From Bucket: ${err}`);
		return ({message: `Error Occurred Deleting File From Bucket: ${err}`, status: 500});
	} finally {
		logger.info("S3 Request Completed");
	}
};

const modifyFile = async function (fileName, config) {};

module.exports = {
	s3: {
		getFile,
		uploadFile,
		deleteFile,
		listFiles,
		modifyFile,
	},
};
