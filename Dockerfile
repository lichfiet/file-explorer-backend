FROM node:18-alpine
LABEL authors="Trevor Lichfield"

ENV ENVIRONMENT="dev"

# Create app directory
WORKDIR /src

# Copy files
COPY ../ /src/

# update each dependency in package.json to the latest version
RUN apk add build-base python3 make 
RUN npm install --target_arch=x64 --target_platform=linux --target_libc=glibc

EXPOSE 8443
CMD npm run ${ENVIRONMENT}
