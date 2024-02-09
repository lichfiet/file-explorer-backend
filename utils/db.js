const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize('postgres', 'postgres', 'password', {
    database: process.env.PG_DATABASE,
    username: process.env.PG_USERNAME,
    password: process.env.PG_PASSWORD,
    host: process.env.PG_HOST,
    port: process.env.PG_PORT,
    dialect: 'postgres',
    dialectOptions: {
        ssl: {
          require: true, // This will help you. But you will see nwe error
          rejectUnauthorized: false // This line will fix new error
        }
      },
    logging: msg => logger.info(`DB: ${msg}`)
});

const File = sequelize.define('File', {
    fileName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    fileType: {
        type: DataTypes.STRING,
        allowNull: false
    },
    fileExtension: {
        type: DataTypes.STRING,
        allowNull: false
    },
    fileExtensionType: {
        type: DataTypes.STRING,
        allowNull: false
    },
    folder: {
        type: DataTypes.STRING,
        allowNull: false
    },
    method: {
        type: DataTypes.STRING,
        allowNull: false
    }
})


module.exports = db = {
    connect: async () => {
        try {
            await sequelize.authenticate();
            logger.info('Connection has been established successfully.');
          } catch (error) {
            logger.error('Unable to connect to the database:', error);
          }
    },
    refreshModels: () => {sequelize.sync()},
    test: async () => {
        
       await File.create({
            fileName: 'bob2',
            fileType: '-',
            fileExtension: 'png',
            fileExtensionType: '1',
            folder: '/',
            method: 'S3'
        })

        logger.info("test1")
        return(await File.findAll({attributes: ['fileName']}))
    },
    syncData: () => {
        
    }
}
