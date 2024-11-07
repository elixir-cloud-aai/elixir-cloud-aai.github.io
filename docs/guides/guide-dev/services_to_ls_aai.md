# Using LS-Login in JupyterHub

* For deploying JupyterHub in de.NBI Cloud using Kubernetes see this [tutorial](https://cloud.denbi.de/wiki/Tutorials/JupyterHub/).
* JupyterHub can be configured to use Life Science Login. Therefore, you need to have a service registered at LS-Login ([HowTo](https://docs.google.com/document/d/17pNXM_psYOP5rWF302ObAJACsfYnEWhjvxAHzcjvfIE/edit?tab=t.0#heading=h.suudoy1bqtvm)).
* In the SPREG tool ([link](https://services.aai.lifescience-ri.eu/spreg)) you have to register the Redirect URIs accordingly to your domain at the SAML/OIDC setting page (`https://{yourdomain}/hub/oauth_callback` - be aware to change `{yourdomain}` accordingly). LS-LOGIN does exact matching of the URL, so adding `/hub/oauth_callback` is required and the domain alone is not sufficient.
* In the SAML/OIDC setting page, you will also find values for Client ID and Client Secret
* To use LS-Login in Jupyterhub, you have to modify the config.yaml file (see also [here](https://z2jh.jupyter.org/en/stable/administrator/authentication.html)):

```
hub:
  config:
    Authenticator:
      allow_all: true
      admin_users:
        - ADMIN # here you can specify an user as admin
    GenericOAuthenticator:
      client_id: # add client id from SPREG
      client_secret: # add client id from SPREG
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

Hedgedoc is configured using environment variables. This guide assumes that a Hedgedoc is already deployed, in our case we used this chart:

https://github.com/CSCfi/helm-charts/tree/main/charts/hedgedoc

Once Hedgedoc is deployed, in order to add LS-AAI login one just needs to add these variables:

- name: CMD_OAUTH2_USER_PROFILE_URL
  value: https://login.aai.lifescience-ri.eu/oidc/userinfo
- name: CMD_OAUTH2_USER_PROFILE_USERNAME_ATTR
  value: preferred_username
- name: CMD_OAUTH2_USER_PROFILE_DISPLAY_NAME_ATTR
  value: name
- name: CMD_OAUTH2_USER_PROFILE_EMAIL_ATTR
  value: email
- name: CMD_OAUTH2_TOKEN_URL
  value: https://login.aai.lifescience-ri.eu/oidc/token
- name: CMD_OAUTH2_AUTHORIZATION_URL
  value: https://login.aai.lifescience-ri.eu/oidc/authorize
- name: CMD_OAUTH2_CLIENT_ID
  value: _REPLACE BY CLIENT ID_
- name: CMD_OAUTH2_CLIENT_SECRET
  value: REPLACE BY CLIENT SECRET_
- name: CMD_OAUTH2_PROVIDERNAME
  value: ELIXIR Cloud & AAI
- name: CMD_OAUTH2_SCOPE
  value: openid email profile
  
The documentation from Hedgedoc about this is at:

https://docs.hedgedoc.org/configuration/#oauth2-login