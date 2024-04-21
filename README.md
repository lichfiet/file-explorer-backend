
# File Explorer Project

This project is intended to showcase abilities ranging from programming to cloud architecture and system design. It's my first big project not following a tutorial and have learned everything on a need to know basis.

### File Access Methods:
- S3 with API Gatway
- SFTP

### To Do List:
- SSL for production (Might do SSL through Kubernetes and EKS and leave backend using http)
- Optimize the FTP Wrapper to use the "exists" function. Looping through the file array is slow.
- Cleanup SFTP code make easier to use (It's a mess, not sure how it works but it works on my machine)
- Change S3 method to use postgres to index files and folder, and change S3 keys to UUIDs
- Create a service for handling file uploads, and file downloads.
- API Reference
- Clean up code (*In progress but not a priority*)
- Auth with api key or jwt token verification.

## Start Development
This repository only contains the backend. There will soon be a publicly available front-end container you can use for development without configurations.
#### Requirements

- Node Version >= 18.0.0

#### Installation

Run the below commands in your linux terminal

```
git clone https://github.com/lichfiet/file-explorer-backend.git &&
cd ./file-explorer-backend &&
npm -i
mv .env.sample .env
```

And then to start, run `npm run dev`

Before you can get started with development, you will need either a SFTP server that takes url, port, user, and password, or a valid S3 Bucket, and AWS API Gateway, with the routes setup and specified in the [file-explorer-infra Github Repository](https://github.com/lichfiet/file-explorer-infra.git/) on my page. That should also have a readme with steps to get setup with the terraform files.

After this, you can take your API Gateway URL created, and plug it into your .env file.


Once you are up and running, you can connect on [http://localhost:8443/](http://localhost:8443/) after. Any changes made in your `./game` folder will auto-update the website.

### Project Structure

- All node server files are stored in the `src/` directory.
- Connection Method Wrappers are stored in `src/utils/fileAccessMethods/*`
- A static testing page is served on the `/` api route. It will be re-writen to test all functionality at some point so you don't need to run the front application for development.

#### Support Connection Methods 
- SFTP
- S3 Bucket with API Gateway

