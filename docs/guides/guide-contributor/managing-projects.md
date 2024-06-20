# Managing your own project

If you are managing a project by yourself or with others, please follow these
additional guidelines below.

## Community standards

Please try to adhere to best community standards. To help with that, visit
GitHub's "Community Standards" section (accessible in each repository via the
"Insights" tab) and confirm that the following are available in the repository
root directory:

- **README** in file `README.md`
- **Code of Conduct** in file `CODE_OF_CONDUCT.md` (can link to the [Code of
  Conduct](../../about/code-of-conduct.md) on this page)
- **Contributing guidelines** in file `CONTRIBUTING.md` (can link to the
  [contributor guide](index.md) on this page)
- **License** in file `LICENSE`
- **Pull request template** in file `PULL_REQUEST_TEMPLATE.md`

Also make sure that a project **description** (right hand panel on the
repository's main page) and one or more **issue templates** (in
`.github/ISSUE_TEMPLATE`) are available.

## Licensing

All projects must be licensed under an [Open Source Initiative
(OSI)][osi]-approved license. The license must be included in the repository
root directory in a file named `LICENSE`. Unless otherwise discussed, please
use the [Apache License 2.0][license-apache].

## Versioning

All our projects are versioned according to the [Semantic Versioning][sem-ver]
specification. This means that each version number consists of three parts:
`MAJOR.MINOR.PATCH`. The version number is increased as follows:

- `MAJOR` version is increased when you make incompatible/breaking API changes
- `MINOR` version is increased when you add functionality in a backwards
  compatible manner
- `PATCH` version is increased when you make backwards compatible bug fixes

Note that projects in pre-release state, i.e., should be assigned a version
number below `1.0.0` (start with `0.1.0`). In Semantic Versioning, this means
that API changes can occur at any moment, which is suitable for a project that
has not reached sufficient maturity and API stability yet.

## Continuous Integration

We are fully embracing the concept of continuous integration (CI) and related
practices. This means that all code changes are automatically tested and
validated before they are merged into the main codebase. This is to ensure that
the codebase remains stable and that new features and bug fixes do not break
existing functionality.

Therefore, when starting a new project, as soon as possible, please add one or
more GitHub Actions workflows to your project that do the following for pushes
to and pull requests against the repository's default branch (see existing
projects for examples):

- Run linting and formatting checks
- Run type checks (if applicable)
- Run unit and integration tests
- Check test coverage and upload results to [Codecov][codecov]
- Build and publish documentation (if not set up to be triggered automatically
  by the publishing system, e.g., Read the Docs)

!!! note "Continuous Delivery/Deployment"

    If the project you are working on is reasonably mature, also consider
    setting up one or more continuous delivery/deployment workflows.

## Documentation

Related to continuous integration, we also value continuous documentation. This
means that documentation is updated and improved as the codebase evolves. This
is to ensure that the documentation remains accurate and up-to-date and that it
reflects the current state of the codebase. It also means that we want to start
writing documentation as early as possible.

Currently, we are using Markdown to write documentation. For new projects, we
expect that each project has a `README.md` file that covers the following
sections (fill in with "Coming soon" if not yet available):

- **Synopsis**: A brief description of the project
- **Basic usage**: A brief overview of how to use the project
- **Installation**: Instructions on how to install/deploy the project
- **Versioning**: Information on how the project is versioned
- **Contributing**: Guidelines on how to contribute to the project, with links
    to the [contributing guidelines](index.md) and our
    [code of conduct](../../about/code-of-conduct.md)
- **Contact**: Information on how to contact the project leads

### Hosted documentation

As projects grow, a simple `README.md` will not be sufficient anymore.

We therefore kindly ask you to prepare a dedicated, hosted documentation page
early on. This can be done using services like [Read the Docs][read-the-docs] or
GitHub Pages with MKDocs (like this page).

Carefully consider the audiences for your project and tailor the documentation
accordingly. In all cases, we expect that API documentation is made available
(can be auto-generated from code, e.g., via [Sphinx][sphinx]).
