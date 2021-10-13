const uuid = require('uuid')
const { WASP_INGEST_NAME } = require('../env')

const { topicFormat } = require('../formats')

const setupParser = (next) => {
  return (topic, payload) => {
    let result = topicFormat(topic)
    if (!result) {
      throw new Error(`Invalid ID format in topic: ${topic}`)
    }
    const hardwareSerial = result[1]
    const payloadId = uuid.v4()

    next({
      ingestId: hardwareSerial,
      payload: JSON.stringify({
        payloadId,
        ingest: WASP_INGEST_NAME,
        ingestId: hardwareSerial,
        timestamp: new Date().toISOString(),
        payload: payload,
        metadata: {
          deviceId: hardwareSerial,
        },
      }),
    })
  }
}

module.exports = setupParser
