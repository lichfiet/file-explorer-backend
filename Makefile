# import config.
# You can change the default config with `make cnf="config_special.env" build`
cnf ?= ./.env 
include $(cnf)
export $(shell sed 's/=.*//' $(cnf))


# Set the default shell
export SYS_ARCH ?= $(shell uname -m)
ifeq ($(SYS_ARCH),x86_64)
	SYS_ARCH=amd64
endif

# HELP
# This will output the help for each task
# thanks to https://marmelab.com/blog/2016/02/29/auto-documented-makefile.html
.PHONY: help

help: ## This help.
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "%-30s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

.DEFAULT_GOAL := help


############################################################################################################
## DOCKER TASKS


## DEVELOPMENT
##################

build: ## Build the container
	docker build -t $(APP_NAME):dev --platform linux/$(SYS_ARCH) -f ./development/Dockerfile . --target=dev
	
build-nc: ## Build the container with no cache
	docker build -t $(APP_NAME):dev --platform linux/$(SYS_ARCH) --no-ca

rm: ## Remove the container
	docker rm ${APP_NAME}

clean: # Remove images, modules, and cached build layers
	rm -rf node_modules
	make stop
	-docker rm ${APP_NAME}
	-docker image rm ${APP_NAME}:dev

## TESTING
##################

stop: ## Stop the running container
	-docker compose -f ./docker/compose.yaml down

start: ## WIP Docker compose
	docker compose --env-file .env -f ./development/compose.yaml up

start-d: ## WIP Docker compose in detached mode
	docker compose --env-file .env-f ./development/compose.yaml up -d

##################
## MISC
##################

## INITIALIZATION
init: # Initailize development environment and start it
	chmod u+x ./development/dev-init.sh
	./development/dev-init.sh
