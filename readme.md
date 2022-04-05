# loxone-influx

This script listens for events on Loxone's websocket (WS) API and adds event data to Influx based on the config.

The script has a buffer of `bufferSize` for regular events and for an additional `criticalBufferSize` for critical events (marked as such in the config). The buffer is used to store events in-memory, in case data cannot be sent to InfluxDb.

The script is based on the script at: https://github.com/raintonr/loxone-stats-influx

## Usage

You can run the script directly, through node or install the scirpt as a Docker container.

### Running through node

- Update `default.json` in the `config` folder with:
  - Loxone IP address
  - Loxone username
  - Influx IP address
  - Influx database
  - Your environment's UUID's
- Create `local.json` in the `config` folder with:
  - Loxone password
- run using `npm start`

### Running through Docker

- Update `default.json` in the `config` folder with:
  - Loxone IP address
  - Loxone username
  - Influx IP address
  - Influx database
  - Your environment's UUID's
- Create `local.json` in the `config` folder with:
  - Loxone password
- Build the container using `dockerfile`.
- Start the container
  - make sure to add the `TZ` environmental variable with the proper timezone
  - make sure to map the `config` into the container under `/app/config`, eg:

    ```docker
    docker run -d \
        --name loxone-influx \
        -v <path to config on host>/config:/app/config \
        -e TZ="Europe/London" \
        --restart=unless-stopped \
        loxone-influx
    ```

## Configuration

UUID's can be easily obtained by opening your `*.Loxone` file and searching for the building block name you are interested in. 

>NOTE: The Loxone WS API will only emit change updates for items that are configured as "Use" in the "User interface" section of the block's Loxone config.
> To avoid clutter in the Loxone native mobile app, I am using a dedicated user for this script, so items that I need in Influx but don't want in the mobile app are assigned in Loxone Config to this user only.

The file `local.json` is in `.gitignore` so it won't be added to source control to avoid checking in credentials.

The configuration items under the `uuids` node need to have the following format:

```json
"uuids" : {
    "uuid-of-loxone-item": {
        "measurement": "influx measurement name",
        "tags": {
            "any": "tag",
            "tag2": "value2"
        },
        "critical": false
    }
}
```

## Local build

Container targeting multiple platforms can be build using `buildx`. 

```sh
docker buildx build --platform linux/amd64,linux/arm64,linux/arm/v7 -t <repo>/loxone-influx:latest -t <repo>/loxone-influx:$(date +"%Y%m%d") --push --no-cache .
```


## DevOps flow using Docker

I am using an Azure Container Registry (ACR) to host my images but this approach would be analogous when using other registries (eg: dockerhub) as well. The following ACR task watches commits in this github repository, builds the docker image, and pushes the new image to the registry.

I am running [watchtower](https://containrrr.github.io/watchtower/) to make sure my container is using the latest image available in ACR.

### ACR task

The following task watches this github repository, builds the docker image for `linux/arm64/v8` upon commit and pushes the new image to ACR with the `latest` and the current date as tags.

```sh
az acr task create \
     --registry andrasg \
     --name loxone-influx \
     --image loxone-influx:latest \
     --image loxone-influx:$(date +%Y%m%d) \
     --context https://github.com/andrasg/loxone-influx.git \
     --file dockerfile \
     --git-access-token <PAT> \
     --base-image-trigger-enabled false \
     --platform linux/arm64/v8
```

The following task watches this github repository, builds the docker image using the file `acrtask.yml` upon commit and pushes the new image to ACR with the `latest` and the current date as tags.

```sh
az acr task create \
    --registry andrasg \
    --name loxone-influx \
    --context https://github.com/andrasg/loxone-influx.git \
    --file acrtask.yml \
    --base-image-trigger-enabled false \
    --git-access-token <PAT>
```
