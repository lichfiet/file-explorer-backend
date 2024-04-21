const { Sequelize, DataTypes } = require("sequelize");

const pgConnector = new Sequelize("postgres", "postgres", "password", {
	database: process.env.PG_DATABASE,
	username: process.env.PG_USERNAME,
	password: process.env.PG_PASSWORD,
	host: process.env.PG_HOST,
	port: process.env.PG_PORT,
	dialect: "postgres",
	dialectOptions: {
		ssl: {
			require: true,
			rejectUnauthorized: false,
		},
	},
	logging: (msg) => logger.debug(`PG Database: ${msg}`),
});

const File = pgConnector.define("File", {
	fileName: {
		type: DataTypes.STRING,
		allowNull: false,
	},
	fileType: {
		type: DataTypes.STRING,
		allowNull: false,
	},
	fileExtension: {
		type: DataTypes.STRING,
		allowNull: false,
	},
	fileExtensionType: {
		type: DataTypes.STRING,
		allowNull: false,
	},
	folder: {
		type: DataTypes.STRING,
		allowNull: false,
	},
	method: {
		type: DataTypes.STRING,
		allowNull: false,
	},
});

module.exports = dbController = {
	connect: async () => {
		try {
			await pgConnector.authenticate();
			logger.info("Connection has been established successfully.");
		} catch (error) {
			logger.error("Unable to connect to the database:", error);
		}
	},
	refreshModels: () => {
		pgConnector.sync();
	},
	test: async () => {
		await File.create({
			fileName: "bob2",
			fileType: "-",
			fileExtension: "png",
			fileExtensionType: "1",
			folder: "/",
			method: "S3",
		});

		logger.info("test1");
		return await File.findAll({ attributes: ["fileName"] });
	},
	syncData: () => {},
};
