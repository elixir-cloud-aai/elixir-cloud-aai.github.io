## Synopsis

Microservice implementing the [Global Alliance for Genomics and
Health (GA4GH)][ga4gh] [Data Repository Service][ga4gh-drs] (DRS)
API specification.

## Installation

You can find a Helm chart in the [GitHub repository](https://github.com/elixir-cloud-aai/trs-filer/tree/dev/deployment) of TRS-Filer

Follow these instructions

- Install [Helm][helm-install]
- Clone the [TRS-Filer repository](https://github.com/elixir-cloud-aai/trs-filer/)

    ```sh
    git clone https://github.com/elixir-cloud-aai/trs-filer.git
    ```

- Browse to `deployment` to find the `Chart.yaml` and the `values.yaml` files

## Usage

First you must create a namespace in Kubernetes in which to deploy TRS-Filer. The
commands below assume that everything is created in the context of this
namespace. How the namespace is created depends on the cluster, so we won't
document it here.

You need to edit the `values.yaml` file 

After this you can deploy TRS-Filer using `helm`:

```bash
helm install trs-filer . -f values.yaml
```

### Updates

If you want to edit any of the Deployments, you can update them with
`helm` and the `values.yaml` file. Once edited, you can run this command:

```bash
helm upgrade trs-filer . -f values.yaml
```

## Technical details

### MongoDB

The MongoDB database is deployed using:

- `templates/mongo-deploy.yaml`

### TRS-Filer

TRS-Filer is deployed using:

- `templates/trs-filer-deploy.yaml`

## Destroy

Simply run:

```bash
helm uninstall trs-filer
```

