/**
 * Local Vars
 */
const SftpClient = require("ssh2-sftp-client");
const sftpClient = new SftpClient();
const sftpConnect = (config) => sftpClient.connect(config);
const sftpDisconnect = () => sftpClient.end();
const logger = require("../../middlewares/logger");
const { raw } = require("express");

class File {
	constructor(fileName, fileType, fileExtension, fileExtensionType) {
		this.fileName = fileName;
		this.fileType = fileType;
		this.fileExtension = fileExtension;
		this.fileExtensionType = fileExtensionType;
	}
}

const createFile = (name) => {

	const fileExtension = utils.extension.getFromFileName(name);
	logger.debug("File Extension: " + fileExtension);
	const extensionType = utils.extension.checkValid(fileExtension)[0];
	
	const type = extensionType != 3 ? "-" : "d";
	const directory = '/';

	return new File(name, type, fileExtension, extensionType, directory);
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

	const formattedContents = await list.map(
		(file) => { 
			const rawFileName = file.name;
			const fileName = file.type === 'd' ? rawFileName + '/' : rawFileName;

			return createFile(fileName);
		});

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
