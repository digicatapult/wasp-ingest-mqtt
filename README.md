# wasp-ingest-mqtt

WASP Ingest for things connecting over MQTT.

Connects to a WASP managed MQTT broker utilising the `mosquitto-go-auth` plugin. Things are authenticated using a JWT that is validated using the `wasp-authentication-service`.

## Getting started

`wasp-ingest-mqtt` can be run in a similar way to most nodejs applications. First install required dependencies using `npm`:

```sh
npm install
```

### Testing

For integration testing, `wasp-ingest-mqtt` depends on Mosquitto, Kafka and Zookeeper. These can be brought locally up using docker. For macOS and Windows use the docker-compose file located in the root of the repository, for Linux hosts please use the compose file under (./test/docker-compose.yaml)[./test/docker-compose.yaml].

For MacOS / Windows:

```sh
docker-compose up -d
```

For Linux:

```sh
docker-compose -f ./test/docker-compose.yaml up -d
```

You can then run tests with:

```sh
npm test
```

## Environment Variables

`wasp-ingest-mqtt` is configured primarily using environment variables. The service supports loading of environment variables from a .env file which is the recommended method for development.

### General Configuration

| variable            | required |            default            | description                                                                                                           |
| :------------------ | :------: | :---------------------------: | :-------------------------------------------------------------------------------------------------------------------- |
| SERVICE_TYPE        |    N     |      `WASP_INGEST_MQTT`       | Name of the service type (used to discriminate logs)                                                                  |
| LOG_LEVEL           |    N     |            `info`             | Logging level. Valid values are [`trace`, `debug`, `info`, `warn`, `error`, `fatal`]. When testing, default = `debug` |
| PORT                |    N     |             `80`              | Port on which the service will listen                                                                                 |
| KAFKA_LOG_LEVEL     |    N     |           `nothing`           | Logging level for Kafka. Valid values are [`debug`, `info`, `warn`, `error`, `nothing`]                               |
| API_MAJOR_VERSION   |    N     |             `v1`              | Major API version                                                                                                     |
| AUTH_ROUTE          |    N     |            `auth`             | Route on authentication service to validate tokens                                                                    |
| KAFKA_BROKERS       |    N     |       `localhost:9092`        | List of addresses for the Kafka brokers                                                                               |
| WASP_INGEST_NAME    |    N     |            `mqtt`             | Name of this ingest type                                                                                              |
| KAFKA_PAYLOAD_TOPIC |    N     |        `raw-payloads`         | Topic to publish payloads to                                                                                          |
| AUTH_SERVICE_HOST   |    N     | `wasp-authentication-service` | Hostname of the `wasp-authentication-service` to use to authenticate JWTs                                             |
| AUTH_SERVICE_PORT   |    N     |             `80`              | Port of the `wasp-authentication-service` to use to authenticate JWTs                                                 |
| MQTT_ENDPOINT       |    Y     |                               | Endpoint, including protocol of the MQTT broker to receive messages via                                               |
| MQTT_USERNAME       |    Y     |                               | Username to connect to the MQTT broker                                                                                |
| MQTT_PASSWORD       |    Y     |                               | Password to connect to the MQTT broker                                                                                |

## Helm/Kubernetes

Install `minikube` and `helm` using Homebrew, then start `minikube` and update helm dependencies:

```
brew install minikube helm
minikube start
helm dependency update helm/wasp-ingest-mqtt
```

Eval is required to provide helm with visibility for your local docker image repository:

```
eval $(minikube docker-env)
```

Build the docker image (change `src=` to point to your local github token):

```
DOCKER_BUILDKIT=1 docker build -t wasp-ingest-mqtt:latest --secret id=github,src=<path/to/your/github_token> .
```

To run/deploy the application on kubernetes via helm charts use the following `ct-values.yaml` with the corresponding overrides:

```
helm install wasp-ingest-mqtt helm/wasp-ingest-mqtt -f helm/wasp-ingest-mqtt/ci/ct-values.yaml
```

Check the pods are running successfully using:

```
kubectl get pods -A
```
