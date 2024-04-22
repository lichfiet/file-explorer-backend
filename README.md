
# file-explorer-backend

This is the Node.js backend for the file explorer project, a full setup guide will exist in the [lichfiet/file-explorer-web](https://github.com/lichfiet/file-explorer-web) repository at some point, but this will walk you through getting setup for development of the backend 

*(If using the S3 Method, you'll first need to setup your API Gateway and Bucket by following [this tutorial](https://github.com/lichfiet/file-explorer-infra)).*



## Start Development
This repository only contains the backend. The front end will be containerized at some point so you can build it and forget about it when developing.

#### Requirements

- Node Version >= 18.0.0
- *docker (soon)*

### Initial Setup

First, run the below commands in your linux terminal:

```bash
git clone https://github.com/lichfiet/file-explorer-backend.git &&
cd ./file-explorer-backend &&
npm -i
mv .env.sample .env
```

And then to start, run `npm run dev`

Before you can get started with development, you will need either a SFTP server that takes url, port, user, and password, or a valid S3 Bucket, and AWS API Gateway, with the routes setup and specified in the [file-explorer-infra Github Repository](https://github.com/lichfiet/file-explorer-infra.git/). There is a tutorial for getting setup in there that walks you through the whole process.

After this, you can take your API Gateway URL created, and plug it into your .env file, like this.

```
# S3 Configuration
S3_URL="https://bl675jy3js.execute-api.us-west-1.amazonaws.com/dev"
```

*When I understand it well enough to write instructions, I'll add similar information for the SFTP method*

Once you are up and running, you can connect on [http://localhost:8443/](http://localhost:8443/).

## Project Structure

- All node server files are stored in the `src/` directory.
- Connection Method Wrappers are stored in `src/utils/fileAccessMethods/*`
- A static testing page is served on the `/` api route. It will be re-writen to test all functionality at some point so you don't need to run the front application for development.
- utils for common data manipulation and querying functions are stored in the `src/utils/utils.js file`

### To Do List:
- Clean up code (*In progress always*)
- SSL for production (Might do SSL through Kubernetes and EKS and leave backend using http)
- Optimize the FTP Wrapper to use the "exists" function. Looping through the file array is slow.
- Cleanup SFTP code make easier to use (It's a mess, not sure how it works but it works on my machine)
- Change S3 method to use postgres to index files and folder, and change S3 keys to UUIDs
- Create a scalable service for handling file uploads, and file downloads.
- API Reference
- Auth with api key or jwt token verification.