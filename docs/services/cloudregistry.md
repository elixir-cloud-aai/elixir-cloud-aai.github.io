## Synopsis

[Cloud Registry](https://github.com/elixir-cloud-aai/cloud-registry) is the
ELIXIR On-Cloud implementation of the [GA4GH Service Registry
API][ga4gh-service-registry]. Operators of services register them, become
their owners and can share them with others; admins verify them. Anyone can
browse the registry.

This page describes the **ELIXIR On-Cloud deployment** at
<https://registry.elixir-on.cloud/>. It is an addendum to the Cloud Registry
documentation, which covers everything that is not specific to this
deployment:

- [Deployment](https://cloud-registry.readthedocs.io/en/v0.4.0/deployment/)
  (the Helm chart; also in the repository as
  [`deployment/README.md`](https://github.com/elixir-cloud-aai/cloud-registry/blob/v0.4.0/deployment/README.md))
- [Upgrading: From versions before
  0.4.0](https://cloud-registry.readthedocs.io/en/v0.4.0/upgrading/#from-versions-before-040)
- [Configuration](https://cloud-registry.readthedocs.io/en/v0.4.0/configuration/),
  [Access control](https://cloud-registry.readthedocs.io/en/v0.4.0/access-control/)
  and [Operations](https://cloud-registry.readthedocs.io/en/v0.4.0/operations/)
- [Release notes of
  0.4.0](https://cloud-registry.readthedocs.io/en/v0.4.0/releases/0.4.0/)

The notes are written for Cloud Registry **v0.4.0**. For later releases,
read their release notes and upgrade steps first, and replace `0.4.0` in the
commands below.

!!! note "Questions"
    For anything this page doesn't answer, write to
    [cloud-service@elixir-europe.org][elixir-on-cloud-email].

## Overview

| What | Value |
|---|---|
| Front end ([Cloud Registry UI](https://github.com/elixir-cloud-aai/cloud-registry-ui)) | <https://registry.elixir-on.cloud/> |
| API base URL | <https://elixir-on.cloud/ga4gh/registry/v1> |
| API documentation (Swagger UI) | <https://elixir-on.cloud/ga4gh/registry/v1/ui/> |
| Service info | <https://elixir-on.cloud/ga4gh/registry/v1/service-info> |
| Identity provider | [LS Login](https://www.lifescience-ri.eu/life-science-login/), issuer `https://login.aai.lifescience-ri.eu/oidc/` |
| Admins | members of the LS Login group `ECP_CLN:ADMIN` (see [Admins](#admins)) |
| Helm chart | `cloud-registry-0.4.0.tgz`, attached to the [v0.4.0 release](https://github.com/elixir-cloud-aai/cloud-registry/releases/tag/v0.4.0) |
| App image | `elixircloud/cloud-registry:0.4.0` (set by the chart) |
| Database | MongoDB 7.0, deployed by the chart (`mongo:7.0`) |

The API's base path is `/ga4gh/registry/v1` (not
`/ga4gh/service-registry/v1`). The front end and the API are served on
different host names: the front end calls the API from the user's browser,
at the URL configured in the front end's deployment.

## Before you start

### Start with an empty database

!!! danger "Redeploy with a fresh install and an empty database"
    Do not migrate the data of the deployment before 0.4.0. That version
    (Helm chart 2, FOCA 0.12) accepted tokens of **any** issuer and had no
    ownership checks: anyone with any OpenID Connect token could create,
    change or delete entries, so its data can't be trusted. Services stored
    before 0.4.0 would also have no owner, so only admins could manage them.

Follow [From versions before
0.4.0](https://cloud-registry.readthedocs.io/en/v0.4.0/upgrading/#from-versions-before-040).
For this deployment:

1. Export the registered services, as a reference for their operators (the
   list is public):

    ```bash
    curl -s https://elixir-on.cloud/ga4gh/registry/v1/services \
      > services-before-0.4.0.json
    ```

2. Find and uninstall the old release, then check that its MongoDB volume is
   gone (the legacy charts named the claim `mongodb`); delete a remaining
   claim by hand:

    ```bash
    helm ls -n <namespace>
    helm uninstall <release> -n <namespace>
    kubectl get pvc -n <namespace>
    ```

3. Install v0.4.0 as described [below](#installation). Then ask the operators
   of the exported services to register them again (`POST /services`, e.g.,
   in the front end), so that they become their owners; admins verify them
   (see [Verified
   services](https://cloud-registry.readthedocs.io/en/v0.4.0/api/#verified-services)).

### Pin the version

Install the chart attached to the release, by its versioned URL (see
[Installation](https://cloud-registry.readthedocs.io/en/v0.4.0/deployment/#installation)).
It deploys the image of its release (`0.4.0`), as long as the values file
sets neither `cloudRegistry.tag` nor a tag in `cloudRegistry.image`.

- **Don't deploy the image tags `latest` or `dev`.** They move:
  `latest` is the highest stable release, `dev` the latest commit. As the
  chart pulls the image on every pod start (`imagePullPolicy: Always`), a
  restart could start another version than the one the config was written
  for, which may refuse to start.
- **Don't deploy the chart from the repository's `deployment` folder.** It
  deploys the `dev` image unless `cloudRegistry.tag` is set.
- Optionally, [verify the image and the
  chart](https://cloud-registry.readthedocs.io/en/v0.4.0/operations/#verifying-images-and-charts)
  before installing.

### Check the kernel version of the nodes

The chart pins MongoDB 7.0 (`mongodb.image: docker.io/library/mongo:7.0`),
which is not affected by the following issue; keep it. MongoDB 8.0 refuses to start on
Linux kernels 6.19 to 7.0.13
([SERVER-121912](https://jira.mongodb.org/browse/SERVER-121912)), so before
moving to MongoDB 8.x, check the kernels of all nodes that MongoDB may run
on:

```bash
kubectl get nodes -o custom-columns=NODE:.metadata.name,KERNEL:.status.nodeInfo.kernelVersion
```

MongoDB upgrades go one major version at a time, and binaries can't be
downgraded (see
[Version](https://cloud-registry.readthedocs.io/en/v0.4.0/deployment/#version)).

## Configuration

### Identity provider

The deployment trusts **LS Login** only. Its settings come from its OpenID
Connect discovery document
(<https://login.aai.lifescience-ri.eu/oidc/.well-known/openid-configuration>):

| Setting | Value | Why |
|---|---|---|
| `config.security.auth.issuers` | `["https://login.aai.lifescience-ri.eu/oidc/"]` | the `iss` claim of LS Login tokens (with the trailing slash) |
| `config.security.auth.audience` | the client IDs of the front ends (see [Audience](#audience)) | LS Login sets `aud` to the client that the user logged in with |
| `config.security.auth.userinfo_claims` | `["eduperson_entitlement", "name"]` | LS Login releases groups and names via its user info endpoint, not in access tokens |
| `config.security.access_control.claim_groups` | `eduperson_entitlement` | the claim with the user's group memberships |
| `config.security.access_control.group_mapping` | the admin group mapped to `admin` (see [Admins](#admins)) | required, as the app refuses to start without admins |

LS Login releases `eduperson_entitlement` only if the client requested the
scope of the same name when the user logged in. **Front ends must request the
scopes `openid profile eduperson_entitlement`** (`profile` for `name`), and
their client registration in LS Login must allow them; otherwise, admins act
as ordinary users and roles of groups don't apply. LS Login access tokens are
RFC 9068 JWTs (`typ: at+jwt`), as the registry requires.

### Audience

The registry accepts tokens only for the client IDs in
`config.security.auth.audience`. Set it to the LS Login client IDs of
**all** apps that send tokens to the registry: the production front end, plus
any other front end (e.g., a preview deployment) or client for scripts that
should be able to register services. Without the front end's client ID, all
logins work, but every create, update and delete fails with
`401 Unauthorized`.

Client IDs are not listed here. To obtain them:

- ask the maintainers of the front end's deployment (the client ID it is
  configured with), or the administrators of the client in LS Login (see
  [LS Login](https://www.lifescience-ri.eu/life-science-login/));
- or decode the payload of an access token issued to that client and read
  its `aud` claim. Handle tokens like passwords: decode them locally, and
  never paste them into websites, tickets or chats.

### Admins

Members of this LS Login group are admins of the registry (they can do
everything, including registering services with chosen identifiers and
verifying services; see
[Admins](https://cloud-registry.readthedocs.io/en/v0.4.0/access-control/#admins)):

```text
urn:geant:lifescience-ri.eu:group:elixir:ECP_CLN:ADMIN#aai.lifescience-ri.eu
```

It is a value of the user's `eduperson_entitlement` claim. To see the groups
that LS Login releases for a user, call its user info endpoint with an access
token of that user, e.g., one issued to the front end:

```bash
curl -s -H "Authorization: Bearer <access token>" \
  https://login.aai.lifescience-ri.eu/oidc/userinfo
```

The response lists the groups in `eduperson_entitlement` (if the token's
scopes allow it). Group changes reach the registry within 5 minutes, as it
caches the user info per token (see [Group membership
changes](https://cloud-registry.readthedocs.io/en/v0.4.0/access-control/#group-membership-changes)).

### Service info

Keep the service's identifier `ELIXIR_CLOUD_SERVICE_REGISTRY_1`, so that
clients still recognize the registry, and set all fields that describe the
deployment, as the defaults are placeholders (see [Service
info](https://cloud-registry.readthedocs.io/en/v0.4.0/configuration/#service-info)).

### Values file

Keep the values file in the infrastructure repository of the deployment, not
in the Cloud Registry repository. Secrets never go into it, as `config` ends
up in a ConfigMap; the MongoDB credentials are referenced by the name of a
Secret.

```yaml title="values-prod.yaml"
# Public host name of the API (not of the front end)
hostName: elixir-on.cloud

# No `cloudRegistry.tag`: the chart deploys the image of its release
cloudRegistry:
  # The release's tag doesn't move, so pulling on every start isn't needed
  imagePullPolicy: IfNotPresent

config:
  security:
    auth:
      issuers: ["https://login.aai.lifescience-ri.eu/oidc/"]
      # LS Login client IDs of the front end(s) and other clients
      audience: ["<client ID of the front end>"]
      userinfo_claims: ["eduperson_entitlement", "name"]
    access_control:
      claim_groups: eduperson_entitlement
      group_mapping:
        "urn:geant:lifescience-ri.eu:group:elixir:ECP_CLN:ADMIN#aai.lifescience-ri.eu": admin
  service_info:
    service:
      id: ELIXIR_CLOUD_SERVICE_REGISTRY_1
      name: ELIXIR On-Cloud Service Registry
      description: Registry of GA4GH and other web services of ELIXIR On-Cloud.
      organization:
        name: ELIXIR On-Cloud
        url: https://elixir-cloud.dcc.sib.swiss/
      contactUrl: mailto:cloud-service@elixir-europe.org
      environment: prod

mongodb:
  auth:
    # Created before installing, see below
    existingSecret: cloud-registry-mongodb-credentials
```

Quote the group in `group_mapping`, as it contains `:` and `#`.

### Exposing the API

The chart routes all paths of `hostName` to the app (see
[Ingress](https://cloud-registry.readthedocs.io/en/v0.4.0/deployment/#ingress)),
including FOCA's permissions API for admins (`/admin/access-control/`). As
the host name `elixir-on.cloud` may serve other apps too, consider disabling
the chart's Ingress (`cloudRegistry.ingress.enabled: false`) and routing only
`/ga4gh/registry/v1/` to the app's Service (port `http`) with an Ingress or
HTTPRoute of your own; this also keeps the permissions API off the internet.
TLS is terminated by the cluster's ingress (`cloudRegistry.ingress.https`)
or in front of the cluster (see
[TLS](https://cloud-registry.readthedocs.io/en/v0.4.0/deployment/#tls)).

If the API moves to another host name, change `hostName` and the API URL in
the front end's deployment together, keeping the base path
`/ga4gh/registry/v1`.

### Network policies

MongoDB's NetworkPolicy is enabled by default: only the app's pods of the
release may connect. The app's NetworkPolicy is optional; when enabling it,
list the pods of the cluster's ingress controller (or Gateway proxies) as
peers, otherwise the API becomes unreachable. The front end needs no entry,
as browsers call the API through the ingress. Find the controller's
namespace and labels with:

```bash
kubectl get ingressclass
kubectl get pods -A --show-labels | grep -Ei 'ingress|gateway|traefik'
```

For example, for ingress-nginx in the namespace `ingress-nginx`:

```yaml title="values-prod.yaml"
cloudRegistry:
  networkPolicy:
    enabled: true
    ingressFrom:
    - namespaceSelector:
        matchLabels:
          kubernetes.io/metadata.name: ingress-nginx
      podSelector:
        matchLabels:
          app.kubernetes.io/name: ingress-nginx
```

See [Network
policies](https://cloud-registry.readthedocs.io/en/v0.4.0/deployment/#network-policies)
and FOCA's [NetworkPolicy
peers](https://github.com/elixir-cloud-aai/foca/blob/chart-v0.2.0/docs/helm-chart.md#networkpolicy-peers)
for other controllers. The policies only take effect if the cluster's network
plugin enforces them.

## Installation

1. Create the Secret with the MongoDB credentials (random passwords, never
   written down; see
   [Authentication](https://cloud-registry.readthedocs.io/en/v0.4.0/deployment/#authentication)):

    ```bash
    kubectl create secret generic cloud-registry-mongodb-credentials -n <namespace> \
      --from-literal=root-username=root \
      --from-literal=root-password="$(openssl rand -hex 24)" \
      --from-literal=username=cloud-registry \
      --from-literal=password="$(openssl rand -hex 24)"
    ```

    To check an existing Secret, list its keys without printing the values:

    ```bash
    kubectl get secrets -n <namespace>
    kubectl describe secret cloud-registry-mongodb-credentials -n <namespace>
    ```

2. Install the chart of the release:

    ```bash
    helm install cloud-registry \
      https://github.com/elixir-cloud-aai/cloud-registry/releases/download/v0.4.0/cloud-registry-0.4.0.tgz \
      -n <namespace> -f values-prod.yaml
    kubectl rollout status deploy/cloud-registry -n <namespace>
    ```

    Rendering fails if the issuer, audience or admin group is missing.

## Checks after installing

1. The service info shows the new version and the deployment's fields:

    ```bash
    curl -s https://elixir-on.cloud/ga4gh/registry/v1/service-info
    ```

2. Reads are public; writes without a token are rejected with `401`:

    ```bash
    curl -s https://elixir-on.cloud/ga4gh/registry/v1/services
    curl -s -o /dev/null -w '%{http_code}\n' -X POST \
      https://elixir-on.cloud/ga4gh/registry/v1/services
    ```

3. On startup, the app logs the groups mapped to `admin`:

    ```bash
    kubectl logs deploy/cloud-registry -n <namespace> | grep -i admin
    ```

4. An admin logs in to the front end and calls `GET /me` with their access
   token; the response must contain `"admin": true`. If it says `false`, the
   token lacks the group (check the scopes and the user info, see
   [Admins](#admins)); if the request fails with `401`, the front end's
   client ID is missing in the audience.

    ```bash
    curl -s -H "Authorization: Bearer <access token>" \
      https://elixir-on.cloud/ga4gh/registry/v1/me
    ```

5. Register a test service in the front end, then delete it.

## Upgrades

Read the release notes and upgrade steps of the new release, change the
values file if needed, and upgrade with the chart of that release (see
[Upgrades](https://cloud-registry.readthedocs.io/en/v0.4.0/deployment/#upgrades)):

```bash
helm upgrade cloud-registry \
  https://github.com/elixir-cloud-aai/cloud-registry/releases/download/vX.Y.Z/cloud-registry-X.Y.Z.tgz \
  -n <namespace> -f values-prod.yaml
```

Don't roll back to an image older than 0.4.0 (e.g., the image of the
previous deployment) once admins have verified services: older versions
serve the internal field `_verifiedAt` in GA4GH responses and drop
verifications when services are updated. If a rollback can't be avoided,
first remove the field from all documents of the `services` collection
(`$unset`).
