## Synopsis

[Cloud Registry][cr-repo] is the ELIXIR On-Cloud implementation of the
[GA4GH Service Registry API][ga4gh-service-registry]. Operators of services
register them, become their owners and can share them with others; admins
verify them. Anyone can browse the registry.

This page describes the **ELIXIR On-Cloud deployment** at
<https://registry.elixir-on.cloud/>. It is an addendum to the Cloud Registry
documentation, which covers everything that is not specific to this
deployment:

- [Deployment][cr-deployment] (the Helm chart; in the repository:
  [`deployment/README.md`][cr-deployment-readme])
- Upgrading: [From 0.4.0][cr-upgrading-0.4.0-to-0.5.0] and [From versions
  before 0.4.0][cr-upgrading-0.4.0]
- [Configuration][cr-configuration], [Access control][cr-access-control]
  and [Operations][cr-operations]
- [Release notes of 0.5.0][cr-release-notes]
- The front end's [README][cr-ui-readme] (see [Front end](#front-end))

!!! info "Last checked against Cloud Registry v0.5.0"
    For a later release, read its release notes and upgrade steps first,
    then update the version in the links and commands of this page (the
    chart URL and the links to the documentation).

For anything this page doesn't answer, write to
[cloud-service@elixir-europe.org][elixir-on-cloud-email].

## Overview

