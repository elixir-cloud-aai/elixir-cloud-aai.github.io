# Sandbox

Welcome to the user documentation for the ELIXIR-on-Cloud ecosystem. With
this powerful set of services, you'll be able to easily access cloud resources
and send analysis pipelines to your data with just a few simple commands.
Imagine being able to run complex genomic analyses on massive datasets without
worrying about infrastructure limitations or having to manage complex server
environments. The GA4GH Cloud APIs give you access to powerful tools and
resources that allow you to focus on your research goals, not IT.

## Funnel
Funnel is an open-source distributed workflow execution system designed as a reference implementation 
of the GA4GH Task Execution Service (TES) specification. Its primary purpose is to provide a standardized 
API for running containerized computational workloads across heterogeneous infrastructure, 
including Kubernetes clusters, cloud providers, and on-premises environments. In multi-omics computing, 
researchers often need to execute thousands of Docker-based analysis jobs across diverse compute environments.
Funnel abstracts the underlying infrastructure behind the GA4GH TES API, allowing clients to 
submit tasks without being tied to a specific cluster scheduler or cloud platform.

See [Funnel deployment]( ../services/funnel.md) for a detailed instruction of service deployment.

## TESK
TESK (Task Execution Service for Kubernetes) is an open-source implementation of the 
GA4GH Task Execution Service (TES) standard that provides a Kubernetes-native backend for executing 
containerized scientific workloads. It is part of the ELIXIR Cloud & AAI ecosystem and serves as the 
cloud-native counterpart to Funnel.

## Poiesis
Poiesis is a cloud-native implementation of the GA4GH Task Execution Service (TES) v1.1.0 
designed specifically for Kubernetes environments. Like TESK and Funnel, it exposes a 
standards-compliant TES API for running containerized computational workloads, 
but its architecture emphasizes stateless execution, strong authentication,
Kubernetes-native operations, and task handling

See [Poiesis GitHub repo](https://github.com/JaeAeich/poiesis) for detailed instructions.

## Authentication with LS Login
Life Science Login (LS Login), also known as the Life Science Authentication and Authorization Infrastructure [(LS AAI)](https://elixir-europe.org/platforms/compute/aai), is the federated identity and access management platform used across ELIXIR and numerous European life-science research infrastructures. It provides a single authentication and authorization layer that enables researchers to access scientific services, datasets, workflows, and computational resources using their existing institutional or community identities.

LS Login evolved from the original ELIXIR AAI and became the primary authentication platform in 2022 after integration with multiple European life-science infrastructures

Various examples of LS Login deployment examples can be found [here](../services/services_to_ls_aai.md)

!!! warning "Under construction"
    More info coming soon...

## ELIXIR-on-Cloud deployments

The ELIXIR-on-Cloud group manages different services as
part of the ELIXIR cloud framework. Currently, these services are temporarily
listed in a dedicated [services list applications][elixir-cloud-services]. In
the mid-term, all services instances will be registered in the [ELIXIR Cloud
Registry][elixir-cloud-registry], an implementation of the [GA4GH Service
Registry API][ga4gh-service-registry].
