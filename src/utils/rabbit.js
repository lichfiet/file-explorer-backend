const amqp = require('amqplib/callback_api');

let connection;

const initialize = async () => {
    console.log('Initializing RabbitMQ');

    amqp.connect(`amqp://${process.env.RABBITMQ_HOST}`, (error, connection) => {
      if (error) {
        console.error('Error connecting to RabbitMQ: ', error);
        throw error;
      }

      console.log('Connected to RabbitMQ');
    })
};

const sendGenerateThumbnailMessage = (bucketName, key) => {
    console.log('Sending Generate Thumbnail Message');

    const message = {
        bucketName: bucketName,
        key: key
    }

    connection.publish('generateThumbnail', Buffer.from(JSON.stringify(message)), (error) => {
        if (error) {
            console.error('Error publishing Generate Thumbnail Message: ', error);
            throw error;
        }

        console.log('Published Generate Thumbnail Message');
    })
};

const sendDeleteThumbnailMessage = (bucketName, key) => {
    console.log('Sending Delete Thumbnail Message');

    const message = {
        bucketName: bucketName,
        key: key
    }

    connection.publish('deleteThumbnail', Buffer.from(JSON.stringify(message)), (error) => {
        if (error) {
            console.error('Error publishing Delete Thumbnail Message: ', error);
            throw error;
        }

        console.log('Published Delete Thumbnail Message');
    })
};

module.exports = rabbit = {
    initialize: initialize,
    sendGenerateThumbnailMessage: sendGenerateThumbnailMessage,
    sendDeleteThumbnailMessage: sendDeleteThumbnailMessage
}