| What | Value |
|---|---|
| Front end ([Cloud Registry UI][cr-ui-repo]) | <https://registry.elixir-on.cloud/> |
| API base URL | <https://elixir-on.cloud/ga4gh/registry/v1> |
| API documentation (Swagger UI) | <https://elixir-on.cloud/ga4gh/registry/v1/ui/> |
| Identity provider | [LS Login][ls-login], issuer `https://login.aai.lifescience-ri.eu/oidc/` |
| Admins | members of the LS Login group `ECP_CLN:ADMIN` (see [Admins](#admins)) |
| Helm chart | `cloud-registry-0.5.0.tgz` of the [v0.5.0 release][cr-release] (deploys the image `elixircloud/cloud-registry:0.5.0`) |
| Database | MongoDB 7.0, deployed by the chart |

The API's base path is `/ga4gh/registry/v1` (not
`/ga4gh/service-registry/v1`). The front end and the API are served on
different host names: the front end calls the API from the user's browser,
at the API URL configured in the front end's deployment.

## Replacing the deployment before 0.4.0 (one-time)

!!! danger "Redeploy with a fresh install and an empty database"
    Do not migrate the data of the deployment before 0.4.0. That version
    (Helm chart 2, FOCA 0.12) accepted tokens of **any** issuer and had no
    ownership checks: anyone with any OpenID Connect token could create,
    change or delete entries, so its data can't be trusted. Services stored
    before 0.4.0 would also have no owner, so only admins could manage them.

Follow [From versions before 0.4.0][cr-upgrading-0.4.0]; for this
deployment:

1. Export the registered services, as a reference for their operators (the
   list is public). Continue only if the number of services looks right:

    ```bash
    curl -fsS https://elixir-on.cloud/ga4gh/registry/v1/services \
      > services-before-0.4.0.json
    jq length services-before-0.4.0.json
    ```

2. Note how the old release serves TLS (a `tls` section and cert-manager
   annotations in its Ingress, or none if TLS is terminated in front of the
   cluster), to configure the new one the same way (see [Values
   file](#values-file)):

    ```bash
    kubectl get ingress -n <namespace> -o yaml
    ```

3. Find and uninstall the old release. Uninstalling deletes its MongoDB
   volume (the claim `mongodb`) and the data; check that the claim is gone,
   and delete it by hand if it isn't:

    ```bash
    helm ls -n <namespace>
    helm uninstall <release> -n <namespace>
    kubectl get pvc -n <namespace>
    ```

    If the volume's reclaim policy is `Retain`, deleting the claim keeps the
    PersistentVolume and its data: delete it too (`kubectl get pv` lists it
    as `Released`; `kubectl delete pv <name>`), and its storage, if the
    storage isn't deleted with it.

4. Install v0.5.0 (see [Installation](#installation)). Then ask the
   operators of the exported services to register them again (e.g., in the
   front end), so that they become their owners; admins verify them (see
   [Verified services][cr-verified-services]).

## Upgrading from 0.4.0

Data is kept. Follow [From 0.4.0][cr-upgrading-0.4.0-to-0.5.0] and the
chart's notes [To app version 0.5.0][cr-chart-0.5.0]; for this deployment:

1. Before upgrading, check the environments of the stored services. The
   list of services is public, so no access to the database is needed:

    ```bash
    curl -fsS https://elixir-on.cloud/ga4gh/registry/v1/services \
      | jq '[.[].environment] | unique'
    ```

    Registrations may only use the allowed environments now, by default
    `prod`, `test`, `dev` and `staging` (`null` means services without
    one). To keep other values, allow them in
    `config.custom.endpoints.services.environments` in the same upgrade (see
    [Service environments](#service-environments)); otherwise, those
    services are still served, but can only be updated with an allowed
    value.
2. The values file below doesn't give
   `config.security.access_control.policies`, so it needs no new policy
   rules. If yours gives them as a list, add the rules `add-service-types`
   and `list-approvals`.
3. Tell the operators of clients that the registry sets the timestamps of
   services now (see [Timestamps][cr-timestamps]).
4. Set up rate limits at the ingress, if there are none yet (see [Service
   types](#service-types)).
5. Upgrade with the chart of v0.5.0 (see [Upgrades](#upgrades)), then
   restart the app once, so that it stores the types of the services that
   pods of 0.4.0 registered during the rollout (the app also creates its new
   indexes and marks pending services on startup; nothing to do for them):

    ```bash
    kubectl rollout restart deployment/cloud-registry -n <namespace>
    kubectl rollout status deploy/cloud-registry -n <namespace>
    ```

6. Deploy the front end (see [Front end](#front-end)), and go through the
   [checks](#checks-after-installing).

Switch the service types to the mode `moderated` (see [Service
types](#service-types)) only after the restart, in a later upgrade.

## Version

Install the chart attached to the release, by its versioned URL, and set
neither `cloudRegistry.tag` nor a tag in `cloudRegistry.image`: the chart
then deploys the image of its release (see [Image][cr-image] and
[Installation][cr-installation]). Don't deploy the moving image tags `latest`
or `dev`, nor the chart from the repository's `deployment` folder (which
deploys `dev`): a restart of a pod could then start another version than the
one the config was written for. Optionally, [verify the image and the
chart][cr-verifying] before installing. The development docs explain this
for all deployments now (see [Image][cr-latest-image]).

### MongoDB and the nodes' kernels

The chart pins MongoDB 7.0 (`mongodb.image: docker.io/library/mongo:7.0`);
keep it. MongoDB 8.0 refuses to start on Linux kernels 6.19 to 7.0.13
([SERVER-121912][mongodb-server-121912]), so before moving to MongoDB 8.x,
check the kernels of all nodes that MongoDB may run on:

```bash
kubectl get nodes -o custom-columns=NODE:.metadata.name,KERNEL:.status.nodeInfo.kernelVersion
```

This covers only the current nodes: nodes added later (e.g., by an
autoscaler) need compatible kernels too (see [Version][cr-latest-version] in
the development docs). MongoDB upgrades go one major version at a time, and
binaries can't be downgraded (see [Version][cr-mongodb-version]).

## Configuration

### Identity provider

The deployment trusts **LS Login** only. Its endpoints and supported scopes
and claims are listed in its [discovery document][ls-login-discovery].

| Setting | Value | Why |
|---|---|---|
| `config.security.auth.issuers` | `["https://login.aai.lifescience-ri.eu/oidc/"]` | the `iss` claim of LS Login tokens (with the trailing slash) |
| `config.security.auth.audience` | the client IDs of the front ends (see [Audience](#audience)) | LS Login sets `aud` to the client that the user logged in with |
| `config.security.auth.userinfo_claims` | `["eduperson_entitlement", "name"]` | LS Login releases groups and names via its user info endpoint, not in access tokens |
| `config.security.access_control.claim_groups` | `eduperson_entitlement` | the claim with the user's group memberships |
| `config.security.access_control.group_mapping` | the admin group mapped to `admin` (see [Admins](#admins)) | required: the app refuses to start without admins |

LS Login releases `eduperson_entitlement` only if the client requested the
scope of the same name when the user logged in. **Front ends must request the
scopes `openid profile eduperson_entitlement`** (`profile` for `name`), and
their client registration in LS Login must allow them; otherwise, admins act
as ordinary users and roles of groups don't apply. LS Login access tokens are
JWTs as per RFC 9068 (`typ: at+jwt`), as the registry requires.

### Audience

The registry accepts tokens only for the client IDs in
`config.security.auth.audience`. Set it to the LS Login client IDs of
**all** apps that send tokens to the registry: the production front end, plus
any other front end (e.g., a preview deployment) or client for scripts that
should be able to register services. Without the front end's client ID,
logging in works, but every create, update and delete fails with
`401 Unauthorized`.

Client IDs are not listed here. To obtain them:

- ask the maintainers of the front end's deployment (the client ID it is
  configured with), or the administrators of the client in [LS
  Login][ls-login];
- or decode the payload of an access token issued to that client and read
  its `aud` claim. Handle tokens like passwords: decode them locally, and
  never paste them into websites, tickets or chats.

### Admins

Members of this LS Login group are admins of the registry: they can do
everything, including registering services with chosen identifiers and
verifying services (see [Admins][cr-admins]):

```text
urn:geant:lifescience-ri.eu:group:elixir:ECP_CLN:ADMIN#aai.lifescience-ri.eu
```

It is a value of the user's `eduperson_entitlement` claim. To see the groups
that LS Login releases for a user, call its user info endpoint with an
access token of that user, e.g., one issued to the front end. Read the token
into a variable, so that it stays out of the shell history, and pass the
header via standard input, so that it stays out of process listings:

```bash
read -rs TOKEN
printf 'Authorization: Bearer %s\n' "$TOKEN" | curl -fsS -H @- \
  https://login.aai.lifescience-ri.eu/oidc/userinfo
```

The response lists the groups in `eduperson_entitlement` (if the token's
scopes allow it). Group changes reach the registry within 5 minutes, as it
caches the user info per token (see [Group membership
changes][cr-group-membership-changes]).

### Service environments

The deployment keeps the default environments (`prod`, `test`, `dev` and
`staging`, as suggested by the GA4GH specification): registrations with
other values are rejected (see [Service
environments][cr-service-environments]). If the values file changes them,
build the front end with the same values (see [Building the
image](#building-the-image)).

### Service types

Service types are stored, and `config.custom.access_control.service_types`
sets who may add them (see [Service types][cr-service-types-config]):
`open` (the default, any logged-in user), `controlled` (admins only) or
`moderated` (any logged-in user, but types of users other than admins, and
the services that have them, are pending until an admin approves them). The
values file below keeps the default; to moderate new types, set:

```yaml title="values-prod.yaml"
config:
  custom:
    access_control:
      service_types: moderated
```

Admins approve pending types and services in the front end. Without the
admin group (see [Admins](#admins)), nobody could approve them.

Users other than admins may add at most 10 types that no service has
(`config.custom.access_control.max_unused_service_types`, default `10`; see
[Service types][cr-service-types-config]). The limit is per user, and anyone
can create an LS Login account, so also limit the request rate at the
ingress, at least for `POST /services/types` and `POST /services` (see
[Rate limits][cr-rate-limits]; the controller must see the clients'
addresses, not those of a proxy in front of the cluster).

### Values file

Keep the values file in the infrastructure repository of the deployment, not
in the Cloud Registry repository. Secrets never go into it, as `config` ends
up in a ConfigMap; the MongoDB credentials are referenced by the name of a
Secret. The service info keeps the identifier
`ELIXIR_CLOUD_SERVICE_REGISTRY_1`, so that clients still recognize the
registry, and sets all fields that describe the deployment (see [Service
info][cr-service-info]).

```yaml title="values-prod.yaml"
# Public host name of the API (not of the front end)
hostName: elixir-on.cloud

# No `cloudRegistry.tag`: the chart deploys the image of its release
cloudRegistry:
  # The release's tag doesn't move, so pulling on every start isn't needed
  imagePullPolicy: IfNotPresent
  ingress:
    https:
      # As noted for the old release (step 2 of the one-time replacement):
      # true to serve HTTPS with a certificate from cert-manager, false if
      # TLS is terminated in front of the cluster
      enabled: true

config:
  security:
    auth:
      issuers: ["https://login.aai.lifescience-ri.eu/oidc/"]
      # REQUIRED: replace with the LS Login client IDs of the front end(s)
      # (the chart accepts any non-empty value; see "Audience")
      audience: ["<client ID of the front end>"]
      userinfo_claims: ["eduperson_entitlement", "name"]
    access_control:
      claim_groups: eduperson_entitlement
      group_mapping:
        # Quoted, as it contains `#`
        "urn:geant:lifescience-ri.eu:group:elixir:ECP_CLN:ADMIN#aai.lifescience-ri.eu": admin
  service_info:
    service:
      id: ELIXIR_CLOUD_SERVICE_REGISTRY_1
      name: ELIXIR On-Cloud Service Registry
      description: Registry of GA4GH and other web services of ELIXIR On-Cloud.
      organization:
        name: ELIXIR On-Cloud
        url: https://elixir-on.cloud/
      contactUrl: mailto:cloud-service@elixir-europe.org
      environment: prod

mongodb:
  auth:
    # Created before installing (see "Installation")
    existingSecret: cloud-registry-mongodb-credentials
```

### Exposing the API

The chart routes all paths of `hostName` to the app, including FOCA's
permissions API for admins (`/admin/access-control/`; see
[Ingress][cr-ingress] and [TLS][cr-tls]). If `elixir-on.cloud` serves other
apps too, or to keep the permissions API off the internet, disable the
chart's Ingress and Route (`cloudRegistry.ingress.enabled: false`,
`cloudRegistry.route.enabled: false`) and route only `/ga4gh/registry/v1/`
to the app's Service (port `http`) with an Ingress or HTTPRoute of your own,
or block `/admin/` at the proxy in front of the cluster.

If the API moves to another host name, change `hostName` and the API URL in
the front end's deployment together, keeping the base path
`/ga4gh/registry/v1`.

### Network policies

MongoDB's NetworkPolicy is enabled by default: only the app's pods of the
release may connect. The app's NetworkPolicy
(`cloudRegistry.networkPolicy.enabled`) is optional: when enabling it, list
the pods of the cluster's ingress controller (or Gateway proxies) in
`cloudRegistry.networkPolicy.ingressFrom`, or the API becomes unreachable.
The front end needs no entry, as browsers call the API through the ingress.
Find the controller's namespace and pod labels with:

```bash
kubectl get ingressclass
kubectl get pods -A --show-labels | grep -Ei 'ingress|gateway|traefik'
```

Then set them as the peer, e.g.:

```yaml title="values-prod.yaml"
cloudRegistry:
  networkPolicy:
    enabled: true
    ingressFrom:
    - namespaceSelector:
        matchLabels:
          kubernetes.io/metadata.name: <namespace of the ingress controller>
      podSelector:
        matchLabels:
          app.kubernetes.io/name: <name label of its pods>
```

See [Network policies][cr-network-policies] and FOCA's [NetworkPolicy
peers][foca-networkpolicy-peers] for the peers of common ingress
controllers and Gateways. The policies only take effect if the cluster's
network plugin enforces them.

## Installation

1. Create the namespace, unless it exists:

    ```bash
    kubectl create namespace <namespace>
    ```

2. Create the Secret with the MongoDB credentials, with random passwords
   that are never written down. The Secret's keys are those of
   [Authentication][cr-authentication]; unlike the command there, this one
   (for Bash or Zsh) passes the passwords via a file descriptor rather than
   as arguments, so that they don't show up in process listings:

    ```bash
    kubectl create secret generic cloud-registry-mongodb-credentials -n <namespace> \
      --from-env-file=<(printf 'root-username=root\nroot-password=%s\nusername=cloud-registry\npassword=%s\n' \
        "$(openssl rand -hex 24)" "$(openssl rand -hex 24)")
    ```

    To check an existing Secret, list its keys without printing the values:

    ```bash
    kubectl get secrets -n <namespace>
    kubectl describe secret cloud-registry-mongodb-credentials -n <namespace>
    ```

3. Install the chart of the release, and wait for the app:

    ```bash
    helm install cloud-registry \
      https://github.com/elixir-cloud-aai/cloud-registry/releases/download/v0.5.0/cloud-registry-0.5.0.tgz \
      -n <namespace> -f values-prod.yaml
    kubectl rollout status deploy/cloud-registry -n <namespace>
    ```

    Rendering fails if the issuer, the audience or the admin group is
    missing.

4. Deploy the front end (see [Front end](#front-end)).

### Front end

The front end ([Cloud Registry UI][cr-ui-repo]) is a web app, served at
<https://registry.elixir-on.cloud/>. Anyone can browse the services in it;
logged-in users register services, edit and delete their own, and share
them with others (access management). Admins also verify services, and
approve new service types and the services that are pending until their
type is approved (see the [UI's README][cr-ui-readme]).

#### UI version

UI versions follow the registry in major and minor version: UI 0.5.x works
with Cloud Registry 0.5.x. Until the UI's first release, its
[`ai` branch][cr-ui-ai] goes with Cloud Registry 0.5.0; it doesn't work
with 0.4.0. Note the commit you build from, so that you can build the same
image again.

#### Registering the front end with LS Login

Register the front end with [LS Login][ls-login] as a service (an OpenID
Connect client):

- **Flow:** authorization code, with a client secret.
- **Redirect URI:** `https://registry.elixir-on.cloud/auth/api/callback`.
  Use a separate client for local development, with
  `http://localhost:3000/auth/api/callback`.
- **Scopes:** `openid`, `profile`, `email` and `eduperson_entitlement` (see
  [Identity provider](#identity-provider)).

Add the client ID to the registry's audience (see [Audience](#audience)).
Keep the client secret in a secret store, never in a repository or in the
image.

#### Building the image

The front end reads the settings `NEXT_PUBLIC_*` when it is built, from the
file `.env` in the repository, and they are fixed in the image (see
[Configurations][cr-ui-configurations]). For this deployment, set at least
the API URL:

```bash
git clone https://github.com/elixir-cloud-aai/cloud-registry-ui.git
cd cloud-registry-ui
git checkout ai
COMMIT=$(git rev-parse HEAD)
echo "$COMMIT"
printf 'NEXT_PUBLIC_CLOUD_REGISTRY_URL=%s\n' \
  https://elixir-on.cloud/ga4gh/registry/v1 > .env
docker build -t "cloud-registry-ui:$COMMIT" .
```

The defaults of the other settings `NEXT_PUBLIC_*` match the registry's
defaults (e.g., the environments `prod`, `test`, `dev` and `staging`); if
the values file changes the allowed environments or URL schemes, set them
too (see [Registry][cr-ui-registry-settings]). Push the image to a registry
that the cluster can pull from.

!!! warning "No secrets in `.env`"
    `docker build` copies `.env` into the image. Put only the settings
    `NEXT_PUBLIC_*` in it, never the login settings with the client secret.

#### Login settings

The login settings are read when the app starts: `LOGIN_PROVIDERS` (a JSON
list with LS Login, including the client ID and secret) and
`LOGIN_REDIRECT_URI` (`https://registry.elixir-on.cloud/auth/api/callback`).
The [LS Login example][cr-ui-login] in the UI's README shows the format,
with the scopes above. Pass them as environment variables when the
container starts, e.g., from a Kubernetes Secret (`envFrom` with a
`secretRef`); without them, the app refuses to start.

#### Running the front end

The UI has no Helm chart. Run the image as a Deployment with a Service on
port 3000, and route `registry.elixir-on.cloud` to it with HTTPS: the login
cookies are marked `Secure`, so logging in fails over plain HTTP. The
front end calls the API from the user's browser; the registry accepts
requests from any origin by default, so there is nothing to configure for
it.

After deploying, open the front end, log in with LS Login and check that
the services are listed; then go on with the [checks](#checks-after-installing)
below, which include logging in as an admin.

## Checks after installing

1. The service info shows version `0.5.0` and the deployment's fields:

    ```bash
    curl -fsS https://elixir-on.cloud/ga4gh/registry/v1/service-info
    ```

2. Reads are public; writes without a token are rejected with `401`:

    ```bash
    curl -fsS https://elixir-on.cloud/ga4gh/registry/v1/services
    curl -s -o /dev/null -w '%{http_code}\n' -X POST \
      https://elixir-on.cloud/ga4gh/registry/v1/services
    ```

3. The app logs the admin group on startup; the line must name the
   `ECP_CLN:ADMIN` group above. It also warns of stored services whose
   environment is not allowed; there should be no such warning:

    ```bash
    kubectl logs deploy/cloud-registry -n <namespace> | grep "mapped to the role 'admin'"
    kubectl logs deploy/cloud-registry -n <namespace> | grep "environments not allowed"
    ```

4. The stored service types include those of the registered services:

    ```bash
    curl -fsS https://elixir-on.cloud/ga4gh/registry/v1/services/types
    ```

5. An admin logs in to the front end and calls `GET /me` (see [Current
   user][cr-current-user]) with their access token; the response must
   contain `"admin": true`. If it says `false`, the token lacks the group
   (check the scopes and the user info, see [Admins](#admins)); if the
   request fails with `401`, the front end's client ID is missing in the
   audience.

    ```bash
    read -rs TOKEN
    printf 'Authorization: Bearer %s\n' "$TOKEN" | curl -fsS -H @- \
      https://elixir-on.cloud/ga4gh/registry/v1/me
    ```

6. Register a test service in the front end, then delete it.

## Upgrades

Read the release notes and upgrade steps of the new release, change the
values file if needed, and upgrade with the chart of that release (see
[Upgrades][cr-upgrades]):

```bash
helm upgrade cloud-registry \
  https://github.com/elixir-cloud-aai/cloud-registry/releases/download/vX.Y.Z/cloud-registry-X.Y.Z.tgz \
  -n <namespace> -f values-prod.yaml
```

Don't roll back to an image older than 0.4.0 (e.g., that of the previous
deployment) once admins have verified services: older versions serve the
internal field `_verifiedAt` in GA4GH responses and drop verifications when
services are updated. If a rollback can't be avoided, ask the maintainers
first ([cloud-service@elixir-europe.org][elixir-on-cloud-email]).

## Uninstalling

```bash
helm uninstall cloud-registry -n <namespace>
```

The chart keeps MongoDB's volume (the claim `cloud-registry-mongodb`) and
the data when the release is uninstalled, and a new release of the same name
uses it again; delete the claim by hand to remove the data (see
[Persistence][cr-persistence]), and the PersistentVolume, if its reclaim
policy is `Retain`.

[cr-repo]: <https://github.com/elixir-cloud-aai/cloud-registry>
[cr-release]: <https://github.com/elixir-cloud-aai/cloud-registry/releases/tag/v0.5.0>
[cr-ui-repo]: <https://github.com/elixir-cloud-aai/cloud-registry-ui>
[cr-ui-ai]: <https://github.com/elixir-cloud-aai/cloud-registry-ui/tree/ai>
[cr-ui-readme]: <https://github.com/elixir-cloud-aai/cloud-registry-ui/blob/ai/README.md>
[cr-ui-configurations]: <https://github.com/elixir-cloud-aai/cloud-registry-ui/blob/ai/README.md#configurations>
[cr-ui-registry-settings]: <https://github.com/elixir-cloud-aai/cloud-registry-ui/blob/ai/README.md#registry>
[cr-ui-login]: <https://github.com/elixir-cloud-aai/cloud-registry-ui/blob/ai/README.md#login>
[cr-deployment-readme]: <https://github.com/elixir-cloud-aai/cloud-registry/blob/v0.5.0/deployment/README.md>
[cr-deployment]: <https://cloud-registry.readthedocs.io/en/v0.5.0/deployment/>
[cr-image]: <https://cloud-registry.readthedocs.io/en/v0.5.0/deployment/#image>
[cr-installation]: <https://cloud-registry.readthedocs.io/en/v0.5.0/deployment/#installation>
[cr-ingress]: <https://cloud-registry.readthedocs.io/en/v0.5.0/deployment/#ingress>
[cr-rate-limits]: <https://cloud-registry.readthedocs.io/en/v0.5.0/deployment/#rate-limits>
[cr-tls]: <https://cloud-registry.readthedocs.io/en/v0.5.0/deployment/#tls>
[cr-network-policies]: <https://cloud-registry.readthedocs.io/en/v0.5.0/deployment/#network-policies>
[cr-upgrades]: <https://cloud-registry.readthedocs.io/en/v0.5.0/deployment/#upgrades>
[cr-mongodb-version]: <https://cloud-registry.readthedocs.io/en/v0.5.0/deployment/#version>
[cr-authentication]: <https://cloud-registry.readthedocs.io/en/v0.5.0/deployment/#authentication>
[cr-persistence]: <https://cloud-registry.readthedocs.io/en/v0.5.0/deployment/#persistence>
[cr-latest-image]: <https://cloud-registry.readthedocs.io/en/latest/deployment/#image>
[cr-latest-version]: <https://cloud-registry.readthedocs.io/en/latest/deployment/#version>
[cr-upgrading-0.4.0]: <https://cloud-registry.readthedocs.io/en/v0.5.0/upgrading/#from-versions-before-040>
[cr-configuration]: <https://cloud-registry.readthedocs.io/en/v0.5.0/configuration/>
[cr-service-info]: <https://cloud-registry.readthedocs.io/en/v0.5.0/configuration/#service-info>
[cr-access-control]: <https://cloud-registry.readthedocs.io/en/v0.5.0/access-control/>
[cr-admins]: <https://cloud-registry.readthedocs.io/en/v0.5.0/access-control/#admins>
[cr-group-membership-changes]: <https://cloud-registry.readthedocs.io/en/v0.5.0/access-control/#group-membership-changes>
[cr-current-user]: <https://cloud-registry.readthedocs.io/en/v0.5.0/access-control/#current-user>
[cr-operations]: <https://cloud-registry.readthedocs.io/en/v0.5.0/operations/>
[cr-verifying]: <https://cloud-registry.readthedocs.io/en/v0.5.0/operations/#verifying-images-and-charts>
[cr-verified-services]: <https://cloud-registry.readthedocs.io/en/v0.5.0/api/#verified-services>
[cr-release-notes]: <https://cloud-registry.readthedocs.io/en/v0.5.0/releases/0.5.0/>
[cr-upgrading-0.4.0-to-0.5.0]: <https://cloud-registry.readthedocs.io/en/v0.5.0/upgrading/#from-040>
[cr-chart-0.5.0]: <https://cloud-registry.readthedocs.io/en/v0.5.0/deployment/#to-app-version-050>
[cr-timestamps]: <https://cloud-registry.readthedocs.io/en/v0.5.0/api/#timestamps>
[cr-service-environments]: <https://cloud-registry.readthedocs.io/en/v0.5.0/configuration/#service-environments>
[cr-service-types-config]: <https://cloud-registry.readthedocs.io/en/v0.5.0/configuration/#service-types>
[foca-networkpolicy-peers]: <https://github.com/elixir-cloud-aai/foca/blob/chart-v0.2.0/docs/helm-chart.md#networkpolicy-peers>
[ls-login]: <https://www.lifescience-ri.eu/life-science-login/>
[ls-login-discovery]: <https://login.aai.lifescience-ri.eu/oidc/.well-known/openid-configuration>
[mongodb-server-121912]: <https://jira.mongodb.org/browse/SERVER-121912>
