# User Stories

With the elixir cloud activities, we support the development of cloud services to provide access to data and compute for researchers. Thereby we have various user stories in mind, which are listed below to guide researchers as well as service/data provider.

## Access to services

**As a researcher, I can access a cloud service, which provides access to research data, so that I can perform data analysis on the research data.** LS Login allows researchers to authenticate using their home institute credentials. Service providers must register the service with LS Login and, if necessary, authorize researchers or groups of researchers to use the service. Technically, the user navigates through the service's GUI to a login page. The service redirects the user to the LS Login page, where the user logs in with the personal credentials of their respective identity provider. LS Login checks whether the user has access rights to the service through group memberships or specific user roles/affiliations. If successful, the user gets redirected back to the service and the service receives the user information from LS Login.

**As a service provider, I can register my service, so that external researchers can authenticate and access the service and work with research data.** For using LS Login, a service provider needs to register their service as a Relying Party (RP) at LS Login. There are instructions on how to connect a service available ([How to connect a service to the LifeScience AAI](https://docs.google.com/document/d/17pNXM_psYOP5rWF302ObAJACsfYnEWhjvxAHzcjvfIE/edit?tab=t.0#heading=h.suudoy1bqtvm)). Once registered, service providers need to configure their service for using LS Login as a feature for authentication. See the following tutorials for configuring specific service:
* [Using LS-Login in JupyterHub](https://elixir-hedgedoc.rahtiapp.fi/2O8p9sIhTVmvbd3YEUYrdg?both)
* [Using LS-Login in Hedgedoc](https://elixir-hedgedoc.rahtiapp.fi/2O8p9sIhTVmvbd3YEUYrdg?both)

**As a service provider, I define the modalities for access to my service, so that access to my service is controlled to a set of specific users.** These modalities can include membership to a user group or a specific user role/affiliation. LS-AAI manages all user group assignments and access modalities for services based on group memberships. There is tutorial provided by LS-Login for [managing access to the relying parties](https://docs.google.com/document/d/1L9paVp6hAc2iJ_LRD866LPTfBFTo_AVfFxrvtbfQyJU/edit?tab=t.0#heading=h.yh1d0bs79mo2)). In short:
* In [SPREG](https://services.aai.lifescience-ri.eu/spreg) the service provider needs to activate "Restrict access to the service based on membership in groups"
* User of the service need to be member of the group. See [Instructions for group managers](https://docs.google.com/document/d/1-qHT4N_iRrMLZmdIYpU9dXqactg61yFKAT0VFFLoK8c/edit?tab=t.0#heading=h.jpxy5yiesyoq).
* A group can be assigned to a service (facility) in [Perun](https://perun.aai.lifescience-ri.eu/facilities).

**As a service provider, I can withdraw access rights, so that users won't be able to access the service anymore.** Access to the service can be restricted again via the respective group memberships. See [Instructions for group managers](https://docs.google.com/document/d/1-qHT4N_iRrMLZmdIYpU9dXqactg61yFKAT0VFFLoK8c/edit?tab=t.0#heading=h.jpxy5yiesyoq).

## Access to data

**As a researcher, I can identify a relevant sensitive data set, so that I can consider it for analysis in my own research.** A prerequisite for the reuse of data is usually that the data fulfils the FAIR (Findable, Accessible, Interoperable, Reusable) criteria, including the findability of the data in metadatabases. Best practices and guidelines on FAIR criteria and data management are available in the [ELIXIR RDMkit](https://rdmkit.elixir-europe.org/).

**As a researcher, I can request access to a sensitive data set, so that I can integrate it into my own research activities.** The researcher creates a data access request for a specific data set via an access management system. An example of an access management system is [REMS](https://github.com/CSCfi/rems) from CSC Finland. 

**As a data controller, I can give a researcher access to a specific dataset, so that the researcher can work with the data in accordance with my data usage policies.** The data controllers are responsible for providing access to sensitive data. Regarding sensitive human data, patients have usually specified the purposes for which personal data may be accessed and the controllers must check whether these purposes are fulfilled in the event of a request. For this purpose, GA4GH defines the [Data Use Ontology](https://www.ga4gh.org/product/data-use-ontology-duo/) to standardize both consents and requests. Approved access requests can be stored uniformly via the [GA4GH Passport](https://www.ga4gh.org/product/ga4gh-passports/) specification. Life Science Login acts as a passport broker and can provide user authorizations for the cloud services ([GA4GH passport support in LifeScience AAI](https://docs.google.com/document/d/1QpMgSeDdtPJWujdR9Z93WsTC5I9vyvd4bHjpWcGVnz0/edit?tab=t.0#heading=h.vdrx3flw0u2j)).

## Analysis

**As a researcher, I can run a specific data analysis workflow on an external dataset in the cloud, so that I can integrate the results into my research activities.** The GA4GH standardizes the execution of workflows and workflow tasks in the cloud via the specification of the [Workflow Execution Service (WES)](https://www.ga4gh.org/product/workflow-execution-service-wes/) and the [Task Execution Service (TES)](https://www.ga4gh.org/product/task-execution-service-tes/) respectively. The ELIXIR on cloud project supports the execution of workflows and tasks by developing tools and providing guidance for researchers ([user-guide](https://elixir-cloud-aai.github.io/guides/guide-user/)). A user can trigger the execution of a workflow via a WES implementation. Once the workflow has been successfully completed, the resulting data can be used by the researcher for further activities.