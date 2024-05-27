
# file-explorer-backend

This is the Node.js backend for the file explorer project.

## Start Development
This repository only contains the backend. The front end will be containerized at some point so you can build it and forget about it when developing.

#### Requirements

- Node Version >= 18.0.0
- *docker (soon)*

### Initial Setup

First, run the below commands in your Linux terminal:

```bash
git clone https://github.com/lichfiet/file-explorer-backend.git &&
cd ./file-explorer-backend &&
npm -i
mv .env.sample .env
```

And then to start, run `npm run dev`

Before you can get started with development, you will need either a SFTP server that takes url, port, user, and password, or a valid S3 Bucket, and AWS API Gateway, with the routes setup and specified in the [file-explorer-infra Github Repository](https://github.com/lichfiet/file-explorer-infra.git/).

After you have either of these, you can take your API Gateway URL created or SFTP Server Information, and plug it into your .env file, like this.

```
# S3 Configuration
S3_URL="https://bl675jy3js.execute-api.us-west-1.amazonaws.com/dev"
```
**Or**
```
#SFTP Configuration
SFTP_URL="localhost"
SFTP_USERNAME="ftpuser"
SFTP_PASSWORD="pass"
SFTP_PORT="22"
```

*When I understand it well enough to write instructions, I'll add similar information for the SFTP method*

Once you are up and running, you can connect on [http://localhost:8443/](http://localhost:8443/).

## Project Structure

<details>
    <summary>Project Structure Tree</summary>

        .
        ├── .dockerignore # Specifies files to ignore when building a Docker image
        ├── .env.sample # Sample environment variables file
        ├── .github/ # GitHub Actions workflow for building Docker image
        ├── .gitignore # Specifies files to ignore in Git
        ├── development/
        │   ├── dev-init.sh # Initialization script for development environment
        │   └── Dockerfile # Dockerfile for development environment
        ├── Makefile # Makefile for automating tasks
        ├── package.json # Node.js dependencies and scripts
        ├── README.md # Documentation for the project
        └── src/
            ├── index.html # Entry point for the application
            ├── middlewares/
            │   ├── authentication.js # Middleware for handling authentication
            │   ├── logger.js # Middleware for logging requests
            │   └── validation.js # Middleware for validating requests
            ├── server.js # Main server file
            └── utils/
                ├── db.js # Database utilities
                ├── fileAccess/
                │   ├── fileAccessMethodController.js # Controller for file access methods
                │   ├── ftpWrapper.js # Wrapper for FTP file access
                │   └── s3Wrapper.js # Wrapper for S3 file access
                ├── utilityWrapper.js # General utilities
                └── user/ # WIP

</details>
<br>

- All node server files are stored in the `src/` directory.
- Connection Method Wrappers are stored in `src/utils/fileAccessMethods/*`
- A static testing page is served on the `/` api route. It will be re-writen to test all functionality at some point so you don't need to run the front application for development.
- utils for common data manipulation and querying functions are stored in the `src/utils/utils.js file`


### To Do List:
- Clean up code *(In progress always)*
- Store S3 and SFTP config information in SQL db and retrieve based on user
- SSL for production (Might do SSL through Kubernetes and EKS and leave backend using http)
- Optimize the FTP Wrapper to use the "exists" function. Looping through the file array is slow.
- Cleanup SFTP code make easier to use (It's a mess, not sure how it works but it works on my machine)
- Change S3 method to use postgres to index files and folder, and change S3 keys to UUIDs
- Create a scalable service for handling file uploads, and file downloads.
- API Reference
- Auth with api key or jwt token verification.

