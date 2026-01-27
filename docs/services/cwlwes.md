## Synopsis

Microservice implementing the [Global Alliance for Genomics and
Health][ga4gh] (GA4GH) [Workflow Execution Service][ga4gh-wes] (WES)
API specification for the execution of workflows written in the [Common
Workflow Language](https://www.commonwl.org/) (CWL).

cwl-WES is a core service of the [ELIXIR Cloud & AAI
project][elixir-cloud-aai-github].

## Description

cwl-WES (formerly: WES-ELIXIR) is a Flask/Gunicorn
application that makes use of [Connexion](https://github.com/ga4gh/workflow-execution-service-schemas) to implement the
[GA4GH WES OpenAPI specification][ga4gh-wes]. It enables clients/users
to execute [CWL](https://www.commonwl.org) workflows in the cloud via a [GA4GH Task Execution
Service][ga4gh-tes] (TES)-compatible execution backend (e.g.,
[TESK][tesk] or [Funnel][funnel]). Workflows can be sent for execution,
previous runs can be listed, and the status and run information of individual
runs can be queried. The service leverages [cwl-tes][res-cwl-tes] to
interpret [CWL](https://www.commonwl.org) workflows, break them down into individual tasks and
emit [GA4GH TES][ga4gh-tes]-compatible HTTP requests to a configured
[TES][ga4gh-tes] instance. Access to endpoints can be configured to require
JSON Web Token-based access tokens, such as those issued by
[ELIXIR AAI](https://elixir-europe.org/platforms/compute/aai). Run information is stored in a
MongoDB database.

Note that development is currently in beta stage.
Further test deployments can be found at the [ELIXIR Cloud & AAI's resource
listings](https://github.com/elixir-cloud-aai/elixir-cloud-aai/blob/dev/resources/resources.md).

cwl-WES is developed and maintained by the [ELIXIR Cloud & AAI
project][elixir-cloud], a multinational effort aimed at establishing and
implementing [FAIR][fair] research in the Life Sciences.

## Installation

You can find a Helm chart in the [GitHub repository](https://github.com/elixir-cloud-aai/cwl-wes/tree/dev/deployment) of CWL-WES

Follow these instructions

- Install [Helm][helm-install]
- Clone the [CWL-WES repository](https://github.com/elixir-cloud-aai/cwl-wes/)

    ```sh
    git clone https://github.com/elixir-cloud-aai/cwl-wes.git
    ```

- Browse to `deployment` to find the `Chart.yaml` and the `values.yaml` files

## Usage

First you must create a namespace in Kubernetes in which to deploy CWL-WES. The
commands below assume that everything is created in the context of this
namespace. How the namespace is created depends on the cluster, so we won't
document it here.

You need to edit the `values.yaml` file 

After this you can deploy CWL-WES using `helm`:

```bash
helm install CWL-WES . -f values.yaml
```

### Updates

If you want to edit any of the Deployments, you can update them with
`helm` and the `values.yaml` file. Once edited, you can run this command:

```bash
helm upgrade CWL-WES . -f values.yaml
```

## Technical details

### MongoDB

The MongoDB database is deployed using:

- `templates/mongodb-deployment.yaml`

### RabbitMQ

The message broker RabbitMQ that allows the app to communicate with the
worker is deployed using:

- `templates/rabbitmq/rabbitmq-deployment.yaml`

### CWL-WES

CWL-WES consists of a Flask server and a Celery worker.
There are deployed using:

- `templates/wes-deployment.yaml`
- `templates/celery-deployment.yaml`

## Destroy

Simply run:

```bash
helm uninstall cwl-wes
```

