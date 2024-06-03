const logger = require("../../middlewares/logger");
const { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand, ListObjectsCommand, CopyObjectCommand, GetObjectAttributesCommand } = require("@aws-sdk/client-s3");
const { Readable } = require('stream');

/**
 * Local Vars
 */

const s3Client = new S3Client();


class File {
	constructor(fileName, fileType, fileExtension, fileExtensionType) {
		this.fileName = fileName;
		this.fileType = fileType;
		this.fileExtension = fileExtension;
		this.fileExtensionType = fileExtensionType;
		this.directory = '/';
	}
}

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
	const createFile = (name) => {
		const fileExtension = utils.extension.getFromFileName(name);
		const extensionType = utils.extension.checkValid(fileExtension)[0];
		
		const type = extensionType != 3 ? "-" : "d";
		const directory = '/';
	
		return new File(name, type, fileExtension, extensionType, directory);
	};

	logger.debug("Requesting File List from S3 Bucket");

	try {
		const requestInfo = {
			Bucket: "file-explorer-s3-bucket",
		};
	
		const response = await s3Client.send(new ListObjectsCommand(requestInfo));
		let files = [];

		if (response.Contents === undefined) {
			logger.debug("No Files Found");
			files = [new File("No Files", "d", "Dir", "Dir", '/')];
		} else {
			logger.debug(`Files Returned (${response.Contents.length}): ${JSON.stringify(response.Contents.map( (file) => file.Key ))}`);
			files = response.Contents.map((file) => {
				return createFile(file.Key);
			});
		}
	
		return files;
	} catch (err) {
		return handleErrors(err);
	} finally {
		logger.debug("S3 List Request Completed");
	}
};

const createFolderInS3 = async function (key) {
	const folders = key.split('/');
	let currentPath = '';

	for (const folder of folders) {
		if (folder) {
			currentPath += folder + '/';
			try {
				const requestInfo = {
					Bucket: "file-explorer-s3-bucket",
					Key: currentPath,
					Body: ""
				};

				const response = await s3Client.send(new PutObjectCommand(requestInfo));
				if (response.$metadata.httpStatusCode !== 200) {
					throw new Error("Error creating folder in S3 Bucket");
				}
			} catch (err) {
				return handleErrors(err);
			}
		}
	}
};


const modifyFile = async function (fileProperties, fileName) {
	logger.debug("Modifying File in S3 Bucket");

	const extractedPath = fileProperties.name.split('/');
	const extractedFolderPath = extractedPath.slice(0, extractedPath.length - 1).join('/') + '/';

	logger.error(`Extracted Path: ${extractedFolderPath}`);

	await createFolderInS3(extractedFolderPath)

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

const createFolder = async function (folderName, config) {
	logger.debug(`Creating Folder: ${folderName} in S3 Bucket`);

	const decodedFolderName = decodeURIComponent(folderName);
	const folders = decodedFolderName.split('/');
	let currentPath = '';

	for (const folder of folders) {
		if (folder) {
			currentPath += folder + '/';
			try {
				const requestInfo = {
					Bucket: "file-explorer-s3-bucket",
					Key: currentPath,
					Body: ""
				};

				const response = await s3Client.send(new PutObjectCommand(requestInfo));
				if (response.$metadata.httpStatusCode !== 200) {
					throw new Error("Error creating folder in S3 Bucket");
				}
			} catch (err) {
				return handleErrors(err);
			}
		}
	}

	logger.debug("S3 Create Folder Request Completed");
	return "Folder successfully created in S3 Bucket";
};

const deleteFolder = async function (folderName) {
	logger.debug(`Deleting Folder: ${folderName} in S3 Bucket`);

	const decodedFolderName = decodeURIComponent(folderName);
	const addTrailingSlash = decodedFolderName.endsWith('/') ? decodedFolderName : decodedFolderName + '/';

	try {
		const requestInfo = {
			Bucket: "file-explorer-s3-bucket",
			Key: addTrailingSlash
		};

		const response = await s3Client.send(new DeleteObjectCommand(requestInfo));
		return (response.$metadata.httpStatusCode === 200) ? "Folder successfully deleted from S3 Bucket" : "Error deleting folder from S3 Bucket";

	} catch (err) {
		return handleErrors(err);
	} finally {
		logger.debug("S3 Delete Folder Request Completed");
	}
};

const listFilesInFolder = async function (folderName, config) {
	const createFile = (name) => {
		const fileExtension = utils.extension.getFromFileName(name);
		const extensionType = utils.extension.checkValid(fileExtension)[0];
		
		const type = extensionType != 3 ? "-" : "d";
		const directory = '/';
	
		return new File(name, type, fileExtension, extensionType, directory);
	};

	logger.debug(`Requesting File List from Folder: ${folderName} in S3 Bucket`);

	const decodedFolderName = decodeURIComponent(folderName);
	const addTrailingSlash = !decodedFolderName.endsWith('/') && decodedFolderName != '' ?  decodedFolderName + '/' : decodedFolderName;

	try {
		const requestInfo = {
			Bucket: "file-explorer-s3-bucket",
			Prefix: addTrailingSlash
		};
	
		const response = await s3Client.send(new ListObjectsCommand(requestInfo));
		let files = [];

		if (response.Contents === undefined) {
			logger.debug("No Files Found");
			files = [new File("No Files", "d", "Dir", "Dir", folderName)];
		} else {
			logger.debug(`Files Returned (${response.Contents.length}): ${JSON.stringify(response.Contents.map( (file) => file.Key ))}`);
			files = response.Contents.map((file) => {
				return createFile(file.Key);
			});
		}

		const createNestedObject = (files) => {
			const trimmedFolderName = folderName.endsWith('/') ? folderName.slice(0, -1) : folderName;
		
			const nestedObject = {
				name: folderName,
				children: []
			};
			
			files.forEach((file) => {
				let path = trimmedFolderName ? file.fileName.replace(trimmedFolderName + '/', '').split('/') : file.fileName.split('/');
				path = path.filter((folder) => folder !== '');
				let currentObject = nestedObject;
			
				const numFolders = file.fileName.endsWith('/') ? path.length : path.length - 1;
			
				for (let i = 0; i < numFolders; i++) {
					let folder = path[i];
					let folderObject = currentObject.children.find((child) => child.name === folder);
					if (!folderObject) {
						folderObject = {
							name: folder,
							type: 'd',
							extension: 'Dir',
							extensionType: 3,
							directory: file.fileName,
							isOpen: false,
							children: []
						};
						currentObject.children.push(folderObject);
					}
					currentObject = folderObject;
				}
			
				if (!file.fileName.endsWith('/')) {
					currentObject.children.push({ 
						name: path[path.length - 1], 
						type: file.fileType, 
						extension: file.fileExtension,
						extensionType: file.fileExtensionType,
						directory: file.fileName
					});
				}
			});
		
			return nestedObject;
		}

		const nestedObject = createNestedObject(files);
	
		return nestedObject;
	} catch (err) {
		return handleErrors(err);
	} finally {
		logger.debug("S3 List Request Completed");
	}
};

module.exports = {
	s3: {
		getFile,
		uploadFile,
		deleteFile,
		listFiles,
		modifyFile,
		createFolder,
		deleteFolder,
		listFilesInFolder,
	},
};
