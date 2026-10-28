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
- Upgrading: [From 0.5.0][cr-upgrading-0.5.0], [From
  0.4.0][cr-upgrading-0.4.0-to-0.5.0] and [From versions before
  0.4.0][cr-upgrading-0.4.0]
- [Configuration][cr-configuration], [Access control][cr-access-control]
  and [Operations][cr-operations]
- [Release notes of 0.6.0][cr-release-notes]
- The front end's [README][cr-ui-readme] (see [Front end](#front-end))

!!! info "Last checked against Cloud Registry v0.6.0"
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
| Admins | members of the LS Login group `ECP_CLN:ADMIN`, in admin mode (see [Admins](#admins)) |
| Helm chart | `cloud-registry-0.6.0.tgz` of the [v0.6.0 release][cr-release] (deploys the image `elixircloud/cloud-registry:0.6.0`) |
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

4. Install v0.6.0 (see [Installation](#installation)). Then ask the
   operators of the exported services to register them again (e.g., in the
   front end), so that they become their owners; admins verify them (see
   [Verified services][cr-verified-services]).

## Upgrading from 0.5.0

Data is kept. Follow [From 0.5.0][cr-upgrading-0.5.0] and the chart's notes
[To app version 0.6.0][cr-chart-0.6.0]. Upgrade the registry first, then
the front end (see [Front end](#front-end)); for this deployment:

1. **Removed settings:** the values file below sets neither
   `config.custom.endpoints.service` nor
   `config.custom.access_control.require_admin`, so nothing changes for
   them: `hostName` still sets the public URL (`https://elixir-on.cloud/`).
   If yours sets them, rendering fails: remove the first (set `publicUrl`
   only for a URL other than `https://<hostName>/`), and move the second to
   `config.security.access_control.require_admin`. The chart of v0.6.0
   deploys only images of 0.6.0 or later, so remove any `cloudRegistry.tag`
   left from an earlier install (see [Version](#version)).
2. **Admin mode:** admins now act as admins only in requests with the header
   `X-Request-Roles: admin` (see [Admin mode](#admin-mode)). The front end
   from the branch `ai-post-deploy` sends it when admins switch to admin
   mode; the front end from the branch `ai` doesn't. Keep the opt-in (the
   values file below sets nothing for it) only if you deploy the front end
   from `ai-post-deploy` right after the registry; until then, admins can't
   act as admins in the old front end. To keep the front end from `ai` for
   a while, set `config.security.access_control.opt_in_roles: []` in the
   same upgrade, and remove it once the new front end is deployed. Tell the
   maintainers of scripts that need admin rights to send the header.
3. **Admin grants via the permissions API:** admins of this deployment come
   from the LS Login group only (see [Admins](#admins)). Rules granting the
   role `admin` that were stored via the permissions API still grant admin
   rights, without admin mode, and FOCA warns of them on startup: revoke
   them, and add the users to the admin group instead (see [From
   0.5.0][cr-upgrading-0.5.0]). During the rollout, pods of 0.5.0 still
   grant admin rights without the header; if admin mode must hold from the
   start, scale the app to 0 replicas before upgrading.
4. **Owners' roles of groups:** the policy rule `owners-change-permissions`
   now also covers the roles of groups. The values file below doesn't
   change the owners' rules, so nothing changes for it. If yours removes or
   changes `owners-change-group-permissions`, change
   `owners-change-permissions` too, or owners can grant and revoke roles of
   groups again (see [Requiring login for reads][cr-login-for-reads]); the
   app warns on startup of rules that still allow it.
5. Upgrade with the chart of v0.6.0 (see [Upgrades](#upgrades)), and wait
   for the app:

    ```bash
    kubectl rollout status deploy/cloud-registry -n <namespace>
    ```

6. Build and deploy the front end from `ai-post-deploy` (see [Front
   end](#front-end)). Its settings are now passed when the container starts,
   not when the image is built: deployments that pass them with
   `docker build --build-arg` must move them to the container's environment
   (see [Building the image](#building-the-image)). Then go through the
   [checks](#checks-after-installing).

## Upgrading from 0.4.0

Upgrade one release at a time, never directly from 0.4.0 to 0.6.0: first
to 0.5.0, following the registry's guide [From
0.4.0][cr-upgrading-0.4.0-to-0.5.0] and the chart's notes [To app version
0.5.0][cr-chart-0.5.0], then to 0.6.0, following [From
0.5.0][cr-upgrading-0.5.0] (see [Upgrading from
0.5.0](#upgrading-from-050)). Data is kept. For the first step, for this
deployment:

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
    value. Users can still register and edit services until the upgrade,
    so run the check again right before upgrading.
2. The values file below gives neither
   `config.security.access_control.policies` nor its own `x-bearerInfoFunc`
   (`config.api.specs.registry.add_security_fields`), so nothing changes for
   them. If yours gives the policies as a list, add the rules
   `add-service-types` and `list-approvals`; if it sets `x-bearerInfoFunc`,
   drop it (see [From 0.4.0][cr-upgrading-0.4.0-to-0.5.0]).
3. Tell the operators of clients that the registry sets the timestamps of
   services now (see [Timestamps][cr-timestamps]).
4. Set up rate limits at the ingress, if there are none yet (see [Service
   types](#service-types)).
5. Upgrade with the chart of v0.5.0 (see [Upgrades](#upgrades), with
   `v0.5.0` and `0.5.0` in the chart URL; leave out
   `config.security.access_control.opt_in_roles`, which 0.5.0 doesn't
   know), then restart the app once, so that it stores the types of the
   services that pods of 0.4.0 registered during the rollout (the app also
   creates its new indexes and marks pending services on startup; nothing
   to do for them):

    ```bash
    kubectl rollout restart deployment/cloud-registry -n <namespace>
    kubectl rollout status deploy/cloud-registry -n <namespace>
    ```

6. Then upgrade to 0.6.0 as in [Upgrading from
   0.5.0](#upgrading-from-050), which also covers the front end.

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

The public reads (`GET /services`, `GET /services/types` and the
verifications) accept an optional token: with one, they apply that user's
visibility rules, e.g., show the user's pending types and services. Invalid
or expired tokens are rejected with `401`, so that the front end logs the
user in again; if LS Login can't be reached, such reads are served as
anonymous (see [Authentication][cr-ac-authentication]).

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

Members of this LS Login group are admins of the registry: in [admin
mode](#admin-mode), they can do everything, including registering services
with chosen identifiers, changing the identifiers of services and verifying
services (see [Admins][cr-admins]). Only groups make users admins: rules
can't grant the role `admin` (see [Making users admins][cr-making-admins]).

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

### Admin mode

Admins act as admins only in **admin mode**: in requests with the header
`X-Request-Roles: admin`; their other requests have the rights of other
users (see [Admin mode][cr-admin-mode]). In the front end, admins switch
between "User mode" and "Admin mode" in the top bar, and start in user
mode (see [Registry][cr-ui-registry-settings] in the UI's README). Scripts
send the header with each request that needs admin rights.

The deployment keeps the opt-in of the base config
(`config.security.access_control.opt_in_roles: [admin]`), which needs a
front end with the switch, i.e., from the branch `ai-post-deploy` (see [UI
version](#ui-version)). Only while a front end without it is deployed
(e.g., from the branch `ai`), set `opt_in_roles: []`, or its admins can't
act as admins:

```yaml title="values-prod.yaml"
config:
  security:
    access_control:
      # Only with a front end without the admin mode switch; remove once
      # the front end from `ai-post-deploy` is deployed
      opt_in_roles: []
```

### Service environments

The deployment keeps the default environments (`prod`, `test`, `dev` and
`staging`, as suggested by the GA4GH specification): registrations with
other values are rejected (see [Service
environments][cr-service-environments]). If the values file changes them,
set the same values in the front end's settings (see
[Settings](#settings)).

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
(`config.custom.access_control.max_unused_service_types`, default `10`;
`null` for no limit, `0` to let only admins add types other than those of
services; see [Service types][cr-service-types-config]). Further types are
rejected with `409 Conflict`; admins remove unwanted types that no service
has (`DELETE /ga4gh/registry/v1/services/types`). The limit is per user, and anyone
can create an LS Login account, so also limit the request rate at the
ingress, at least for `POST /ga4gh/registry/v1/services/types` and
`POST /ga4gh/registry/v1/services` (see
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
permissions API for admins in admin mode (`/admin/access-control/`; see
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
      https://github.com/elixir-cloud-aai/cloud-registry/releases/download/v0.6.0/cloud-registry-0.6.0.tgz \
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
them with others (access management). Admins, in admin mode, also verify
services, change their identifiers, and approve new service types and the
services that are pending until their type is approved (see the [UI's
README][cr-ui-readme]).

#### UI version

UI versions follow the registry in major and minor version (see the [UI's
README][cr-ui-readme]). Until the UI's first release, there is no image to
deploy: build it from the [`ai-post-deploy`
branch][cr-ui-ai-post-deploy], which goes with Cloud Registry 0.6.0 (its
admin mode switch needs 0.6.0; see [Admin mode](#admin-mode)). Deploy the
registry first, then the front end. The branch `ai`, which went with 0.5.0,
has no switch: with it, admins can act as admins in the front end only if
the registry sets `opt_in_roles: []`. Note the commit you build from, so
that you can build the same image again.

#### Registering the front end with LS Login

Register the front end with [LS Login][ls-login] as a service (an OpenID
Connect client):

- **Flow:** authorization code, with a client secret and PKCE (`S256`,
  which LS Login supports); the front end also sends a nonce and checks the
  ID token's issuer, audience and nonce.
- **Redirect URI:** `https://registry.elixir-on.cloud/auth/api/callback`.
  Use a separate client for local development, with
  `http://localhost:3000/auth/api/callback`.
- **Scopes:** `openid`, `profile`, `email` and `eduperson_entitlement` (see
  [Identity provider](#identity-provider)).

Add the client ID to the registry's audience (see [Audience](#audience)).
Keep the client secret in a secret store, never in a repository or in the
image. Configure only this one login provider (see [Login][cr-ui-login]).

#### Building the image

The image has no settings of its own: they are all read when the container
starts, not when the image is built (see [Docker][cr-ui-docker] and
[Configurations][cr-ui-configurations]). Build it without build arguments:

```bash
git clone https://github.com/elixir-cloud-aai/cloud-registry-ui.git
cd cloud-registry-ui
git checkout ai-post-deploy
COMMIT=$(git rev-parse HEAD)
echo "$COMMIT"
docker build -t "cloud-registry-ui:$COMMIT" .
```

Push the image to a registry that the cluster can pull from. `.dockerignore`
lets only the sources and build files into the build (an allow list), so
`.env*` files and other local secrets can't reach the image.

!!! warning "Move build arguments to the container's environment"
    Images built from the branch `ai` held the settings `NEXT_PUBLIC_*`
    that were passed with `docker build --build-arg`. Now `docker build`
    only prints a warning for them, and the image holds no settings: pass
    them when the container starts (see [Settings](#settings)), or it
    refuses to start. One image can then serve several environments (e.g.,
    staging and production).

Images built this way are production builds: they don't offer "Copy token
to Dashboard", which only development servers have (see [Copying the access
token][cr-ui-copy-token]). Don't deploy development builds.

#### Settings

Pass the settings as environment variables when the container starts; for
this deployment:

| Setting | Value |
|---|---|
| `NEXT_PUBLIC_CLOUD_REGISTRY_URL` (required) | `https://elixir-on.cloud/ga4gh/registry/v1` |
| `LOGIN_PROVIDERS` (required) | a JSON list with LS Login, including the client ID and secret (see below) |
| `LOGIN_REDIRECT_URI` (required) | `https://registry.elixir-on.cloud/auth/api/callback` |

The [LS Login example][cr-ui-login] in the UI's README shows the format of
`LOGIN_PROVIDERS`, with the scopes above; keep its `scopes`, or the
registry doesn't recognize admins:

```text
LOGIN_PROVIDERS=[{"id": "ls-login", "name": "LS Login", "logo": "/ls-login-grey-wide.jpg", "issuer": "https://login.aai.lifescience-ri.eu/oidc/", "clientId": "<client ID>", "clientSecret": "<client secret>", "scopes": ["openid", "profile", "email", "eduperson_entitlement"]}]
LOGIN_REDIRECT_URI=https://registry.elixir-on.cloud/auth/api/callback
```

The settings `NEXT_PUBLIC_*` reach the browser, so they are public; the
login settings stay on the server. Keep the login settings in a Kubernetes
Secret and pass them with `envFrom` and a `secretRef`; set the settings
`NEXT_PUBLIC_*` in the Deployment's `env` (or a ConfigMap). With Docker, pass
them with `docker run --env-file`, from a file outside any repository
(`NAME=value` per line, values not quoted).

The defaults of the other settings `NEXT_PUBLIC_*` match the registry's
defaults (e.g., the environments `prod`, `test`, `dev` and `staging`); if
the values file changes the allowed environments or URL schemes, set them
too (see [Registry][cr-ui-registry-settings]). The branding settings are
optional, and their defaults are the ELIXIR On-Cloud logos and the title
"Cloud Registry". Logos given as paths must be the default logos in the
image's `public/` folder; give other logos as URLs (see
[Branding][cr-ui-branding]).

Missing or invalid settings stop the container, with a message that names
the setting (see the container's log, e.g., `kubectl logs`). Change
settings by restarting the container, without building the image again.

#### Running the front end

The UI has no Helm chart. Run the image as a Deployment with a Service on
port 3000 (`PORT`; the app listens on all IPv4 interfaces, set
`LISTEN_HOSTNAME`, e.g. to `::`, for IPv6), and route
`registry.elixir-on.cloud` to it with HTTPS: the login cookies are marked
`Secure`, so logging in fails over plain HTTP. Serve it at the address of
`LOGIN_REDIRECT_URI`: logging out is a `POST` that the app accepts only from
that origin (see [Sessions and logout][cr-ui-sessions]). The front end calls
the API from the user's browser, in admin mode with the header
`X-Request-Roles`; the registry accepts requests from any origin and with
any headers by default, so there is nothing to configure for it.

- **Health:** the image's health check (it requests the start page every 30
  seconds) only applies to Docker; Kubernetes ignores it. Give the
  Deployment HTTP probes on `/` and port 3000 instead (the start page
  answers with a redirect; probes count `2xx` and `3xx` as success).
- **Security context:** the app runs as the unprivileged user `bun` and
  writes only to `/app/.next/cache`; with a read-only root file system,
  mount an `emptyDir` there.
- **Security headers:** the app sets its own Content Security Policy, with a
  nonce per request. Don't let the ingress or a proxy add a second one:
  browsers enforce both, and one without the nonce blocks the app's
  scripts (see [Registry][cr-ui-registry-settings]).

Users stay logged in as long as their LS Login access token is valid, at
most 12 hours; the front end doesn't refresh tokens. Logins that were
started before an update of the front end to the version with PKCE fail
once, and users log in again.

After deploying, open the front end, log in with LS Login and check that
the services are listed; then go on with the [checks](#checks-after-installing)
below, which include logging in as an admin.

## Checks after installing

1. The service info shows version `0.6.0` and the deployment's fields:

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
   user][cr-current-user]) with their access token, in admin mode (header
   `X-Request-Roles: admin`); the response must contain `"admin": true`.
   Without the header, it contains `"admin_available": true` and
   `"admin": false`. If `admin_available` is `false`, the token lacks the
   group (check the scopes and the user info, see [Admins](#admins)); if
   the request fails with `401`, the front end's client ID is missing in
   the audience.

    ```bash
    read -rs TOKEN
    printf 'Authorization: Bearer %s\nX-Request-Roles: admin\n' "$TOKEN" \
      | curl -fsS -H @- https://elixir-on.cloud/ga4gh/registry/v1/me
    ```

   In the front end, the admin sees the switch "User mode" / "Admin mode"
   in the top bar (see [Admin mode](#admin-mode)).

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
[cr-release]: <https://github.com/elixir-cloud-aai/cloud-registry/releases/tag/v0.6.0>
[cr-release-notes]: <https://cloud-registry.readthedocs.io/en/v0.6.0/releases/0.6.0/>
[cr-ui-repo]: <https://github.com/elixir-cloud-aai/cloud-registry-ui>
[cr-ui-ai-post-deploy]: <https://github.com/elixir-cloud-aai/cloud-registry-ui/tree/ai-post-deploy>
[cr-ui-readme]: <https://github.com/elixir-cloud-aai/cloud-registry-ui/blob/ai-post-deploy/README.md>
[cr-ui-docker]: <https://github.com/elixir-cloud-aai/cloud-registry-ui/blob/ai-post-deploy/README.md#docker>
[cr-ui-configurations]: <https://github.com/elixir-cloud-aai/cloud-registry-ui/blob/ai-post-deploy/README.md#configurations>
[cr-ui-registry-settings]: <https://github.com/elixir-cloud-aai/cloud-registry-ui/blob/ai-post-deploy/README.md#registry>
[cr-ui-branding]: <https://github.com/elixir-cloud-aai/cloud-registry-ui/blob/ai-post-deploy/README.md#branding>
[cr-ui-login]: <https://github.com/elixir-cloud-aai/cloud-registry-ui/blob/ai-post-deploy/README.md#login>
[cr-ui-sessions]: <https://github.com/elixir-cloud-aai/cloud-registry-ui/blob/ai-post-deploy/README.md#sessions-and-logout>
[cr-ui-copy-token]: <https://github.com/elixir-cloud-aai/cloud-registry-ui/blob/ai-post-deploy/README.md#copying-the-access-token>
[cr-deployment-readme]: <https://github.com/elixir-cloud-aai/cloud-registry/blob/v0.6.0/deployment/README.md>
[cr-deployment]: <https://cloud-registry.readthedocs.io/en/v0.6.0/deployment/>
[cr-image]: <https://cloud-registry.readthedocs.io/en/v0.6.0/deployment/#image>
[cr-installation]: <https://cloud-registry.readthedocs.io/en/v0.6.0/deployment/#installation>
[cr-ingress]: <https://cloud-registry.readthedocs.io/en/v0.6.0/deployment/#ingress>
[cr-rate-limits]: <https://cloud-registry.readthedocs.io/en/v0.6.0/deployment/#rate-limits>
[cr-tls]: <https://cloud-registry.readthedocs.io/en/v0.6.0/deployment/#tls>
[cr-network-policies]: <https://cloud-registry.readthedocs.io/en/v0.6.0/deployment/#network-policies>
[cr-upgrades]: <https://cloud-registry.readthedocs.io/en/v0.6.0/deployment/#upgrades>
[cr-mongodb-version]: <https://cloud-registry.readthedocs.io/en/v0.6.0/deployment/#version>
[cr-authentication]: <https://cloud-registry.readthedocs.io/en/v0.6.0/deployment/#authentication>
[cr-persistence]: <https://cloud-registry.readthedocs.io/en/v0.6.0/deployment/#persistence>
[cr-latest-image]: <https://cloud-registry.readthedocs.io/en/latest/deployment/#image>
[cr-latest-version]: <https://cloud-registry.readthedocs.io/en/latest/deployment/#version>
[cr-upgrading-0.4.0]: <https://cloud-registry.readthedocs.io/en/v0.6.0/upgrading/#from-versions-before-040>
[cr-configuration]: <https://cloud-registry.readthedocs.io/en/v0.6.0/configuration/>
[cr-service-info]: <https://cloud-registry.readthedocs.io/en/v0.6.0/configuration/#service-info>
[cr-access-control]: <https://cloud-registry.readthedocs.io/en/v0.6.0/access-control/>
[cr-ac-authentication]: <https://cloud-registry.readthedocs.io/en/v0.6.0/access-control/#authentication>
[cr-admins]: <https://cloud-registry.readthedocs.io/en/v0.6.0/access-control/#admins>
[cr-group-membership-changes]: <https://cloud-registry.readthedocs.io/en/v0.6.0/access-control/#group-membership-changes>
[cr-current-user]: <https://cloud-registry.readthedocs.io/en/v0.6.0/access-control/#current-user>
[cr-operations]: <https://cloud-registry.readthedocs.io/en/v0.6.0/operations/>
[cr-verifying]: <https://cloud-registry.readthedocs.io/en/v0.6.0/operations/#verifying-images-and-charts>
[cr-verified-services]: <https://cloud-registry.readthedocs.io/en/v0.6.0/api/#verified-services>
[cr-upgrading-0.4.0-to-0.5.0]: <https://cloud-registry.readthedocs.io/en/v0.6.0/upgrading/#from-040>
[cr-chart-0.5.0]: <https://cloud-registry.readthedocs.io/en/v0.6.0/deployment/#to-app-version-050>
[cr-chart-0.6.0]: <https://cloud-registry.readthedocs.io/en/v0.6.0/deployment/#to-app-version-060>
[cr-upgrading-0.5.0]: <https://cloud-registry.readthedocs.io/en/v0.6.0/upgrading/#from-050>
[cr-admin-mode]: <https://cloud-registry.readthedocs.io/en/v0.6.0/access-control/#admin-mode>
[cr-login-for-reads]: <https://cloud-registry.readthedocs.io/en/v0.6.0/access-control/#requiring-login-for-reads>
[cr-making-admins]: <https://cloud-registry.readthedocs.io/en/v0.6.0/operations/#making-users-admins>
[cr-timestamps]: <https://cloud-registry.readthedocs.io/en/v0.6.0/api/#timestamps>
[cr-service-environments]: <https://cloud-registry.readthedocs.io/en/v0.6.0/configuration/#service-environments>
[cr-service-types-config]: <https://cloud-registry.readthedocs.io/en/v0.6.0/configuration/#service-types>
[foca-networkpolicy-peers]: <https://github.com/elixir-cloud-aai/foca/blob/chart-v0.2.0/docs/helm-chart.md#networkpolicy-peers>
[ls-login]: <https://www.lifescience-ri.eu/life-science-login/>
[ls-login-discovery]: <https://login.aai.lifescience-ri.eu/oidc/.well-known/openid-configuration>
[mongodb-server-121912]: <https://jira.mongodb.org/browse/SERVER-121912>
