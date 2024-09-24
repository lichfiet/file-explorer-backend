FROM node:18-alpine as base
WORKDIR /usr/app/

### ENVIRONMENT VARIABLES #################
# Server Config
ENV PORT=8443
ENV LOG_LEVEL="DEBUG" 
ENV APP_NAME="file-explorer-backend"

# AWS S3 Configuration
ENV AWS_REGION="us-west-1"
ENV AWS_ACCESS_KEY_ID="NO_ACCESS_KEY_DEFINED"
ENV AWS_SECRET_ACCESS_KEY="NO_SECRET_KEY_DEFINED"

# RabbitMQ Configuration
ENV RABBITMQ_HOST="localhost"

# Postgres Connection Info
ENV PG_DATABASE="postgres"
ENV PG_USERNAME="postgres"
ENV PG_PASSWORD="password"
ENV PG_HOST="localhost"
ENV PG_PORT="5432"
#############################################


### INSTALL BASE DEPENDENCIES
FROM base AS install

# Install make and python3 for node-gyp dependency
RUN apk update
RUN apk add gcc g++ python3 make 

## NODE MODULES

# Install Dev Node Modules
RUN mkdir -p /var/dev
COPY package.json package-lock.json /var/dev/
RUN cd /var/dev && npm install --development
# Install Prod Node Modules
RUN mkdir -p /var/prod
COPY package.json package-lock.json /var/prod/
RUN cd /var/prod && npm install --production

##
## Development Build
## - copy dev dependencies and source code into final image
##
FROM base AS dev
COPY --from=install /var/dev/node_modules node_modules
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
COPY --from=dev /usr/app/src/ ./src/
COPY --from=dev /usr/app/package.json package.json

# run the app
EXPOSE 8443/tcp
CMD npm start
