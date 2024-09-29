const amqp = require('amqplib/callback_api');

let connection;
let channel

const initialize = async () => {
    console.log('Initializing RabbitMQ');

    amqp.connect(`amqp://${process.env.RABBITMQ_HOST}`, (error, connectionObj) => {
      if (error) {
        console.error('Error connecting to RabbitMQ: ', error);
        throw error;
      }

      connection = connectionObj;
      console.log('Connected to RabbitMQ');

      connection.createChannel((error, channelObj) => {
        if (error) {
          console.error('Error creating channel: ', error);
          throw error;
        }
  
        channel = channelObj
        console.log('Created channel');
      })
  }
)};


const sendGenerateThumbnailMessage = (bucketName, key) => {
    console.log('Sending Generate Thumbnail Message');

    const message = {
        bucketName: bucketName,
        key: key
    }

    channel.sendToQueue('generateThumbnail', Buffer.from(JSON.stringify(message)), (error) => {
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

    channel.sendToQueue('deleteThumbnail', Buffer.from(JSON.stringify(message)))
};

module.exports = rabbit = {
    initialize: initialize,
    sendGenerateThumbnailMessage: sendGenerateThumbnailMessage,
    sendDeleteThumbnailMessage: sendDeleteThumbnailMessage
}