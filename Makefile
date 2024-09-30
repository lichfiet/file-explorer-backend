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
	@echo "\n...Building Backend Container Image... \n"
	docker build -t $(APP_NAME):dev --platform linux/$(SYS_ARCH) -f ./development/Dockerfile . --target=dev
	
build-nc: ## Build the container with no cache
	docker build -t $(APP_NAME):dev --platform linux/$(SYS_ARCH) --no-cache -f ./development/Dockerfile . --target=dev

run: ## Run container on port configured in `config.env`
	@echo "\n...Launching Dev Server... \n"
	docker run -it --rm -p $(PORT):$(PORT) --name $(APP_NAME) -env=LOG_LEVEL=DEBUG $(APP_NAME):dev 
	@echo "\nHold ctrl and click this link 'http://localhost:${PORT}'\n"

run-d: ## Run container on port configured in `config.env` in detached mode
	@echo "\n...Launching Dev Server... \n"
	docker run -it --rm -p $(PORT):$(PORT) --name $(APP_NAME) -d $(APP_NAME):dev
	@echo "\nHold ctrl and click this link 'http://localhost:${PORT}'\n"


## STAGE TESTING
##################

run-stage: ## Run container on port configured in `config.env`
	@echo "\n...Launching Dev Server... \n"
	docker run -it --rm -p $(PORT):$(PORT) --name $(APP_NAME) -e PORT=8443 -e LOG_LEVEL="DEBUG" $(APP_NAME):dev 
	@echo "\nHold ctrl and click this link 'http://localhost:${PORT}'\n"


stop: ## Stop the running container
	@echo "\n...Stopping Docker Container... \n"
	-docker stop ${APP_NAME}
	-docker compose -f ./docker/compose.yaml down
	@echo "\n...Docker Container Stopped... \n"

rm: ## Remove the container
	@echo "\n...Removing Docker Container... \n"
	docker rm ${APP_NAME}
	@echo "\n...Docker Container Removed... \n"

start: ## WIP Docker compose
	docker compose --env-file .env -f ./development/compose.yaml up

start-d: ## WIP Docker compose in detached mode
	docker compose -f ./development/compose.yaml up -d



##################
## MISC
##################

## INITIALIZATION
init: # Initailize development environment and start it
	chmod u+x ./development/dev-init.sh
	./development/dev-init.sh
	@echo "\nDevelopment Environment Successfully Initialied"
	@echo "\nType 'make help' for a list of commands\n"

## CLEANUP
clean: # Remove images, modules, and cached build layers
	rm -rf node_modules
	-docker stop ${APP_NAME}
	-docker rm ${APP_NAME}
	-docker image rm ${APP_NAME}:dev
	-docker image rm ${APP_NAME}:stage
	-docker image rm ${APP_NAME}:latest