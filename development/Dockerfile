FROM node:18-alpine as base
WORKDIR /usr/app/

### ENVIRONMENT VARIABLES #################
# Server Config
ENV PORT=8443
ENV LOG_LEVEL="INFO" 
ENV APP_NAME="file-explorer-backend"

# AWS S3 Configuration
ENV AWS_REGION="us-west-1"
ENV AWS_ACCESS_KEY_ID="NO_ACCESS_KEY_DEFINED"
ENV AWS_SECRET_ACCESS_KEY="NO_SECRET_KEY_DEFINED"
ENV AWS_S3_BUCKET="NO_S3_BUCKET_DEFINED"

# RabbitMQ Configuration
ENV RABBITMQ_HOST="NO_RABBITMQ_HOST_DEFINED"
ENV RABBITMQ_RETRY_CONNECTION_ATTEMPTS=5
ENV RABBITMQ_CONNECTION_RETRY_DELAY=6000

ENV REDIS_HOST="NO_REDIS_HOST_DEFINED"
ENV REDIS_PORT="6379"
ENV REDIS_PASSWORD=""
ENV REDIS_CONNECTION_RETRY_DELAY=6000
ENV REDIS_RETRY_CONNECTION_ATTEMPTS=5
#############################################


### INSTALL BASE DEPENDENCIES
FROM base AS install

# Install make and python3 for node-gyp dependency
RUN apk update
RUN apk add gcc g++ python3 make 

## NODE MODULES

# Install Prod Node Modules
RUN mkdir -p /var/prod
COPY package.json package-lock.json /var/prod/
RUN cd /var/prod && npm install --production

##
## Development Build
## - copy dev dependencies and source code into final image
##
FROM base AS dev

# Install make and python3 for node-gyp dependency
RUN apk update
RUN apk add gcc g++ python3 make 

# Install Dev Node Modules
RUN cd /usr/app
COPY package.json package-lock.json ./
RUN npm install --development

COPY ./ /usr/app/

# run the app
EXPOSE 8443/tcp
RUN printenv
CMD npm run dev

##
## Staging Build
## - copy production dependencies and source code into final image
##
FROM base AS stage

ENV LOG_LEVEL="DEBUG"

COPY --from=install /var/prod/node_modules node_modules
COPY --from=dev /usr/app/src/ ./src/ 
COPY --from=dev /usr/app/package.json package.json

# run the app
EXPOSE 8443/tcp
CMD npm run stage

##
## Production Build
## - copy production dependencies and source code into final image
##
FROM base AS prod

ENV LOG_LEVEL="info"

COPY --from=install /var/prod/node_modules node_modules
COPY ./src/ /usr/app/src/ 
COPY ./package.json /usr/app/package.json

# run the app
EXPOSE 8443/tcp
CMD npm start
