/**
 * Local Vars
 */
const logger = require("../../middlewares/logger");

const { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand, ListObjectsCommand, CopyObjectCommand, GetObjectAttributesCommand } = require("@aws-sdk/client-s3");
const s3Client = new S3Client();

const { Readable } = require('stream');

class File {
	constructor(fileName, fileType, fileExtension, fileExtensionType) {
		this.fileName = fileName;
		this.fileType = fileType;
		this.fileExtension = fileExtension;
		this.fileExtensionType = fileExtensionType;
		this.directory = '/';
	}
}

const createFile = (name) => {

	const fileExtension = utils.extension.getFromFileName(name);
	const extensionType = utils.extension.checkValid(fileExtension)[0];
	
	const type = extensionType != 3 ? "-" : "d";
	const directory = '/';

	return new File(name, type, fileExtension, extensionType, directory);
};

/**
 * Public Vars
 */

const handleErrors = (err) => {
	logger.error(`Error Occurred Requesting File From Bucket: ${err}`);

	const rawStatus = err.$metadata.httpStatusCode;
	const rawMessage = 'Unable To Fulfill Request: ' + err.message;
	const status = rawStatus === undefined ? 500 : rawStatus;
	const message = rawMessage === undefined ? "Error Occurred Requesting File From Bucket" : rawMessage;

	return { status: status, message: message };
};

const getFile = async (fileId, config) => {
	// fileId will eventually be uuid generated on image pull, but right now it's just a file name
	// uuid will be sent down as part of a separate uuid retrievel in a higher level function

	const decodedFileId = decodeURIComponent(fileId);

    try {
        logger.debug(`Requesting file by uuid ${fileId} from S3 Bucket with config ${JSON.stringify(config)}`);
        
        const requestInfo = {
            Bucket: "file-explorer-s3-bucket",
            Key: decodedFileId,
        };
        
        const response = await s3Client.send(new GetObjectCommand(requestInfo));

        const chunks = [];
        for await (const chunk of Readable.from(response.Body)) {
            chunks.push(chunk);
        }
        return Buffer.concat(chunks);

    } catch (err) {
		return handleErrors(err);
    } finally {
        logger.debug("S3 Get Request Completed");
    }
};


const deleteFile = async (fileName, config) => {
	logger.debug(`Deleting file: ${fileName} from S3 Bucket`);

	try {
		const requestInfo = {
			Bucket: "file-explorer-s3-bucket",
			Key: fileName
		};
		const requestInfo2 = {
			Bucket: "file-explorer-s3-bucket",
			Key: fileName,
			ObjectAttributes: ["ObjectSize"],
		};

		// will replace with the deleteObjects for multi object delete, or maybe keep this for single object delete for concurrency
		const fileExists = await s3Client.send(new GetObjectAttributesCommand(requestInfo2)).then((data) => {
			return data.$metadata.httpStatusCode === 200
		});

		logger.debug(`File Exists: ${await fileExists}`);

		const response = await s3Client.send(new DeleteObjectCommand(requestInfo));
	
		
		return (await response.$metadata.httpStatusCode === 204) ? { status: 200, message: "File successfully delete from S3 Bucket" } : handleErrors(response);

	} catch (err) {
		return handleErrors(err);
	} finally {
		logger.debug(`S3 Delete for Filename: ${fileName} Completed`);
	}
}

const uploadFile = async (fileData, fileName, config) => {
	logger.debug(`Uploading file by filename: ${fileName} to S3 Bucket`);

	try {
		const requestInfo = {
			Bucket: "file-explorer-s3-bucket",
			Key: fileName,
			Body: fileData
		};

		const response = await s3Client.send(new PutObjectCommand(requestInfo));
		return (response.$metadata.httpStatusCode === 200) ? "File successfully uploaded to S3 Bucket" : "Error uploading file to S3 Bucket";

	} catch (err) {
		return handleErrors(err);
	} finally {
		logger.debug(`S3 Upload for Filename: ${fileName} Completed`);
	}
};

const listFiles = async function (config) {
	logger.debug("Requesting File List from S3 Bucket");

	try {
		const requestInfo = {
			Bucket: "file-explorer-s3-bucket",
		};
	
		const response = await s3Client.send(new ListObjectsCommand(requestInfo));
		let files = [];

		logger.debug(`Files Returned (${response.Contents.length}): ${JSON.stringify(response.Contents.map( (file) => file.Key ))}`);
	
		if (response.Contents === undefined) {
			logger.debug("No Files Found");
			files = [new File("No Files", "d", "Dir", "Dir", '/')];
		} else {
			files = response.Contents.map((file) => {
				return createFile(file.Key);
				;
			});
		}
	
		return files;
	} catch (err) {
		return handleErrors(err);
	} finally {
		logger.debug("S3 List Request Completed");
	}
};


// need to re-write to handle errors better
const modifyFile = async function (fileProperties, fileName, config, method) {
	logger.debug("Modifying File in S3 Bucket");

	try {
		requestInfo = {
			Bucket: "file-explorer-s3-bucket",
			CopySource: "file-explorer-s3-bucket/" + fileName,
			Key: fileProperties.name
		};

		const response = await s3Client.send(new CopyObjectCommand(requestInfo)).then(async (data) => {
			if (data.$metadata.httpStatusCode === 200) { 
				s3Client.send(new DeleteObjectCommand({Bucket: requestInfo.Bucket, Key: fileName}))
			} else {
				throw new Error("Error Copying File" + err)
			}

			return data
		});

		return (response.$metadata.httpStatusCode === 200) ? {status: 200, message: "File successfully modified in S3 Bucket"} : "Error modifying file in S3 Bucket";

	} catch (err) {
		return handleErrors(err);
	} finally {
		logger.debug("S3 Modify Request Completed");
	}
};

module.exports = {
	s3: {
		getFile,
		uploadFile,
		deleteFile,
		listFiles,
		modifyFile
	},
};
