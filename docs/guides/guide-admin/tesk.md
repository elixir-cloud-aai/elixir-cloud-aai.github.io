## Deploying TESK

[TESK][tesk] uses the Kubernetes Batch API ([Jobs][k8s-jobs]) to schedule
execution of TES tasks. This means that it should be possible to deploy TESK in
any flavor of Kubernetes, but tests are currently only performed with
[Kubernetes][k8s], [OpenShift][openshift], and [Minikube][minikube]. Follow
these instructions if you wish to deploy a TES endpoint on your Native Cloud
cluster, and please let us know if you deploy TESK in any new and interesting
platform.

TESK currently does not use any other storage (DB) than Kubernetes itself.
[Persistent Volume Claims][k8s-pvc] are used as a temporary storage to handle
input and output files of a task and pass them over between executors of a
task. Note that PVCs are destroyed immediately after task completion! This
means your cluster will need to provide a ReadWriteMany
[StorageClass][k8s-storage-class]. Commonly used storage classes are
[NFS][nfs] and [CephFS][cephfs].

Here is an overview of TESK's architecture:

<div>
    <a href="https://github.com/elixir-cloud-aai/TESK">
        <img src="../images/tesk_architecture.png" alt="TESK architecture" width="627"/>
    </a>
</div>

A [Helm][helm] chart is provided for the convenient deployment of TESK. The
chart is available in the [TESK code repository][tesk-helm].

Follow these steps:

- [Install Helm][helm-install]
- Clone the [TESK repository][tesk]:
   
    ```sh
    git clone https://github.com/elixir-cloud-aai/TESK.git
    ```
   
