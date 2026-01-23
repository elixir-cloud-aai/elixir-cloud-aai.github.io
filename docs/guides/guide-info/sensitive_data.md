# Processing Sensitive Data

Processing sensitive human data is fundamental to biomedical research, enabling breakthroughs in disease understanding, biomarker discovery, and treatment development.
Rapid and secure access to such data accelerates research but also introduces significant responsibilities for data protection and privacy.
Cloud-based services are increasingly used in biomedical research to connect researchers, data, and tools throughout the data lifecycle.
This page summarizes scenarios and requirements for handling sensitive data within the ELIXIR-on-Cloud framework.

## Legal Frameworks

Sensitive data processing in research is governed by several legal frameworks, most notably the General Data Protection Regulation (GDPR) and the European Health Data Space (EHDS):

* **GDPR**: Allows the use of sensitive personal data for research when specific safeguards are in place. Under GDPR, processing may rely on different legal bases, such as tasks carried out in the public interest or explicit informed consent from data subjects, depending on the research context and applicable national law. In all cases, measures such as data minimization, pseudonymization, and strict access controls should be implemented, and a Data Protection Impact Assessment (DPIA) is strongly recommended.
* **EHDS**: Builds on GDPR by establishing a unified framework for secure sharing and secondary use of electronic health data across the EU. The EHDS is defined as "the first common EU data space dedicated to a specific sector, establishing a common framework for use and exchange of electronic health data across the EU" ([Regulation (EU) 2025/327](eur-lex-ehds)). The EHDS aims to improve individuals' access to their electronic health data and enable secondary use for research, innovation, policymaking, health threats preparedness, patient safety, and regulatory activities.

## Environments

* A Trusted Execution Environment (TEE) is a secure and isolated area within a computer system or processor that ensures the confidentiality and integrity of code and data during execution. It aims to protect sensitive computations and data from potential threats, such as malware or unauthorized access.
* A Secure Processing Environment (SPE) is a controlled environment designed to facilitate secure data processing and analysis while maintaining confidentiality, integrity, and privacy. It focuses on secure processing techniques, often including encryption, secure computation, or secure enclaves, to protect data during computation. Under the EHDS regulation, sensitive health data (e.g., genetic or clinical records) can be reused for research, innovation, and policy-making if anonymized or pseudonymized and accessed through SPE ([Regulation (EU) 2025/327](eur-lex-ehds)).
* A Trusted Research Environment (TRE) is a secure and controlled environment specifically tailored for research purposes, providing secure data access, analysis, collaboration, and compliance with legal and ethical requirements. TREs emphasize data governance, collaboration, and knowledge generation while ensuring privacy protection. For TREs, the **Five Safes framework** is particularly relevant as a comprehensive approach to data protection while enabling research access. This framework has been adopted by Health Data Research UK (HDR-UK), NIHR, and other major UK research institutions as the gold standard for balancing data protection with research utility ([What is the Five Safes framework?](ukdataservice-5-safes)).

!!! note "SPEs vs TREs"
    Secure Processing Environments (SPEs) and Trusted Research Environments (TREs) are conceptually very similar and serve comparable purposes in providing secure environments for sensitive data processing. The key difference lies in their regulatory and geographical context: SPEs are specifically required within the framework of the EHDS, while TREs are primarily a UK-developed concept and implementation approach.

### Similarities Between TEE, SPE, and TRE

* **Isolation**: Operates separately from the main platform it runs on.
* **Security**: Provides a secure environment for computations and data storage, including cryptographic key management and protection against malware.
* **Integrity**: Ensures the integrity of data and code within the environment.
* **Confidentiality**: Maintains confidentiality of sensitive information if the environment is compromised.
* **Controlled Access and Authentication**: Authenticates code and data before execution to ensure only trusted and verified code runs.
* **Collaboration and Analysis**: There is an offer of tools and infrastructure that enable researchers to perform analysis and collaborate within a secure environment. This allows for sharing and combining datasets while maintaining data privacy.

## Use Cases

Researchers may require access to sensitive data in different scenarios.
The four use cases are derived from the two dimensions of data storage and data processing.
Research data can be stored in a single location or in multiple locations and institutions.
We also distinguish between whether the data should be processed in the cloud or in the researcher's own environment.

|                    | Local processing    | Cloud processing     |
| ------------------ | ------------------- | -------------------- |
| **Central data**   | Data repository     | Cloud platform       |
| **Federated data** | Federated database  | Federated processing |

* **Data repository**: Data is stored in a single database. Researchers request access, are authorized, and transfer encrypted data to their secure environment for analysis.
* **Federated database**: Data is distributed across multiple nodes. Metadata is accessible via APIs and a central portal. Researchers request access to datasets at individual nodes, which then provide data for transfer or processing.
* **Cloud platform**: Centralized sensitive data is hosted on a platform. Authorized users log in and analyze data directly within an SPE, using workflows or interactive tools.
* **Federated processing**: Sensitive data remains on separate nodes with restricted transfer. Analysis is performed via APIs in an SPE, often combining results from multiple sources. A special case of this is federated learning, where models are trained through several iterations and updated with different datasets.
