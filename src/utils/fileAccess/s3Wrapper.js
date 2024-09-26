const logger = require("../logger");
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
	const message = rawMessage === undefined ? "Error Occurred Handling File Request to/from Bucket" : rawMessage;

	return { status: status, message: message };
};

const getFile = async (fileId) => {
	logger.debug(`Requesting file by uuid ${fileId} from S3 Bucket with config`);

	const decodedFileId = decodeURIComponent(fileId);

	const getFile = async (fileId) => {
		const reqParams = { Bucket: "file-explorer-s3-bucket", Key: fileId };
		const response = await s3Client.send(new GetObjectCommand(reqParams));

		const reponseToStream = Readable.from(response.Body);
		const concatStream = async (stream) => {
			const chunks = [];
			for await (const chunk of stream) {
				chunks.push(chunk);
			}
			return Buffer.concat(chunks);
		};
		return concatStream(reponseToStream);
	};


	try {
		return getFile(decodedFileId);
	} catch (err) {
		return handleErrors(err);
	} finally {
		logger.debug(`S3 Get for Filename: ${fileId} Completed`);
	}
};


const deleteFile = async (fileName) => {
	logger.debug(`Deleting file: ${fileName} from S3 Bucket`);

	try {
		const fileExistsReqParams = { Bucket: "file-explorer-s3-bucket", Key: fileName, ObjectAttributes: ["ObjectSize"] };
		const fileExists = await s3Client.send(new GetObjectAttributesCommand(fileExistsReqParams)).then(
			(response) => { return (response.$metadata.httpStatusCode === 200 ? true : false) } // checks s3 object exists
		);

		logger.debug(`File Exists: ${await fileExists}`);

		const deleteFile = async (fileKey) => {
			const reqParams = { Bucket: "file-explorer-s3-bucket", Key: fileKey };
			await s3Client.send(new DeleteObjectCommand(reqParams));
		};

		const listFilesRecursive = async (prefix) => {
			const reqParams = { Bucket: "file-explorer-s3-bucket", Prefix: prefix };
			const response = await s3Client.send(new ListObjectsCommand(reqParams));
			const files = response.Contents || [];

			for (const file of files) {
				await deleteFile(file.Key);
			}

			const prefixes = response.CommonPrefixes || [];

			for (const prefix of prefixes) {
				await listFilesRecursive(prefix.Prefix);
			}
		};

		await listFilesRecursive(fileName);

		return { status: 200, message: "File(s) successfully deleted from S3 Bucket" };

	} catch (err) {
		return handleErrors(err);
	} finally {
		logger.debug(`S3 Delete for Filename: ${fileName} Completed`);
	}
};

const uploadFile = async (fileData, fileName) => {
	logger.debug(`Uploading file by filename: ${fileName} to S3 Bucket`);

	const decodedFileName = decodeURI(fileName);

	const uploadFile = async (fileData, decodedFileName) => {
		const requestParams = { Bucket: "file-explorer-s3-bucket", Key: decodedFileName, Body: fileData };
		const response = await s3Client.send(new PutObjectCommand(requestParams));
		const responseCode = await response.$metadata.httpStatusCode;

		return (await responseCode === 200) ? "File successfully uploaded to S3 Bucket" : () => { throw new Error("Error deleting file from S3 Bucket") };
	}

	try {
		return uploadFile(fileData, decodedFileName);
	} catch (err) {
		return handleErrors(err);
	} finally {
		logger.debug(`S3 Upload for Filename: ${fileName} Completed`);
	}
};

