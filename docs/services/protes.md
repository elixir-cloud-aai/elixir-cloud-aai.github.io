## Synopsis

proTES is a robust and scalable [Global Alliance for Genomics and Health
(GA4GH)][ga4gh] [Task Execution Service (TES) API](https://github.com/ga4gh/task-execution-schemas) gateway
that may play a pivotal role in augmenting the capabilities of your GA4GH Cloud
ecosystem by offering flexible middleware injection for effectively federating
atomic, containerized workloads across on premise, hybrid and multi-cloud
environments composed of GA4GH TES nodes.

## Description

proTES gateway may serve as a crucial component in federated compute networks
based on the GA4GH Cloud ecosystem. Its primary purpose is to provide
centralized features to a federated network of independently operated  GA4GH TES 
instances. As such, it can serve, for example, as a compatibility layer, a load
balancer workload distribution layer, a public entry point to an enclave of
independent compute nodes, or a means of collecting telemetry.

When TES requests are received, proTES applies configured middleware before
forwarding the requests to appropriate TES instances in the network. A plugin
system makes it easy to write and inject middlewares tailored to specific
requirements, such as for access control, request/response processing or
validation, or the selection of suitable endpoints considering data use
restrictions and client preferences.

### Built-in middleware plugins

Currently, there are two plugins shipped with proTES that each serve as
proof-of-concept examples for different task distribution scenarios:

* **Load balancing**: The `pro_tes.middleware.task_distribution.random` plugin
  evenly (actually: randomly!) distributes workloads across a network of TES
  endpoints
* **Bringing compute to the data**: The
  `pro_tes.middleware.task_distribution.distance` plugin selects TES endpoints 
  to relay incoming requests to in such a way that the distance the (input) data
  of a task has to travel across the network of TES endpoints is minimized. 

### Implementation notes

proTES is a [Flask][res-flask] microservice that supports
[OAuth2][res-oauth2]-based authorization out of the box (bearer authentication)
and stores information about incoming and outgoing tasks in a NoSQL database
([MongoDB][res-mongodb]). Based on our [FOCA][res-foca] microservice archetype,
it is highly configurable in a declarative (YAML-based!) manner. Forwarded tasks
are tracked asynchronously via a [RabbitMQ][res-rabbitmq] broker and
[Celery][res-celery] workers that can be easily scaled up. Both a
[Helm][res-helm] chart and a [Docker Compose][res-docker-compose] configuration
are provided for easy deployment in native cloud-based production and
development environments, respectively.

<div>
    <a href="https://github.com/elixir-cloud-aai/proTES">
        <img src="../images/overview_protes.svg" alt="proTES architecture" width="627"/>
    </a>
</div>

## Installation

You can find a Helm chart in the [GitHub repository](https://github.com/elixir-cloud-aai/proTES/tree/dev/deployment) of proTES

Follow these instructions

- Install [Helm][helm-install]
- Clone the [proTES repository](https://github.com/elixir-cloud-aai/proTES/)

    ```sh
    git clone https://github.com/elixir-cloud-aai/proTES.git
    ```

- Browse to `deployment` to find the `Chart.yaml` and the `values.yaml` files 

## Usage

First you must create a namespace in Kubernetes in which to deploy proTES. The
commands below assume that everything is created in the context of this
namespace. How the namespace is created depends on the cluster, so we won't
document it here.

You need to edit the `values.yaml` file to specify your `applicationDomain` and the `clusterType`

After this you can deploy proTES using `helm`:

```bash
helm install protes . -f values.yaml
```

### Updates

If you want to edit any of the Deployments, you can update them with
`helm` and the `values.yaml` file. Once edited, you can run this command:

```bash
helm upgrade protes . -f values.yaml
```

## Technical details

### MongoDB

The MongoDB database is deployed using:

- `templates/mongodb/mongodb-deployment.yaml`

### RabbitMQ

The message broker RabbitMQ that allows the app to communicate with the worker
is deployed using:

- `templates/rabbitmq/rabbitmq-deployment.yaml`

### proTES

proTES consists of five deployments: a Flask server and a Celery worker. These
are deployed using:

- `templates/protes/protes-deployment.yaml`
- `templates/protes/celery-deployment.yaml`

You can use `ReadWriteOnce` if you don't have `StorageClass`
that supports `RWX`. In that case, a `podAffinity` will be set to have the proTES pods
running on the same node.

## Destroy

Simply run:

```bash
helm uninstall protes
```

