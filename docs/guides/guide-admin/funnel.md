Follow these instructions if you wish to deploy a TES endpoint in front of your
HPC/HTC cluster (currently tested with [Slurm][slurm] and [OpenPBS][openpbs].

- Make sure the build dependencies `make` and [Go 1.21+][go-install] are
  installed, `GOPATH` is set and `GOPATH/bin` is added to `PATH`.
   
    For example, in Ubuntu this can be achieved via:
   
    ```sh
    sudo apt update
    sudo apt install make golang-go
    export GOPATH=/your/desired/path
    export PATH=$GOPATH/bin:$PATH
    go version
    ```
   
- Clone the repository:
   
    ```sh
    git clone https://github.com/ohsu-comp-bio/funnel.git
    ```
   
- Build Funnel:

    ```sh
    cd funnel
    make
    ```
   
- Test the installation by starting the Funnel server with:
   
    ```sh
    funnel server run
    ```

If all works, Funnel should be ready for deployment on your HPC/HTC.

Alternatively, you can install Funnel via Homebrew:

```sh
brew tap ohsu-comp-bio/formula
brew install funnel@0.11
```

Source: [Funnel website](https://ohsu-comp-bio.github.io/funnel/)

### Slurm

For the use of Funnel with Slurm, make sure the following conditions are met:

1. The `funnel` binary must be placed in a server with access to Slurm.
2. A config file must be created and placed on the same server. [This
   file][funnel-config-slurm] can be used as a starting point.
3. If we would like to deploy Funnel as a Systemd service,
   [this file][funnel-config-slurm-service] can be used as a template. Set the
   correct paths to the `funnel` binary and config file.

If successfull Funnel should be listening on port `8080`.

### OpenPBS

!!! warning "Under construction"
    More info coming soon...
