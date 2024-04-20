/**
 * App Packages
 */
const axios = require("axios");
const utils = require("./utils.js");
const logger = require("./logger.js");
const SftpClient = require("ssh2-sftp-client");

/**
 * File Access Methods
 * - S3
 * - FTP
 */
const { ftp } = require("./fileAccessMethods/ftpWrapper.js");
const { s3 } = require("./fileAccessMethods/s3Wrapper.js");

/**
 * Var Setup
 */
const sftpClient = new SftpClient();
const sftpConnect = (config) => sftpClient.connect(config);
const sftpDisconnect = () => sftpClient.end();


module.exports = {
	files: {
		s3Functions: {
			deleteFile: async (fileName) => {
				logger.info("Deleting file from S3 Bucket");
				try {
					// list files and see if request is valid before deleting
					const fileList = await axios.get(
						`${process.env.S3_URL}/listFiles/file-explorer-s3-bucket`
					); // get data from s3

					const extractedFiles = JSON.parse(utils.data.xmlToJson(fileList.data))
						.ListBucketResult.Contents; // define variable with the array of files

					let formattedContents = [];

					if (extractedFiles.constructor !== Array) {
						logger.error("SINFGLE GFE");
						formattedContents.push(extractedFiles.Key);
					} else {
						for (var key in extractedFiles) {
							formattedContents.push(extractedFiles[key]["Key"]);
						}
					}

					logger.info("Extracted File List");

					logger.info(formattedContents);

					// if the file is a file in the bucket, then else
					if (formattedContents.includes(fileName) === true) {
						const response = await axios.delete(
							`${process.env.S3_URL}/deleteFile/file-explorer-s3-bucket/${fileName}`
						); // get data from s3
						// if response from aws is good
						if (response.status !== 200) {
							throw new Error(`Error received from S3 API: ${response.body}`);
						} else {
							return "File successfully deleted from S3 Bucket";
						}
					} else {
						throw new Error(
							`File requested for deletion does not exist, files look like: ${formattedContents}`
						);
					}
				} catch (err) {
					logger.error(err.message);
					throw new Error(err.message);
				} finally {
					logger.info("S3 Request Completed");
				}
			},
		},
		sftpFunctions: {
			delete: async function (fileName, config) {
				try {
					logger.info("Attempting Connection with file server...");
					await sftpConnect(config);
					logger.info("Communication Success...");
					let list = await sftpClient.list("/home/ftpuser/");

					// grab file list
					const formattedContents = [];
					for (var key in list) {
						formattedContents.push(list[key]["name"]);
					}

					// check if file requested is in list
					if (formattedContents.includes(fileName) === true) {
						await sftpClient.delete(fileName);
						return "File successfully deleted from SFTP Folder";
					} else {
						throw new Error(
							`File requested for deletion does not exist, files look like: ${formattedContents}`
						);
					}
				} catch (err) {
					throw new Error(err.message);
				} finally {
					await sftpDisconnect();
					logger.info("Request fulfilled, closing connection.");
				}
			},
		},
	},
	file: {
		getFile: async (fileName, config, method) => {
			if (method === "S3") {
				return await s3.getFile(fileName, config);
			} else if (method === "SFTP") {
                logger.error("meow")
				return await ftp.getFile(fileName, config);
			}
		},
		deleteFile: async (fileName, config, method) => {
			if (method === "S3") {
				return await s3.deleteFile(fileName, config);
			} else if (method === "SFTP") {
				return await ftp.deleteFile(fileName, config);
			}
		},
		listFiles: async (config, method) => {
			if (method === "S3") {
				return await s3.listFiles(config);
			} else if (method === "SFTP") {
				return await ftp.listFiles(config);
			}
		},
		uploadFile: async (fileData, fileName, config, method) => {
			if (method === "S3") {
				return await s3.uploadFile(fileData, fileName);
			} else if (method === "SFTP") {
				return await ftp.uploadFile(fileData, fileName, config);
			}
		},
		modifyFile: async (fileProperties, fileName, config) => {
			if (config.method === "S3") {
				return await s3.modifyFile(fileProperties, fileName, config);
			} else if (config.method === "SFTP") {
				return await ftp.modifyFile(fileProperties, fileName, config);
			}
		},
	}
};
