
# file-explorer-backend

This is the Node.js backend for the file explorer project. 

## Start Development
This repository only contains the backend. A postman collection will be provided for testing the API at some point.

#### Requirements

- Node Version >= 18.0.0
- Docker

### Initial Setup

First, run the below commands in your Linux terminal:

```bash
git clone https://github.com/lichfiet/file-explorer-backend.git &&
cd ./file-explorer-backend &&
npm -i
cp .env.sample .env
```

Before you can get started with development, you will need a valid S3 Bucket, and AWS IAM Credcentials. The Terraform and instructions to make credentials are located in. [file-explorer-infra Github Repository](https://github.com/lichfiet/file-explorer-infra.git/).

After you have either of these, you can take your AWS IAM Credentials, and plug it into your .env file, like this.

```
# AWS S3 Configuration
AWS_REGION="us-west-1"
AWS_ACCESS_KEY_ID=key_here
AWS_SECRET_ACCESS_KEY=access_key_here
```

After credentials/config has been updated in your `.env`, you can run the server with `docker compose --env-file .env -f ./development/compose.yaml up`. THe compose file has a volume mount to the local directory, so you can make changes to the code and they will be reflected in the container, and subsequently the backend.

Once you are up and running, you can connect on [http://localhost:8443/](http://localhost:8443/). This serves a basic HTML page that allows you to test features without the use of the front-end. It will be updated to test all methods in the future. You may need to wait some time for rabbitmq to start up, so both the thumbnailer and backend containers can comnunicate.

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
        │   └── compose.yaml # Docker compose file for development environment
        ├── Makefile # Makefile for automating tasks
        ├── package.json # Node.js dependencies and scripts
        ├── README.md # Documentation for the project
        └── src/
            ├── index.html # Entry point for the application
            ├── middlewares/
            │   ├── error.js # Middleware for handling errors
            │   ├── etc.
            ├── server.js # Main server file
            └── utils/
                ├── fileAccess/ # Soon to remove sftp and make one objet with all the methods
                │   ├── fileAccessMethodController.js # Controller for file access methods
                │   ├── ftpWrapper.js # Wrapper for FTP file access
                │   └── s3Wrapper.js # Wrapper for S3 file access
                └── utilityWrapper.js # General utilities

</details>
<br>

- All node server files are stored in the `src/` directory.
- Connection Method Wrappers are stored in `src/utils/fileAccessMethods/*`
- A static testing page is served on the `/` api route. It will be re-writen to test all functionality at some point so you don't need to run the front application for development.
- utils for common data manipulation and querying functions are stored in the `src/utils/utils.js file`


### To Do List:
- Clean up code *(In progress always)*
- API Reference
- Auth with api key or jwt token verification.

