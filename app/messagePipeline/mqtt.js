import mqtt from 'mqtt'

import globalLogger from '../logger.js'
import env from '../env.js'

const { MQTT_ENDPOINT, MQTT_USERNAME, MQTT_PASSWORD } = env

const setupMqttListener = async (next) => {
  const logger = globalLogger.child({ module: 'mqtt' })

  let hasResolved = false

  return new Promise((resolve, reject) => {
    const client = mqtt.connect(MQTT_ENDPOINT, { username: MQTT_USERNAME, password: MQTT_PASSWORD })
    client.on('connect', function () {
      logger.info('Connection to MQTT server established')

      const topic = `things/+/messages`
      client.subscribe(topic, (err) => {
        if (err) {
          logger.error(`Error subscribing to MQTT server (${topic})`)
          if (!hasResolved) {
            hasResolved = true
            reject(new Error(`Error subscribing to MQTT server (${topic})`))
          }
        } else {
          logger.debug(`Successfully subscribed to MQTT server (${topic})`)
          if (!hasResolved) {
            hasResolved = true
            resolve()
          }
        }
      })
    })
    client.on('close', function () {
      logger.info('Disconnected from MQTT server')
    })
    client.on('reconnect', function () {
      logger.info('Reconnecting to MQTT server')
    })
    client.on('error', function (err) {
      logger.warn(`Error from MQTT client. Error was ${err}`)
      if (!hasResolved) {
        hasResolved = true
        reject(new Error(`Error from MQTT client. Error was ${err}`))
      }
    })
    client.on('message', async (topic, rawPayload) => {
      let payload = null
      try {
        payload = JSON.parse(Buffer.from(rawPayload).toString('utf8'))
      } catch (err) {
        logger.warn(`Error parsing payload error was ${err.message || err}`)
        return
      }

      logger.trace(`Payload: ${JSON.stringify(payload)}`)

      next(topic, payload)
    })
  })
}

export default setupMqttListener
