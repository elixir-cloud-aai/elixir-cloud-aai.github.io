[proWES](https://github.com/elixir-cloud-aai/proWES/) is a proxy service that wraps around [GA4GH WES](https://github.com/ga4gh/workflow-execution-service-schemas)

When WES requests are received, proWES applies one or more configurable middlewares 
before forwarding the requests to appropriate WES instances in the network.
A plugin system makes it easy to write and inject middlewares tailored to specific 
requirements, such as for access control, request/response processing or validation, 
or the selection of suitable endpoints considering data use restrictions and client 
preferences.

### Implementation notes

proWES is a Flask microservice that supports OAuth2-based authorization out of the box 
(bearer authentication) and stores information about incoming and outgoing tasks in a 
NoSQL database (MongoDB). Based on our FOCA microservice archetype, it is highly 
configurable in a declarative (YAML-based!) manner. Forwarded tasks are tracked 
asynchronously via a RabbitMQ broker and Celery workers that can be easily scaled up. 
Both a Helm chart and a Docker Compose configuration are provided for easy deployment in 
native cloud-based production and development environments, respectively.

<div>
    <a href="https://github.com/elixir-cloud-aai/proWES">
        <img src="../images/overview_prowes.svg" alt="proWES architecture" width="627"/>
    </a>
</div>

## Installation

You can find a Helm chart in the [GitHub repository](https://github.com/elixir-cloud-aai/proWES/tree/dev/deployment) of proWES

Follow these instructions

- Install [Helm][helm-install]
- Clone the [proWES repository](https://github.com/elixir-cloud-aai/proWES/)

    ```sh
    git clone https://github.com/elixir-cloud-aai/proWES/
    ```

- Browse to `deployment` to find the `Chart.yaml` and the `values.yaml` files 

## Usage

First you must create a namespace in Kubernetes in which to deploy proWES. The
commands below assume that everything is created in the context of this
namespace. How the namespace is created depends on the cluster, so we won't
document it here.

There are some prerequisites to deploying proWES on Kubernetes. Namely:

- MongoDB:
  - in the same namespace reachable via 'mongodb'
  - DB called `prowes-db` created
  - database-user and database-password for `prowes-db` available in a Secret
    called 'mongodb'
- RabbitMQ:
  - in the same namespace reachable via 'rabbitmq-cluster'
- Secret called `.netrc` created (see below)

You'll need to configure an SFTP server connection using a `.netrc` file with
the following format:

```
machine my-sftp-server.com
login <username>
password <password>
```

Create a Kubernetes Secret from the `.netrc` file:

```bash
kubectl create secret generic netrc --from-file .netrc
```

You need to edit the `values.yaml` file to specify your `applicationDomain` and the `clusterType`

After this you can deploy proWES using `helm`:

```bash
helm install prowes . -f values.yaml
```

### Updates

If you want to edit any of the Deployments, you can update them with
`helm` and the `values.yaml` file. Once edited, you can run this command:

```bash
helm upgrade prowes . -f values.yaml
```

If you want to point to a different FTP server or change the login credentials
for the current FTP server, you can update the `.netrc` secret like so:

```bash
kubectl create secret generic netrc --from-file .netrc --dry-run -o yaml | kubectl apply -f -
```

## Technical details

### MongoDB

The MongoDB database is deployed using:

- `templates/mongodb/mongodb-deployment.yaml`

### RabbitMQ

The message broker RabbitMQ that allows the app to communicate with the worker
is deployed using:

- `templates/rabbitmq/rabbitmq-deployment.yaml`

### WES

proWES consists of five deployments: a Flask server and a Celery worker. These
are deployed using:

- `templates/prowes/prowes-deployment.yaml`
- `templates/prowes/celery-deployment.yaml`

You can use `ReadWriteOnce` if you don't have a `StorageClass`
that supports `RWX`. In that case, a `podAffinity` will be set to have the proWES pods
running on the same node.

## Destroy

Simply run:

```bash
helm uninstall prowes
```