const listFiles = async function () {
	const createFileObject = (name) => {
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
		} else {
			logger.debug(`Files Returned (${response.Contents.length}): ${JSON.stringify(response.Contents.map((file) => file.Key))}`);
			files = response.Contents.map((file) => {
				return createFileObject(file.Key);
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
	console.log(fileName)
	logger.debug("Modifying File in S3 Bucket");

	const extractedPath = fileProperties.name.split('/');
	const extractedFolderPath = extractedPath.slice(0, extractedPath.length - 1).join('/') + '/';

	logger.error(`Extracted Path: ${extractedFolderPath}`);

	await createFolderInS3(extractedFolderPath)

	try {
		if (fileName.endsWith('/')) {
			const listFilesReqParams = { Bucket: "file-explorer-s3-bucket", Prefix: fileName };
			const response = await s3Client.send(new ListObjectsCommand(listFilesReqParams));
			const files = response.Contents || [];

			for (const file of files) {
				const newFileName = extractedFolderPath + file.Key.substring(fileName.length);
				const copyReqParams = { Bucket: "file-explorer-s3-bucket", CopySource: "file-explorer-s3-bucket/" + file.Key, Key: newFileName };
				await s3Client.send(new CopyObjectCommand(copyReqParams));
				await s3Client.send(new DeleteObjectCommand({ Bucket: "file-explorer-s3-bucket", Key: file.Key }));
			}
		} else {
			const copyReqParams = { Bucket: "file-explorer-s3-bucket", CopySource: "file-explorer-s3-bucket/" + fileName, Key: fileProperties.name };
			const response = await s3Client.send(new CopyObjectCommand(copyReqParams));
			if (response.$metadata.httpStatusCode === 200) {
				await s3Client.send(new DeleteObjectCommand({ Bucket: "file-explorer-s3-bucket", Key: fileName }));
			} else {
				throw new Error("Error Copying File");
			}
		}

		return { status: 200, message: "File successfully modified in S3 Bucket" };

	} catch (err) {
		return handleErrors(err);
	} finally {
		logger.debug("S3 Modify Request Completed");
	}
};

const createFolder = async function (folderName) {
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

	const requestInfo = {
		Bucket: "file-explorer-s3-bucket",
		Prefix: folderName
	};

	const deleteRecursive = async () => {

		const response = await s3Client.send(new ListObjectsCommand(requestInfo));
		const files = response.Contents || [];

		for (const file of files) {
			const deleteRequest = {
				Bucket: "file-explorer-s3-bucket",
				Key: file.Key
			};

			await s3Client.send(new DeleteObjectCommand(deleteRequest));
		}

		const prefixes = response.CommonPrefixes || [];

		for (const prefix of prefixes) {
			await deleteRecursive(prefix.Prefix);
		}
	}

	try {

		await deleteRecursive(addTrailingSlash);

		const checkFilesExist = await s3Client.send(new ListObjectsCommand(requestInfo));
		const filesAfterDelete = checkFilesExist.Contents || [];
		if (filesAfterDelete.length === 0) {
			return "Folder successfully deleted from S3 Bucket";
		} else {
			return "Error deleting folder from S3 Bucket. Some files were not deleted.";
		}

	} catch (err) {
		return handleErrors(err);
	} finally {
		logger.debug("S3 Delete Folder Request Completed");
	}
};

const listFilesInFolder = async function (folderName) {
	const createFile = (name) => {
		const fileExtension = utils.extension.getFromFileName(name);
		const extensionType = utils.extension.checkValid(fileExtension)[0];

		const type = extensionType != 3 ? "-" : "d";
		const directory = '/';

		return new File(name, type, fileExtension, extensionType, directory);
	};

	logger.debug(`Requesting File List from Folder: ${folderName} in S3 Bucket`);

	const decodedFolderName = decodeURIComponent(folderName);
	const addTrailingSlash = !decodedFolderName.endsWith('/') && decodedFolderName != '' ? decodedFolderName + '/' : decodedFolderName;

	try {
		const requestInfo = {
			Bucket: "file-explorer-s3-bucket",
			Prefix: addTrailingSlash
		};

		const response = await s3Client.send(new ListObjectsCommand(requestInfo));
		let files = [];

		if (response.Contents === undefined) {
			logger.debug("No Files Found In: " + folderName);
		} else {
			logger.debug(`Files Returned (${response.Contents.length}): ${JSON.stringify(response.Contents.map((file) => file.Key))}`);
			files = response.Contents.map((file) => {
				return createFile(file.Key);
			});
		}

		const createNestedObject = (files) => {
			const trimmedFolderName = folderName.endsWith('/') ? folderName.slice(0, -1) : folderName;

			const nestedObject = {
				name: folderName === '' ? 'root' : trimmedFolderName.split('/').pop(),
				type: 'd',
				extension: 'Dir',
				extensionType: 3,
				directory: '',
				children: [],
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
							isOpen: currentObject.children.length !== 0 ? true : false,
							type: 'd',
							extension: 'Dir',
							extensionType: 3,
							directory: file.fileName,
							parentDir: currentObject.directory,
							children: [],
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
						parentDir: currentObject.directory,
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
