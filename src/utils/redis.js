const { createClient } = require("redis");
const logger = require("./logger.js");

// Config for Redis is stored in .env file, REDIS_HOST, REDIS_PORT, REDIS_PASSWORD
const redisClient = createClient({
    url: 'redis://' + process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
    log: logger,
});

const redisGetS3Url = async (key) => {
    try {
        const redisGetS3Url = await redisClient.get(key);
        
        if (redisGetS3Url === null) {
            logger.debug(`Redis Key: ${key} not found`);
            const rabbit = require("./rabbit.js");
            await rabbit.sendGenerateThumbnailMessage("file-explorer-s3-bucket", key);
            return null;
        } else {
            logger.debug(`Redis Key: ${key} found`);
            return redisGetS3Url;
        }
    } catch (err) {
        logger.error(`Error Occurred Getting Redis Key: ${err}`);
        return err;
    } finally {
        logger.debug(`Redis Get for Key: ${key} Completed`);
    }
};

const connect = async () => {
    try {
        if (redisClient.isOpen) {
            logger.debug("Redis Connection Already Open");
            return;
        } else {
            logger.debug("Redis Connection Not Open, Opening Connection");
            await redisClient.connect();
        }
    } catch (err) {
        logger.error(`Error Occurred Connecting to Redis: ${err}`);
        return err;
    } finally {
        logger.debug(`Redis Connection Completed`);
    }
};


module.exports = redis = {
    connect: connect,
    redisGetS3Url: redisGetS3Url
};