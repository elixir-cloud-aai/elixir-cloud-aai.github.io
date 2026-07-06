# Crypt4GH Integration with proTES: A Guide to Secure Genomic Analysis

This guide explains how to configure and deploy an environment that enables collaborative research on sensitive genomic data. Data holders can securely provide encrypted data for analysis while researchers process it through [Funnel](https://github.com/ohsu-comp-bio/funnel) and [proTES](https://github.com/elixir-cloud-aai/proTES), where automatic decryption occurs within secure containers without granting researchers direct access to the sensitive data. This setup leverages [GA4GH TES](https://github.com/ga4gh/task-execution-schemas) standard for scalable and secure task execution.

## Use Case

A data holder needs to provide sensitive genomic data for analysis to a researcher in a cloud environment. The data must remain encrypted during storage and transfer, with decryption occurring only within a secure computational environment (container), without granting direct data access to the researcher.

1. The data holder encrypts sensitive data using Crypt4GH and stores them at a secure storage (e.g. S3 buckets).
2. The researcher submits a GA4GH TES task to `proTES` for analysis of the encrypted data. 
3. The installed `proTES middleware` automatically detects the encrypted data and decrypts them using Crypt4GH keys that are managed by `proTES`.
4. The researcher's task command is executed on the decrypted data.
5. The analysis results are stored at a dedicated storage accessible to the researcher

`Note:` all computational steps are done in a secure containerized environment.

This approach allows collaborative research where sensitive data can be processed in cloud environments without provisioning data access to the researcher but instead utilizing a combination of `Crypt4GH` and `proTES` for data encryption, decryption, and analysis.
Additionally, the researcher can repeat the analysis with adjusted parameters anytime without further action of the data holder.


## Overview

[Crypt4GH](https://crypt4gh.readthedocs.io/) is a standard for encrypting sensitive data. This setup demonstrates:

- Generating cryptographic key pairs for data exchange between parties (data holder and researcher)
- Encrypting files using the data holder's private key and researcher's public key
- Automatically decrypting `.c4gh` encrypted files during task execution using [protes-middleware-crypt4gh](https://github.com/elixir-cloud-aai/protes-middleware-crypt4gh)
- Securely processing sensitive data in containerized environments

**Security Note:** Private keys should be stored in secure locations and used only for encryption/decryption. Consider using signed URLs for transferring private keys to the TES instance. 

**Goal of this tutorial:** You'll have a setup which encrypts sensitive data, stores them in a secure storage, automatic detection of encrypted data, decryption followed by processing, and ensuring that sensitive data remains protected.

## Setup

The complete setup consists of three main tasks:

1. **Key Generation**: Generate Crypt4GH key pairs for the data holder and researcher parties (optional).
2. **File Encryption**: Encrypt sensitive data using the Crypt4GH keys.
3. **File Decryption**: automatic detection of encrypted data, their decryption and processing in a secure computing environment.


## Prerequisites

Before starting, ensure you have:

- **Three VMs**:
  - Funnel server VM
  - Funnel worker VM
  - ProTES deployment VM
- [Docker](https://docs.docker.com/engine/install/ubuntu/#install-using-the-repository) installed on all VMs
- Network connectivity between all VMs
- Sufficient storage space for encrypted/decrypted files and results. 

## Installation and Configuration

### Step 1: Prepare Your VMs

The setup requires three distinct components:

- **Funnel Server**: Manages the database for storing task and scheduler data, and configures the compute backend
- **Funnel Worker**: Executes requested tasks and handles logging
- **ProTES Gateway**: Distributes tasks and provides middleware for automatic decryption

#### Install Dependencies

Run the following commands on both the Funnel server and worker VMs:

```bash
sudo apt update
sudo apt install -y make golang-go protobuf-compiler

# Install Go protocol buffer plugins (use pinned versions for reproducibility)
go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest
export PATH=$PATH:$(go env GOPATH)/bin

# Clone and build Funnel
git clone https://github.com/ohsu-comp-bio/funnel.git
cd funnel
make
```

### Step 2: Configure Funnel Server

Create a configuration file named `server-config.yaml` in the cloned Funnel directory on your **server VM**:

```yaml
Server:
  HostName: 0.0.0.0
  HTTPPort: "8000"
  RPCPort: "9090"

Database: boltdb

BoltDB:
  Path: ./funnel-work-dir/funnel.db

Compute: "manual"

Scheduler:
  ScheduleRate: 1s
  ScheduleChunk: 10

LocalStorage:
  AllowedDirs:
    - /tmp/funnel-storage
```

**Configuration Details:**

- `HostName: 0.0.0.0`: Binds to all network interfaces
- `HTTPPort: "8000"`: HTTP API port
- `RPCPort: "9090"`: RPC communication port
- `Database: boltdb`: Uses embedded BoltDB for task storage
- `Compute: "manual"`: Manual node management mode
- `LocalStorage.AllowedDirs`: Directories accessible for file I/O operations

### Step 3: Configure Funnel Worker

Create a configuration file named `worker-config.yaml` in the cloned Funnel directory on your **worker VM**:

```yaml
Server:
  HostName: XXX  # Replace with your Funnel server IP
  RPCPort: "9090"

RPCClient:
  ServerAddress: XXX:9090  # Replace with your Funnel server IP

Worker:
  WorkDir: "/tmp/funnel-work"
  
Node:
  ID: "worker-node-1"
  Resources:
    Cpus: 4
    RamGb: 7.0
    DiskGb: 18.0
  UpdateRate: 5s

LocalStorage:
  AllowedDirs:
    - /tmp/funnel-storage
```

**Important:** Replace `XXX` with the actual IP (internal if in the same network) address of your Funnel server VM.

**Configuration Details:**

- `ServerAddress`: Points to your Funnel server's RPC endpoint
- `Node.ID`: Unique identifier for this worker node
- `Node.Resources`: Define available CPU, RAM, and disk resources
- `UpdateRate`: How frequently the worker reports its status


### Step 4: Start Funnel Services

Start the services on their respective VMs:

**On the server VM:**

```bash
cd funnel
funnel server run --config server-config.yaml &
```

**On the worker VM:**

```bash
cd funnel
# If worker terminates after one task execution, put the command in a while loop.
# while true; do funnel node run --config worker-config.yaml; done
funnel node run --config worker-config.yaml &
```

Verify that both services are running by checking the logs or accessing the Funnel server API at `http://<server-ip>:8000`.

### Step 5: Configure ProTES

ProTES acts as a gateway and provides middleware for automatic Crypt4GH decryption. Follow the [proTES](https://github.com/elixir-cloud-aai/proTES) installation guide to deploy proTES on your third VM.

For detailed middleware installation, refer to the [protes-middleware-crypt4gh](https://github.com/elixir-cloud-aai/protes-middleware-crypt4gh) repository.

**Note:** If the branch-specific changes are not yet merged, use the `adjust_middleware` branch for `proTES` and the `update_middleware` branch for `protes-middleware-crypt4gh`. Once those changes are merged, use each repository's default branch.

Once installed, configure the Crypt4GH middleware by editing the `pro_tes/config.yaml` file:

```yaml
middlewares:
  - - "pro_tes.plugins.middlewares.crypt4gh_decrypt.CryptMiddleware"
    - "pro_tes.plugins.middlewares.task_distribution.random.TaskDistributionRandom"
```

## Usage Examples

The following examples demonstrate the complete encryption/decryption workflow using three sequential tasks.

### Task 1: Generate Crypt4GH Key Pairs

This task generates cryptographic key pairs for both the data holder and researcher. This step is independent of the following steps and may have happened a while ago. Your private keys may already be in a secure place. If you have crypt4gh keys, feel free to skip this step.

Create a file named `task1_keygen.json`:

```json
{
  "name": "Generate crypt4gh key pairs",
  "description": "Generate data holder and researcher key pairs locally in container",
  "inputs": [],
  "outputs": [
    {
      "name": "data_holder_sk",
      "description": "Data holder secret key",
      "url": "file:///tmp/funnel-storage/keys/data_holder/data_holder.sec",
      "path": "/outputs/keys/data_holder/data_holder.sec",
      "type": "FILE"
    },
    {
      "name": "data_holder_pk",
      "description": "data_holder public key",
      "url": "file:///tmp/funnel-storage/keys/data_holder/data_holder.pub",
      "path": "/outputs/keys/data_holder/data_holder.pub",
      "type": "FILE"
    },
    {
      "name": "researcher_sk",
      "description": "researcher secret key",
      "url": "file:///tmp/funnel-storage/keys/researcher/researcher.sec",
      "path": "/outputs/keys/researcher/researcher.sec",
      "type": "FILE"
    },
    {
      "name": "researcher_pk",
      "description": "researcher public key",
      "url": "file:///tmp/funnel-storage/keys/researcher/researcher.pub",
      "path": "/outputs/keys/researcher/researcher.pub",
      "type": "FILE"
    },
    {
      "name": "researcher_pk_copy",
      "description": "Copy of researcher public key",
      "url": "file:///tmp/funnel-storage/keys/data_holder/researcher.pub",
      "path": "/outputs/keys/data_holder/researcher.pub",
      "type": "FILE"
    }
  ],
  "executors": [
    {
      "image": "quay.io/grbot/crypt4gh-tutorial",
      "command": [
        "/bin/bash",
        "-c",
        "crypt4gh-keygen --sk /outputs/keys/data_holder/data_holder.sec --pk /outputs/keys/data_holder/data_holder.pub -f --nocrypt && crypt4gh-keygen --sk /outputs/keys/researcher/researcher.sec --pk /outputs/keys/researcher/researcher.pub -f --nocrypt && cp /outputs/keys/researcher/researcher.pub /outputs/keys/data_holder/researcher.pub"
      ],
      "workdir": "/tmp"
    }
  ],
  "resources": {
    "cpu_cores": 1,
    "ram_gb": 2,
    "disk_gb": 5
  }
}
```

**Key Details:**

- Generates two key pairs: one for the data holder and one for the researcher
- Keys are generated without encryption (`--nocrypt`) for demonstration purposes
- The researcher's public key is copied to the data holder's directory for use during encryption
- All keys are exported to local storage via TES outputs

### Task 2: Encrypt a File

This task retrieves a file, encrypts it using Crypt4GH keys, and stores both the encrypted file in a distinct location. Create a file named `task2_encrypt_file.json`:

```json
{
  "name": "Encrypt stat file with crypt4gh",
  "description": "Retrieve a file, record its size, and encrypt it using data holder and researcher keys",
  "inputs": [
    {
      "name": "data_holder_sk",
      "description": "data_holder secret key",
      "url": "file:///tmp/funnel-storage/keys/data_holder/data_holder.sec",
      "path": "/inputs/keys/data_holder/data_holder.sec",
      "type": "FILE"
    },
    {
      "name": "researcher_pk",
      "description": "researcher public key",
      "url": "file:///tmp/funnel-storage/keys/researcher/researcher.pub",
      "path": "/inputs/keys/researcher/researcher.pub",
      "type": "FILE"
    }
  ],
  "outputs": [
    {
      "name": "encrypted_file",
      "description": "Encrypted file",
      "url": "file:///tmp/funnel-storage/encrypted/united_kingdom_logo_size.txt.c4gh",
      "path": "/outputs/encrypted/united_kingdom_logo_size.txt.c4gh",
      "type": "FILE"
    },
    {
      "name": "size_file",
      "description": "Text file containing original file size",
      "url": "file:///tmp/funnel-storage/raw/united_kingdom_logo_size.txt",
      "path": "/outputs/raw/united_kingdom_logo_size.txt",
      "type": "FILE"
    }
  ],
  "executors": [
    {
      "image": "quay.io/grbot/crypt4gh-tutorial",
      "command": [
        "/bin/bash",
        "-c",
        "curl -L -o /tmp/file.png http://britishfamily.co.uk/wp-content/uploads/2015/02/MADE_IN_BRITAIN_web_300x300.png && stat -c %s /tmp/file.png > /outputs/raw/united_kingdom_logo_size.txt && crypt4gh encrypt --sk /inputs/keys/data_holder/data_holder.sec --recipient_pk /inputs/keys/researcher/researcher.pub < /outputs/raw/united_kingdom_logo_size.txt > /outputs/encrypted/united_kingdom_logo_size.txt.c4gh"
      ],
      "workdir": "/tmp"
    }
  ],
  "resources": {
    "cpu_cores": 1,
    "ram_gb": 2,
    "disk_gb": 10
  }
}
```

**Key Details:**

- Downloads a sample file from a URL
- Records the original file size
- Takes the data holder's private key and researcher's public key as inputs
- Encrypts the file using Crypt4GH, producing a `.c4gh` encrypted file
- Stores the encrypted file

### Task 3: Decrypt and Process File

This task decrypts the encrypted file using the researcher's private key and processes it.

**Note:** The different paths indicate isolated storage paths that do not necessarily see each other. For example, distinct S3 buckets.

Create a file named `task3_decrypt_and_write_size.json`:

```json
{
  "name": "Decrypt crypt4gh file",
  "description": "Decrypt an encrypted file using researcher key locally",
  "volumes": ["/outputs/test"],
  "inputs": [
    {
      "name": "encrypted_file",
      "description": "Encrypted input file",
      "url": "file:///tmp/funnel-storage/encrypted/united_kingdom_logo_size.txt.c4gh",
      "path": "/inputs/encrypted/united_kingdom_logo_size.txt.c4gh",
      "type": "FILE"
    },
    {
      "name": "researcher_sk",
      "description": "researcher secret key",
      "url": "file:///tmp/funnel-storage/keys/researcher/researcher.sec",
      "path": "/inputs/keys/researcher/researcher.sec",
      "type": "FILE"
    }
  ],
  "outputs": [
    {
      "name": "decrypted_file",
      "description": "MD5 checksum of automatically decrypted file",
      "url": "file:///tmp/funnel-storage/decrypted/united_kingdom_logo_md5sum.txt",
      "path": "/outputs/decrypted/united_kingdom_logo_md5sum.txt",
      "type": "FILE"
    }
  ],
  "executors": [
    {
      "image": "quay.io/grbot/crypt4gh-tutorial",
      "command": [
        "/bin/sh",
        "-c",
        "mkdir -p /outputs/decrypted && /bin/md5sum /outputs/decrypted/united_kingdom_logo_size.txt > /outputs/decrypted/united_kingdom_logo_md5sum.txt"
      ],
      "workdir": "/tmp"
    }
  ],
  "resources": {
    "cpu_cores": 1,
    "ram_gb": 2,
    "disk_gb": 5
  }
}
```

**Key Details:**

- Takes the encrypted `.c4gh` file and researcher's private key as inputs
- The proTES middleware automatically decrypts the file during task execution
- Computes an MD5 checksum of the decrypted data for verification
- Stores the checksum in the output directory

## Submitting Tasks

Once your environment is configured, submit tasks to proTES using the following commands:

```bash
# Submit Task 1: Generate keys
curl -X POST http://localhost:8080/ga4gh/tes/v1/tasks \
  -H "Content-Type: application/json" \
  -d @task1_keygen.json

# Submit Task 2: Encrypt file (wait for Task 1 to complete)
curl -X POST http://localhost:8080/ga4gh/tes/v1/tasks \
  -H "Content-Type: application/json" \
  -d @task2_encrypt_file.json

# Submit Task 3: Decrypt file (wait for Task 2 to complete)
curl -X POST http://localhost:8080/ga4gh/tes/v1/tasks \
  -H "Content-Type: application/json" \
  -d @task3_decrypt_and_write_size.json
```

**Important:** Replace `localhost:8080` with your proTES server address if it's running on a different machine.

Each task submission returns a task ID that you can use to monitor progress:

```bash
curl http://localhost:8080/ga4gh/tes/v1/tasks/<task-id>
```

## Troubleshooting

### Common Issues

**Tasks not executing:**
- Verify Funnel server and worker are running
- Check network connectivity between VMs

**Decryption failures:**
- Verify the Crypt4GH middleware is properly configured in proTES. Use `docker logs` during task submission.
- Ensure `.c4gh` file extension is present on encrypted files

### Checking Logs

View Funnel server logs:
```bash
ps aux | grep funnel
# Find the process and check its output
```

View task details:
```bash
curl http://localhost:8000/v1/tasks/<task-id>
```

## Additional Resources

- [Funnel Documentation](https://ohsu-comp-bio.github.io/funnel/)
- [proTES Documentation](https://github.com/elixir-cloud-aai/proTES)
- [Crypt4GH Specification](https://crypt4gh.readthedocs.io/)
- [GA4GH TES API](https://github.com/ga4gh/task-execution-schemas)
- [Crypt4GH Middleware](https://github.com/elixir-cloud-aai/protes-middleware-crypt4gh)

## Security Best Practices

- **Never commit private keys** to version control
- Use **encrypted storage** for private keys in production
- Implement **access controls** on storage directories
- Use **signed URLs** or secure key management systems for key distribution
- Enable **TLS/SSL** for all API endpoints in production
