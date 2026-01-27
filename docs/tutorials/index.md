# Tutorials

This section contains hands-on, end-to-end tutorials that show how to deploy and use components of the ELIXIR-on-Cloud ecosystem. The guides are written to be actionable: they focus on concrete setups, expected infrastructure, and the sequence of steps needed to run secure analyses.

## In this section

- [Crypt4GH Integration with proTES](crypt4gh_to_protes.md)
  Shows a pattern for analyzing encrypted genomic data in the cloud without granting researchers direct access to the plaintext. It combines Crypt4GH encryption with GA4GH TES execution via Funnel and proTES, including automatic decryption inside controlled containers.

- [Analysis of Sensitive Data in Secure Processing Environments (SPE)](sensitive_data_analysis.md)
  Walks through a reference setup for an SPE (example: de.NBI Cloud / ELIXIR-DE) using WESkit for workflow submission, a Slurm cluster for execution, and S3-compatible storage for publishing non-sensitive results. It also outlines how LS Login can be used for authentication and authorization.
