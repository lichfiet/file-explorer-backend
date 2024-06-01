
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

Before you can get started with development, you will need either a SFTP server that takes url, port, user, and password, or a valid S3 Bucket, and AWS IAM Credcentials. The Terraform and instructions to make credentials are located in. [file-explorer-infra Github Repository](https://github.com/lichfiet/file-explorer-infra.git/). Information on how to set up the FTP communication will come soon.

After you have either of these, you can take your AWS IAM Credentials or SFTP Server Information, and plug it into your .env file, like this.

```
# AWS S3 Configuration
AWS_REGION="us-west-1"
AWS_ACCESS_KEY_ID=key_here
AWS_SECRET_ACCESS_KEY=access_key_here
```
**Or**
```
#SFTP Configuration
SFTP_URL="localhost"
SFTP_USERNAME="ftpuser"
SFTP_PASSWORD="pass"
SFTP_PORT="22"
```

After credentials/config has been updated in your `.env`, you can run the server with `npm run dev`.

Once you are up and running, you can connect on [http://localhost:8443/](http://localhost:8443/). This serves a basic HTML page that allows you to test features without the use of the front-end. It will be updated to test all methods in the future.

Now that you've finished this, you can jump back to the front-end and test you backend service!

### Containerized Running

You can build the backend and run it in a container with `make build` to create the Docker image, and then `make run-d` to run a detatched version of the container, for ease of use in developing the front-end.

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
- Optimize the FTP Wrapper to use the "exists" function. Looping through the file array is slow.
- Cleanup SFTP code make easier to use (It's a mess, not sure how it works but it works on my machine)
- Create a scalable service for handling file uploads, and file downloads.
- API Reference
- Auth with api key or jwt token verification.

