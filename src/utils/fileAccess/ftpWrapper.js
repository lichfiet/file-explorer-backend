/**
 * Local Vars
 */
const SftpClient = require("ssh2-sftp-client");
const sftpClient = new SftpClient();
const sftpConnect = (config) => sftpClient.connect(config);
const sftpDisconnect = () => sftpClient.end();
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

const getFile = async function (fileName, config) {
	logger.debug("Attempting Connection with file server...");
	try {
		logger.debug("Connecting To Host: " + config.host);
		await sftpConnect(config);

		logger.info("Requesting file from FTP Server");
		const file = await sftpClient.get(fileName);

		logger.info("Sending the file to client...");
		return Buffer.from(file); // Convert array buffer to Buffer
	} catch (error) {
	} finally {
		await sftpDisconnect();
		logger.info("Request fulfilled, closing connection.");
	}
};

const listFiles = async function (config) {
	logger.info("Attempting Connection with FTP server...");

	await sftpConnect(config);
	logger.info("Communication Success...");

	let list = await sftpClient.list("/home/ftpuser/");

	await sftpDisconnect();
	logger.info("Request fulfilled, closing connection.", "\n");

	logger.info("Sending the file list to client...");

	const formattedContents = [];
	for (var key in list) {
		// format folders to have a / at the end of the name to work with createFile function
		const name = list[key]["name"];
		const formattedName = list[key]["type"] === "-" ? name : name + "/";
		// Build array with item names
		formattedContents.push(createFile(formattedName));
	}

	logger.info("Filed returned:, " + formattedContents.length); // Return console log of contents

	return formattedContents;
};

const uploadFile = async function (fileData, test, config) {
	logger.info("Attempting Connection with file server...");
	await sftpConnect(config);

	logger.info("Communication Success...", "\n");

	await sftpClient.put(fileData, test);

	await sftpDisconnect();
	logger.info("Request fulfilled, closing connection.", "\n");

	logger.info("Sending upload status");
	return ("File uploaded successfully to SFTP Folder")
};

const deleteFile = async function (fileName, config) {
	const fileList = (await listFiles(config)).map((file) => file.fileName);

	try {	
		if (fileList.includes(fileName) === true) {
			await sftpConnect(config);
			await sftpClient.delete(fileName);
			return ("File successfully deleted from SFTP Folder");
		} else {
			throw new Error(
				`File requested for deletion does not exist, files look like: ${fileList}`
			);
		}
	} catch (err) {
		throw new Error(err.message);
	} finally {
		await sftpDisconnect();
		logger.info("Request fulfilled, closing connection.");
	}
};


const modifyFile = async function (fileName, config) {};

module.exports = {
	ftp: {
		getFile,
		uploadFile,
		deleteFile,
		listFiles,
		modifyFile,
	},
};
