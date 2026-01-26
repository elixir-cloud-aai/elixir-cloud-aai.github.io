## Synopsis

GA4GH Service Registry API implementation for the ELIXIR Cloud.

Service entries comply with the [external service schema](https://github.com/ga4gh-discovery/ga4gh-service-registry/blob/8c45be52940db92c2fa1cd821519c271c22b1c4c/service-registry.yaml#L158) defined in the [GA4GH Service Registry API][ga4gh-service-registry]

Developers can find the API documentation [here](https://cloud-registry.readthedocs.io/en/latest/)

## Installation

You can find a Helm chart in the [GitHub repository](https://github.com/elixir-cloud-aai/cloud-registry/tree/dev/deployment) of Cloud-registry

Follow these instructions

- Install [Helm][helm-install]
- Clone the [Cloud-registry repository](https://github.com/elixir-cloud-aai/cloud-registry/)

    ```sh
    git clone https://github.com/elixir-cloud-aai/cloud-registry.git
    ```

- Browse to `deployment` to find the `Chart.yaml` and the `values.yaml` files

## Usage

First you must create a namespace in Kubernetes in which to deploy Cloud-registry. The
commands below assume that everything is created in the context of this
namespace. How the namespace is created depends on the cluster, so we won't
document it here.

You need to edit the `values.yaml` file 

After this you can deploy Cloud-registry using `helm`:

```bash
helm install cloud-registry . -f values.yaml
```

### Updates

If you want to edit any of the Deployments, you can update them with
`helm` and the `values.yaml` file. Once edited, you can run this command:

```bash
helm upgrade cloud-registry . -f values.yaml
```

## Technical details

### MongoDB

The MongoDB database is deployed using:

- `templates/mongo-deploy.yaml`

### Cloud-registry

TRS-Filer is deployed using:

- `templates/cloud-registry-deploy.yaml`

## Destroy

Simply run:

```bash
helm uninstall cloud-registry
```

