/**
 * File Access Methods
 * - S3
 * - FTP
 */
// const { ftp } = require("./ftpWrapper.js");
const { s3 } = require("./s3Wrapper.js");


module.exports = {
	fileAccessMethodController: {
		getFile: async (fileName) => {
			return await s3.getFile(fileName);
		},
		deleteFile: async (fileName) => {
			return await s3.deleteFile(fileName);
		},
		uploadFile: async (fileData, fileName) => {
			return await s3.uploadFile(fileData, fileName);
		},
		modifyFile: async (newFileProperties, fileName) => {
			return await s3.modifyFile(newFileProperties, fileName);
		},
		createFolder: async (folderName) => {
			return await s3.createFolder(folderName);
		},
		deleteFolder: async (folderName) => {
			return await s3.deleteFolder(folderName);
		},
		listFilesInFolder: async (folderName) => {
			return await s3.listFilesInFolder(folderName);
		}
	}
};
