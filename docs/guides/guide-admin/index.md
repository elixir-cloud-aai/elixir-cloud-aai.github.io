# Administrator guide

Welcome to the systems administrator guide to the [ELIXIR Cloud][elixir-cloud].
Whether you would like to onboard your data or compute center, set up your own
[GA4GH][ga4gh]-based cloud or simply play around with our compute and storage
solutions, this is the right place to get you off the ground.

## General deployment notes

Most of our services (see our [GitHub organization][elixir-cloud-aai-github]
for a comprehensive list) come with [Helm](https://helm.sh/) charts for
deployment on Cloud Native infrastructure and [Docker
Compose](https://docs.docker.com/compose/) configurations for
testing/development deployments. If you do not have experience with these
technologies, please find some brief primers with references to additional
documentation below.

### Using Helm

[Helm][helm] is an IaC tool that is described as the "package manager for
Kubernetes". It allows the management of the lifecycle of a Kubernetes
application, i.e., its deployment, configuration, upgrade, retiring, etc.
Applications ara packaged into "Charts".  Using Helm Charts allows us to
version control an application and therefore follow its evolution over time,
make identical copies (e.g., development, staging, production), make
predictable upgrades, and share/publish the application. 

Some useful Helm commands to manage a Chart are:

- `helm create`: Create a Helm Chart
- `helm install`: Install an application
- `helm upgrade`: Upgrade an application
- `helm uninstall`: Uninstall an application

### Using Docker Compose

Most of our services provide a [Docker Compose][docker-compose] configuration
file for easy deployment of the software on a local machine. If the [Docker
Engine][docker-engine] and [Docker Compose][docker-compose] are already
installed on your system, it is as simple as cloning the service's Git
repository, changing into the folder where the Docker Compose file resides
(typically `docker-compose.yml` in a repository's root directory) and running
the following:

```sh
docker-compose up -d
```

!!! note "Non-standard name or location of config file"
    The command will be different if the Docker Compose config file is _not_ in
    the current working directory and/or is _not_ called `docker-compose.yml`.

This will bring the service up. The argument `-d` (or `--detach`) starts the
app in daemonized mode, i.e., all launched containers that compose creates run
in the background.

In order to stop the deployment, simply run:

```sh
docker-compose down
```

## Onboarding your compute center

Follow the instructions below to onboard your compute node with the [ELIXIR
Cloud][elixir-cloud]. Afterwards, your compute cluster will be accessible
through the [GA4GH][ga4gh] Task Execution Service ([TES][ga4gh-tes]) API and,
optionally, available in the ELIXIR Cloud compute network.

### Deploying compute

Depending on whether you have a Native Cloud cluster or an HPC/HTC, you will
need to follow the instructions for deploying [TESK](tesk.md) or [Funnel](funnel.md)
respectively.

### Deploying storage

Follow the instructions to connect your TES endpoint to one or more
ELIXIR Cloud cloud storage solutions. The currently supported solutions are:

- [MinIO][minio] (Amazon S3)
- [vsftpd][vsftpd] (FTP)

!!! note "Other storage solutions"
    Other S3 and FTP implementations may work but have not been tested.

#### Deploying MinIO (Amazon S3)

In order to deploy the [MinIO][minio] server, follow the [official
documentation][minio-docs-k8s]. It is very simple

If you are deploying Minio to OpenShift, you may find this
[Minio-OpenShift][minio-deploy-openshift-template] template useful.

You can also follow the instructions of this [MinIO Helm Chart](https://github.com/CSCfi/helm-charts/tree/main/charts/minio)

#### Deploying `vsftpd` (FTP)

There are a lot of guides available online to deploy [`vsftpd`][vsftpd], for
example [this one][vsftpd-deploy]. There are only two considerations:

1. It is required to activate secure FTP support with `ssl_enable=YES`.
2. For onboarding with the ELIXIR Cloud, currently the server should have one
   account with a specific username and password created. Please [contact
   us][elixir-cloud-aai-email] for details.

### Registering your TES service

We are currently working on implementing access control mechanisms and
providing a user interface for the [ELIXIR Cloud
Registry][elixir-cloud-registry]. Once available, we will add registration
instructions here. For now, please let us know about your new TES endpoint by
[email][elixir-cloud-aai-email].
## Custom cloud deployments

!!! warning "Under construction"
    More info coming soon...
