# User guide

## Introduction

Welcome to the user documentation for the ELIXIR Cloud & AAI ecosystem. With
this powerful set of services, you'll be able to easily access cloud resources
and send analysis pipelines to your data with just a few simple commands.
Imagine being able to run complex genomic analyses on massive datasets without
worrying about infrastructure limitations or having to manage complex server
environments. The GA4GH Cloud APIs give you access to powerful tools and
resources that allow you to focus on your research goals, not IT.

The GA4GH (Global Alliance for Genomics and Health) cloud [APIs][ga4gh-cloud]
are a set of standard APIs that provide a common interface for accessing
genomic data and tools across different cloud providers. These APIs are
essential for enabling genomic data sharing and collaboration, and they have
been adopted by major cloud providers such as Google Cloud Platform, Microsoft
Azure, and Amazon Web Services. In this documentation, we'll cover four main
GA4GH APIs that you'll be using: the Workflow Execution Service
([WES][ga4gh-wes]), the Task Execution Service ([TES][ga4gh-tes]), the Data
Repository Service ([DRS][ga4gh-drs]), and the Tool Registry Service
([TRS][ga4gh-trs]). The WES API allows you to define and execute workflows,
while the TES API allows you to execute individual tasks within those
workflows. The DRS API provides a way to access and download genomic data, and
the TRS API enables the discovery of genomic analysis tools.

Whether you are a bioinformatician or a data scientist, this documentation will
provide you with all the information you need to start using ELIXIR's GA4GH
cloud services ecosystem and harness the power of cloud computing for your
genomic data analysis needs. Let's get started!

## ELIXIR Cloud & AAI deployments

The ELIXIR Cloud & AAI group manages different services and appliocations as
part of the ELIXIR cloud framework. Currently, these services are temporarily
listed in a dedicated [services list applications][elixir-cloud-services].  In
the mid-term, all services instances will be registered in the [ELIXIR Cloud
Registry][elixir-cloud-registry], an implementation of the [GA4GH Service
Registry API][ga4gh-service-registry].

## Task Execution Service (TES)

The GA4GH [TES][ga4gh-tes] specification is a standard interface that enables
interoperability between workflow management systems and execution engines. The
TES specification provides a uniform way to submit and monitor tasks to any
execution engine that implements the specification, allowing users to easily
switch between workflow management systems or execution engines without
rewriting their workflows. Typical use cases are

- Scenario 1: A researcher wants to run a workflow locally. The workflow
  contains some resource-intensive steps, such as requirements for GPUs or many
  cores. Using TES as a backend, the researcher can execute the workflow
  locally and also send the resource-intensive tasks to cloud servers for
  execution.
- Scenario 2: A researcher wants to run a workflow that involves processing
  data that is stored in cloud locations. Using TES would allow individual
  tasks to be sent to the compute locations associated with each storage
  location. This may be relevant if the data provider does not allow files to
  be downloaded to a central location or if it is not technically feasible.

The TES specification defines a HTTP API for submitting and monitoring tasks
that includes endpoints for creating, querying, updating, and canceling tasks.
Tasks are defined as JSON objects that include input and output files, a
command to execute, and any environment variables or resources required by the
task. The TES specification also includes mechanisms for handling task
dependencies and retrying failed tasks. Popular TES implementations are
[Funnel][funnel] and [TESK][tesk].

Several popular workflow management systems, including [cwl-tes][cwl-tes],
[Snakemake][snakemake] and [Nextflow][nextflow], have implemented the TES
specification, allowing users to easily run their workflows on any execution
engine that supports TES.

### Snakemake

Snakemake supports TES v1.0 since version 5.28.0, as described in the
[Snakemake documentation][snakemake-docs]. Snakemake executes individual tasks
as separate workflows that execute only one or a few rules. When using TES, it
is recommended to use additional remote storage to store input and output
files. By default, Snakemake TES tasks are executed using the official
Snakemake container image in the same version as the original Snakemake call.
To use specific tools, conda environments should be appended to the rules. A
demo workflow is available
[here][elixir-cloud-demo-smk].

### CWL-tes

A demo workflow is available [here][elixir-cloud-demo-cwl].

### Nextflow

!!! warning "Under construction"
    More info coming soon...

## Workflow Execution Service (WES)

The GA4GH [WES][ga4gh-wes] is a standard specification protocol for executing
and monitoring bioinformatics workflows. It allows researchers to easily
execute and manage complex analysis pipelines across multiple computing
platforms and institutions. The WES specification provides a unified API for
describing workflow inputs and outputs, monitoring job status and progress, and
managing data transfers. With this specification, users can build scalable,
reproducible, and interoperable genomics workflows, enabling collaboration
across institutions and improving data sharing. Two use cases for the GA4GH WES
specification are:

- Scenario 1: A researcher wants to analyze a large dataset of genomic data
  using a specific analysis pipeline. With the WES specification, the
  researcher can easily define the inputs and parameters for the pipeline,
  select a computing platform that meets their requirements, and submit the job
  for execution. They can then monitor the progress of the job and receive
  notifications when the job is complete. This allows the researcher to focus
  on analyzing the results rather than managing the underlying infrastructure.

- Scenario 2: A clinical laboratory needs to process patient samples for
  genetic testing. The laboratory can use the WES specification to define the
  analysis pipeline and integrate it with its LIMS. This allows the laboratory
  to automate the processing of samples, reducing errors and turnaround time.

## Data Repository Service (DRS)

!!! warning "Under construction"
    More info coming soon...

## Tool Registry Service (TRS)

!!! warning "Under construction"
    More info coming soon...
