const SftpClient = require('ssh2-sftp-client');

const sftpConfig = {
    host: 'localhost',
    port: '22', // Typically 22 for SFTP
    username: 'ftpuser',
    password: 'pass'
}

const client = new SftpClient()

const sftpConnect = () => client.connect(sftpConfig)
const sftpDisconnect = () => client.end()

module.exports = sftp = {

        // GET Endpoint to retrieve files
        get : async function(fileName) {

            console.log("Attempting Connection with file server...");
            await sftpConnect()

            console.log("Communication Success...", '\n');
            
            let file = await (client.get(fileName))

            await sftpDisconnect()
            console.log("Request fulfilled, closing connection.", '\n')

            console.log("Sending the file to client...");
            return(file);
        },

        // GET Endpoint to retrieve directory contents
        list : async function() {
            console.log("Attempting Connection with file server...");
            await sftpConnect()

            console.log("Communication Success...", '\n');

            let list = await client.list('/home/ftpuser/')

            await sftpDisconnect()
            console.log("Request fulfilled, closing connection.", '\n')

            console.log("Sending the file list to client...");
            return(list);
        },

        // PUT endpoint to upload file
        upload : async function(fileData, test) {
            console.log("Attempting Connection with file server...");
            await sftpConnect()

            console.log("Communication Success...", '\n');

            let upload = await client.put(fileData, test)

            await sftpDisconnect()
            console.log("Request fulfilled, closing connection.", '\n')

            console.log("Sending the file list to client...");
            return(upload);
        },

        delete : async function(fileName) {
            console.log("Attempting Connection with file server...");
            await sftpConnect()

            console.log("Communication Success...", '\n');

            let del = await client.delete(fileName)

            await sftpDisconnect()
            console.log("Request fulfilled, closing connection.", '\n')

            console.log("Sending the file list to client...");
            return(del);
        }
    
}
