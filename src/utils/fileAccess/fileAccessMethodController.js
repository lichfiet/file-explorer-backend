/**
 * App Packages
 */
const logger = require("../../middlewares/logger.js");

/**
 * File Access Methods
 * - S3
 * - FTP
 */
const { ftp } = require("./ftpWrapper.js");
const { s3 } = require("./s3Wrapper.js");


module.exports = {
	fileAccessMethodController: {
		/**
		 * getFile
		 * 
		 * @param {string} fileName 
		 * @param {object} config 
		 * @param {string} method 
		 * @returns {fileBuffer}
		 */
		getFile: async (fileName, config, method) => {
			if (method === "S3") {
				return await s3.getFile(fileName, config);
			} else if (method === "SFTP") {
				logger.error("meow")
				return await ftp.getFile(fileName, config);
			}
		},
		/**
		 * deleteFile
		 * 
		 * @param {string} fileName 
		 * @param {object} config 
		 * @param {string} method 
		 * @returns {string}
		 */
		deleteFile: async (fileName, config, method) => {
			if (method === "S3") {
				return await s3.deleteFile(fileName, config);
			} else if (method === "SFTP") {
				return await ftp.deleteFile(fileName, config);
			}
		},
		/**
		 * listFiles
		 * 
		 * @param {object} config
		 * @param {string} method
		 * @returns {array}
		 */
		listFiles: async (config, method) => {
			if (method === "S3") {
				return await s3.listFiles(config);
			} else if (method === "SFTP") {
				return await ftp.listFiles(config);
			}
		},
		/**
		 * uploadFile
		 * 
		 * @param {fileBuffer} fileData 
		 * @param {string} fileName 
		 * @param {object} config 
		 * @param {string} method 
		 * @returns {string}
		 */
		uploadFile: async (fileData, fileName, config, method) => {
			if (method === "S3") {
				return await s3.uploadFile(fileData, fileName);
			} else if (method === "SFTP") {
				return await ftp.uploadFile(fileData, fileName, config);
			}
		},
		/**
		 * modifyFile
		 * 
		 * @param {object} fileProperties 
		 * @param {string} fileName 
		 * @param {object} config 
		 * @returns {object}
		 */
		modifyFile: async (fileProperties, fileName, config) => {
			if (config.method === "S3") {
				return await s3.modifyFile(fileProperties, fileName, config);
			} else if (config.method === "SFTP") {
				return await ftp.modifyFile(fileProperties, fileName, config);
			}
		},
	}
};