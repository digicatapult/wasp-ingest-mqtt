import mqtt from 'mqtt'

import env from '../../app/env.js'

const createPub = async (options) => {
  const mqttClient = mqtt.connect(env.MQTT_ENDPOINT, options)

  const publish = ({ topic, message }) => {
    return new Promise((resolve, reject) => {
      mqttClient.publish(topic, JSON.stringify(message), (err) => {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      })
    })
  }

  let hasResolved = false
  return new Promise((resolve, reject) => {
    mqttClient.on('connect', () => {
      if (!hasResolved) {
        hasResolved = true
        resolve({
          publish,
          disconnect: async () => {
            mqttClient.end()
          },
        })
      }
    })
    mqttClient.on('error', (err) => {
      if (!hasResolved) {
        mqttClient.end()
        reject(err)
      }
    })
  })
}

export default createPub