- Find the Helm chart at `charts/tesk`
- Edit file [`values.yaml`][tesk-helm-values] (see
   [notes](#edit-chart-values) below)
- Log into the cluster and install TESK with:
   
    ```sh
    helm install -n TESK-NAMESPACE TESK-DEPLOYMENT-NAME . \
      -f values.yaml
    ```
   
    * Replace `TESK-NAMESPACE` with the name of the namespace where you want to
    install TESK. If the namespace is not specified, the default namespace will
    be used.
    * The argument provided for `TESK-DEPLOYMENT-NAME` will be used by Helm to
    refer to the deployment, for example when upgrading or deleting the
    deployment. You can choose whichever name you like.

You should now have a working TESK instance! You can try to `curl` the address by
running this command:

```sh
$ curl http://<tesk-url>/ga4gh/tes/v1/tasks
{
   "tasks" : []
}
```

### Edit Chart values

In the [TESK deployment documentation][tesk-docs-deploy] documentation there is
a [description of every value][tesk-docs-deploy-values]. Briefly, the most
important are:

- `host_name`: Will be used to serve the API.

- `storage`: `none` or `s3`. If `s3` is set, you must create two files: `config`
   and `credentials`. You can find templates in the `s3-config/` folder:

    `config`:

    ```
    [default]
    # Non-standard entry, parsed by TESK, not boto3
    endpoint_url=<your_S3_endpoint>
    ```

    `credentials`:

    ```
    [default]
    aws_access_key_id=<s3_access_key>
    aws_secret_access_key=<s3_secret_access_key>
    ```

    These files will be retrieved during the deployment of the Helm Chart

- `storageClass`: Specify the storage class. If left empty, TESK will use the
   default one configured in the Kubernetes cluster.

- `auth.mode`: Enable (`auth`) or disable (`noauth`; default) authentication.
   When enabled, you must add those two keys: `client_id` and `client_secret`
   with your values:

    ```yaml
    auth:
      client_id: <client_id>
      client_secret: <client_secret>
    ```

- `ftp`: Which FTP credentials mode to use. Two options are supported:
   `.classic_ftp_secret` for basic authentication (username and password) or
   `.netrc_secret` for using a [`.netrc`][netrc] file.
   
    For the classic approach, you must write in `values.yaml` and add two values
    `username` and `password`:
   
    ```yaml
    ftp:
      classic_ftp_secret: ftp-secret
      netrc_secret:
      username: <your_ftp_username>
      password: <your_ftp_password>
    ```
   
    For the `.netrc` approach, create a `.netrc` file in the `ftp` folder with
    the connections details in the correct format and set a name in `ftp.netrc_secret`:

    ```yaml
    ftp:
      classic_ftp_secret:
      netrc_secret: netrc-secret
    ```

    You can find a template named `.netrc-TEMPLATE` in the `ftp` folder:

    ```
    machine ftp-private.ebi.ac.uk
    login ftp-username
    password ftp-password
    ```

### Deploy with microk8s

This section outlines how to install TESK via [microk8s][microk8s] as tested on
an Ubuntu 22.04 machine.

First, install microk8s through the Snap Store and add yourself to the
`microk8s` group::

```bash
sudo snap install microk8s --classic
sudo usermod -a -G microk8s $USER
```

Next, let's clone the TESK repository and move into it the Helm chart directory:

```bash
git clone https://github.com/elixir-cloud-aai/TESK.git
cd TESK/charts/tesk
```

Follow the deployment instructions to modify
`values.yaml` as per your requirements.

!!! warning
    You **MUST** set `host_name`. To make the service available through the
    internet, see further below on how to configure the `service` section.

Great - you are now ready to deploy TESK!

First, let's create a namespace:

```bash
microk8s kubectl create namespace NAMESPACE
```

where `NAMESPACE` is an arbitrary name for your resource group.

Now let's use Helm to install:

```bash
microk8s helm install -n NAMESPACE RELEASE_NAME . -f values.yaml
```

where `RELEASE_NAME` is an arbitrary name for this particular TESK release.

Congratulations - TESK should now be successfully deployed!

To find out the IP address at which TESK is available, run the following
command:

```bash
microk8s kubectl get svc -n NAMESPACE
```

The output should look something like this:

```console
NAME       TYPE        CLUSTER-IP        EXTERNAL-IP   PORT(S)    AGE
tesk-api   ClusterIP   123.123.123.123   <none>        8080/TCP   8s
```

Use the `CLUSTER-IP` and the `PORT` with the following template to construct the
URL at which the service is available (and make sure to replace the dummy URL
when you want to try out the calls below):

```console
http://CLUSTER-IP:PORT/ga4gh/tes/v1
```

So, in this example case, we get the following URL:

```console
http://123.123.123.123:8080/ga4gh/tes/v1
```

You can now test the installation with the following example call to get a list
of tasks:

```bash
curl http://123.123.123.123:8080/ga4gh/tes/v1/tasks
```

If everything worked well, you should get an output like this:

```json
{
  "tasks": []
}
```

Let's try to send a small task to TESK:

```console
curl \
  -H "Accept: application/json"  \
  -H "Content-Type: application/json" \
  -X POST \
  --data '{"executors": [ { "command": [ "echo", "TESK says: Hello World" ], "image": "alpine" } ]}' \
  "http://123.123.123.123:8080/ga4gh/tes/v1/tasks"
```

That should give you a task ID:

```json
{
  "id" : "task-123ab456"
}
```

You can run the task list command from before again. Now the response should not
be an empty list anymore. Rather, you should see something like this:

```json
{
  "tasks" : [ {
    "id" : "task-123ab456",
    "state" : "COMPLETE"
  } ]
}
```

To get more details on your task, use the task ID from before in a call like
this:

```bash
curl http://123.123.123.123:8080/ga4gh/tes/v1/tasks/TASK_ID?view=FULL
```

We can use `jq` to parse the results. Let's say we want to see the logs of the
first (only, in this case) TES executor, we could do something like this:

```console
$curl -s http://123.123.123.123:8080/ga4gh/tes/v1/tasks/task-123ab456?view=FULL  | jq '.logs[0].logs'
```

Which would give us an output like this:

```json
[
  {
    "start_time": "2023-11-01T14:54:20.000Z",
    "end_time": "2023-11-01T14:54:25.000Z",
    "stdout": "TESK says: Hello World\n",
    "exit_code": 0
  }
]
```

Note that in the example, the API is only accessible internally. To make it
accessible publicly, we need to properly configure the `service` section in
`values.yaml`.

In particular, we would like to set the type to `NodePort` and then set an open
port on the host machine at which the API is exposed. For example, with

```yaml
service:
    type: NodePort
    node_port: 31567
```

Kubernetes will route requests coming in to port `31567` on the host machine to
port `8080` on the pod.

Let's confirm this by upgrading the Helm chart and again inspecting the services
in our namespace with:

```bash
microk8s helm upgrade -n NAMESPACE RELEASE_NAME . -f values.yaml
microk8s kubectl get svc -n NAMESPACE
```

We should get an output like this:

```console
NAME       TYPE       CLUSTER-IP        EXTERNAL-IP   PORT(S)          AGE
tesk-api   NodePort   123.123.123.111   <none>        8080:31567/TCP   5s
```

Indeed, the port section changed as expected. Now, note that the `CLUSTER-IP`
_also_ changed. However, this is not a problem as Kubernetes will manage the
routing, so we don't really need to know the `CLUSTER-IP`. Instead, now we can
use the hostname (or IP) of the host machine, together with the port we set to
call our TES API from anywhere:

```
curl http://HOST_NAME_OR_IP:31567/ga4gh/tes/v1/tasks
```

Of course you need to make sure that the port you selected is opened for
public access. This will depend on your router/firewall settings.

If you would like to tear down the TESK service, simply run:

```bash
microk8s helm uninstall RELEASE_NAME -n NAMESPACE
```