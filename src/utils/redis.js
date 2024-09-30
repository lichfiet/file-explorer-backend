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

const attemptConnection = async (retries = process.env.REDIS_RETRY_CONNECTION_ATTEMPTS, delay = process.env.REDIS_CONNECTION_RETRY_DELAY) => {
    return new Promise(async (resolve, reject) => {
        if (redisClient.isOpen) {
            logger.debug("Redis Connection Already Open");
            return resolve();
        }

        await redisClient.connect().then(async (connection, error) => {
            if (error) {
                if (retries === 0) {
                    return reject(new Error('Error connecting to Redis: ' + error));
                }
                console.error('Error connecting to Redis. Retrying...', error);
                setTimeout(() => {
                    attemptConnection(retries - 1, delay).then(resolve).catch(reject);
                }, delay);
            } else {
                console.log('Connected to Redis');
                resolve();
            }
        });
    });
  };

module.exports = redis = {
    connect: attemptConnection,
    redisGetS3Url: redisGetS3Url
};