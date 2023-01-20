import { v4 as uuidV4 } from 'uuid'
import env from '../env.js'

import { topicFormat } from '../formats.js'

const { WASP_INGEST_NAME } = env

const setupParser = (next) => {
  return (topic, payload) => {
    let result = topicFormat(topic)
    if (!result) {
      throw new Error(`Invalid ID format in topic: ${topic}`)
    }
    const hardwareSerial = result[1]
    const payloadId = uuidV4()

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

export default setupParser
