# Using LS-Login in JupyterHub

* For deploying JupyterHub in de.NBI Cloud using Kubernetes see this [tutorial](https://cloud.denbi.de/wiki/Tutorials/JupyterHub/).
* JupyterHub can be configured to use Life Science Login. Therefore, you need to have a service registered at LS-Login ([HowTo](https://docs.google.com/document/d/17pNXM_psYOP5rWF302ObAJACsfYnEWhjvxAHzcjvfIE/edit?tab=t.0#heading=h.suudoy1bqtvm)).
* In the SPREG tool ([link](https://services.aai.lifescience-ri.eu/spreg)) you have to register the Redirect URIs accordingly to your domain at the SAML/OIDC setting page (`https://{yourdomain}/hub/oauth_callback` - be aware to change `{yourdomain}` accordingly). LS-LOGIN does exact matching of the URL, so adding `/hub/oauth_callback` is required and the domain alone is not sufficient.
* In the SAML/OIDC setting page, you will also find values for Client ID and Client Secret
* To use LS-Login in Jupyterhub, you have to modify the config.yaml file (see also [here](https://z2jh.jupyter.org/en/stable/administrator/authentication.html)):

```yaml
hub:
  config:
    Authenticator:
      allow_all: true
      admin_users:
        - ADMIN # here you can specify an user as admin
    GenericOAuthenticator:
      client_id: # add client id from SPREG
      client_secret: # add client secret from SPREG
      login_service : LS LOGIN
      oauth_callback_url: https://{yourdomain}/hub/oauth_callback # change to you domain accordingly
      authorize_url: https://login.aai.lifescience-ri.eu/oidc/authorize
      token_url: https://login.aai.lifescience-ri.eu/oidc/token
      userdata_url: https://login.aai.lifescience-ri.eu/oidc/userinfo
      username_claim: preferred_username # used in newer versions
      username_key: preferred_username # this variable is deprecated in newer versions
      scope: 
        - openid
        - email
        - profile
    JupyterHub:
      authenticator_class: generic-oauth
cull:
  enabled: false
```

# Add LS_Login to Hedgedoc

Before configuring Hedgedoc, you need to register your service with LS-Login. Follow the registration process at https://lifescience-ri.eu/ls-login/documentation/how-to-integrate/registration.html

Hedgedoc is configured using environment variables. This guide assumes that a Hedgedoc is already deployed, in our case we used this chart:

https://github.com/CSCfi/helm-charts/tree/main/charts/hedgedoc

Once Hedgedoc is deployed, in order to add LS-AAI login one just needs to add these variables:

- name: CMD_OAUTH2_USER_PROFILE_URL
  - value: https://login.aai.lifescience-ri.eu/oidc/userinfo
- name: CMD_OAUTH2_USER_PROFILE_USERNAME_ATTR
  - value: preferred_username
- name: CMD_OAUTH2_USER_PROFILE_DISPLAY_NAME_ATTR
  - value: name
- name: CMD_OAUTH2_USER_PROFILE_EMAIL_ATTR
  - value: email
- name: CMD_OAUTH2_TOKEN_URL
  - value: https://login.aai.lifescience-ri.eu/oidc/token
- name: CMD_OAUTH2_AUTHORIZATION_URL
  - value: https://login.aai.lifescience-ri.eu/oidc/authorize
- name: CMD_OAUTH2_CLIENT_ID
  - value: _REPLACE BY CLIENT ID_
- name: CMD_OAUTH2_CLIENT_SECRET
  - value: _REPLACE BY CLIENT SECRET_
- name: CMD_OAUTH2_PROVIDERNAME
  - value: ELIXIR Cloud & AAI
- name: CMD_OAUTH2_SCOPE
  - value: openid email profile
  
The documentation from Hedgedoc about this is at:

https://docs.hedgedoc.org/configuration/#oauth2-login

# Using LS-Login in MinIO

LS-Login can be activated in MinIO either by using the MinIO console using the OIDC configuration or by setting environmental variables ([MinIO OIDC Documentation](https://min.io/docs/minio/linux/operations/external-iam/configure-openid-external-identity-management.html)).

- Config URL (MINIO_IDENTITY_OPENID_CONFIG_URL)
  - https://login.aai.lifescience-ri.eu/oidc/.well-known/openid-configuration
- Client ID (MINIO_IDENTITY_OPENID_CLIENT_ID)
  - ID of the LS-Login service
- Client secret (MINIO_IDENTITY_OPENID_CLIENT_SECRET)
  - Secret of the LS-Login service
- Display Name (MINIO_IDENTITY_OPENID_DISPLAY_NAME)
  - A human readable label for the login button (e.g. `LS-Login`)
- Scopes (MINIO_IDENTITY_OPENID_SCOPES)
  - Scopes that will be requested from LS-Login (e.g. `openid,email,profile`)
- Role policy (MINIO_IDENTITY_OPENID_ROLE_POLICY)
  - Name of a policy in MinIO that will be used to manage access of LS-Login users (e.g. `readonly`).
- Claim User Info (MINIO_IDENTITY_OPENID_CLAIM_USERINFO)
  - Allow MinIO to request the userinfo endpoint for additional information (`on`).

MinIO supports two different mechanisms for authorization of users with OIDC ([MinIO OIDC authorization](https://min.io/docs/minio/linux/administration/identity-access-management/oidc-access-management.html#minio-external-identity-management-openid)). It is recommended to use the RolePolicy flow. Here, all LS-Login users in MinIO will be assigned to one or more policies. These policies can control access to specific buckets by group membership; e.g. require that users belong to a specific LS-AAI group (see [policy based access control](https://min.io/docs/minio/linux/administration/identity-access-management/policy-based-access-control.html#tag-based-policy-conditions)).

In the example below, access to a bucket (`sensitive/`) is restricted to a list of users which are identified by their `preferred_username` claims. 

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::sensitive",
                "arn:aws:s3:::sensitive/*"
            ],
            "Condition": {
                "StringEquals": {
                    "jwt:preferred_username": [
                        "ELIXIR_USERNAME"
                    ]
                }
            }
        }
    ]
}
```