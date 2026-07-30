# Building Docker image for the RCP


To build a Docker image for the RCP, we will use the [LiGHT cluster template](https://github.com/LiGHTers-playground/LiGHT-cluster-template).

Prerequisites:
- You need [docker](https://www.docker.com/) on your computer
- A Linux environment (as we are building docker images that target Linux)
- Good specs, building docker images require lots of resources in RAM and can take lots of space in your disk. Make sure that your computer is "good enough"

## Setup

On your machine:

```
git clone https://github.com/EPFLiGHT/LiGHT-cluster-template.git
```

The repository contains tutorials and reproducibility scripts for many clusters, but we will only focus on the RCP in thus tutorial.

```
cd LiGHT-cluster-template/installation/docker-amd64-cuda
```

We will build the docker images in the following way:

1. Build a generic docker image that contains all the dependencies (NVidia drivers, pip, uv, git, etc.)
2. Build many user docker images extending this generic image with the right permisions

This folder contains a `template.sh` file which contains all the available functions

### Creating a project on the EPFL registry

EPFL has a registry of docker images which works in a similar way to the Docker hub. This registry is used to store docker images and is only accessible through the EPFL network (you may use the [EPFL VPN](https://www.epfl.ch/campus/services/ressources-informatiques/network-services-reseau/acces-intranet-a-distance/clients-vpn-disponibles/)).

Connect to [registry.rcp.epfl.ch](https://registry.rcp.epfl.ch) with the VPN, with your GASPAR username and password. To push new docker images, you need to create a project, by clicking on "New project". Ensure that the project is set as **public**.

__IMPORTANT__: Beware that you will have to change the link of the docker images in the scripts according to the actual path of your project (mainly replacing multimeditron/basic by the right path).

### Generating the .env file

Run the following command:

```
./template.sh env
```

This command create a (hidden) `.env` file which looks like this:

```
# All user-specific configurations are here.

## For building:
# Which docker and compose binary to use
# docker and docker compose in general or podman and podman-compose for CSCS Clariden
DOCKER=docker
COMPOSE="docker compose"
# Use the same USRID and GRPID as on the storage you will be mounting.
# USR is used in the image name and must be lowercase.
# It's fine if your username is not lowercase, jut make it lowercase.
USR=john
USRID=1000
GRPID=984
GRP=users
# PASSWD is not secret,
# it is only there to avoid running password-less sudo commands accidentally.
PASSWD=john
# LAB_NAME will be the first component in the image path.
# It must be lowercase.
LAB_NAME=users

#### For running locally
# You can find the acceleration options in the compose.yaml file
# by looking at the services with names dev-local-ACCELERATION.
PROJECT_ROOT_AT=/path/to/LiGHT-cluster-template
ACCELERATION=cuda
WANDB_API_KEY=
# PyCharm-related. Fill after installing the IDE manually the first time.
PYCHARM_IDE_AT=


####################
# Project-specific environment variables.
## Used to avoid writing paths multiple times and creating inconsistencies.
## You should not need to change anything below this line.
PROJECT_NAME=template-project-name
PACKAGE_NAME=template_package_name
IMAGE_NAME=${LAB_NAME}/${USR}/${PROJECT_NAME}
IMAGE_PLATFORM=amd64-cuda
# The image name includes the USR to separate the images in an image registry.
# Its tag includes the platform for registries that don't hand multi-platform images for the same tag.
# You can also add a suffix to the platform e.g. -jax or -pytorch if you use different images for different environments/models etc.
```

Edit this file by setting `LAB_NAME` to the name of the project you have given in the previous step, and USR and PASSWD accordingly.
Set the `PROJECT_NAME` to a meaningful name to group the docker images that belong to the same project. Here we will choose to set it up to `basic`. Docker images with the same `PROJECT_NAME` will appear together in the `registry.rcp.epfl.ch` interface.

We also change the `IMAGE_NAME` to another template for organization purpose.

Edit the corresponding lines to the following lines:

```
LAB_NAME=multimeditron # Replace it with the name of your project
PROJECT_NAME=basic # Optional: Change this to a more meaningful name (e.g. vllm or axolotl for instance)
IMAGE_NAME=${LAB_NAME}/${PROJECT_NAME}
```

### Building the generic docker image

Beware that this docker image uses the `Dockerfile` to build. You may need to change the base Docker image in `compose-base.yaml`:

```
BASE_IMAGE: nvcr.io/nvidia/pytorch:pytorch:24-07-py3 # (Optional: Change this tag to a newer version)
```

You can change this line to another newer version that you can find [here](https://catalog.ngc.nvidia.com/orgs/nvidia/containers/pytorch/tags). This will change the version of the NVidia driver that many libraries rely on. Some of the latest features may only be compatible with the newer version of the drivers (for instance the flash-attn library).

To build the generic docker image run the following command:

```
./template.sh build_generic
```

Useful commands:

`docker images`: To list all the docker images on your machine. Search for the one that you just built, it should have the name that you set up in `IMAGE_NAME`. So if we are using multimeditron, it will be tagged as `multimeditron/basic:amd64-cuda-root-latest` and `multimeditron/basic:amd64-cuda-root-<some git commit hash>`

`docker run --rm -it --entrypoint bash multimeditron/basic:amd64-cuda-root-latest`: To bash into your new docker image and test if you have everything installed correctly.

### Building the user docker images

Find your user id:

```sh
ssh $GASPAR@haas001.rcp.epfl.ch
```

Then use your EPFL password to log in, then find your UID by checking at the beginning of the output of this command:

```sh
id $GASPAR
```

Connect to [groups.epfl.ch](https://groups.epfl.ch), "Groups I'm member of" and search for light-scratch. You need the `GID` field.

To build user docker images, you need to edit the `.env` file. You need to change the following attributes:

```
GRPID=<GID of the light-scratch>

USRID=<UID of the user>
USR=<Username of the user, the GASPAR>
PASSWD=<Username of the user>
```


To build the user docker image, run:

```
./template.sh build_user
```

### Push the docker images

Login to the registry:

```
docker login registry.rcp.epfl.ch
```

The login informations are your EPFL credentials

```
./template.sh push_generic RCP
./template.sh push_user RCP
```

