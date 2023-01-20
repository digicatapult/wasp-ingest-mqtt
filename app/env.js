import envalid from 'envalid'
import dotenv from 'dotenv'

if (process.env.NODE_ENV === 'test') {
  dotenv.config({ path: 'test/test.env' })
} else {
  dotenv.config()
}

const options = { strict: true }

const vars = envalid.cleanEnv(
  process.env,
  {
    SERVICE_TYPE: envalid.str({ default: 'wasp-ingest-mqtt'.toUpperCase().replace(/-/g, '_') }),
    LOG_LEVEL: envalid.str({
      default: 'info',
      devDefault: 'debug',
      choices: ['trace', 'debug', 'info', 'warn', 'error', 'fatal'],
    }),
    PORT: envalid.port({ default: 80, devDefault: 3000 }),
    KAFKA_LOG_LEVEL: envalid.str({
      default: 'nothing',
      choices: ['debug', 'info', 'warn', 'error', 'nothing'],
    }),
    AUTH_ROUTE: envalid.str({ default: 'v1/auth' }),
    MQTT_ENDPOINT: envalid.str({
      devDefault: 'mqtt://localhost:1883',
    }),
    MQTT_USERNAME: envalid.str({ devDefault: 'development' }),
    MQTT_PASSWORD: envalid.str({ devDefault: 'development_key' }),
    KAFKA_BROKERS: envalid.makeValidator((input) => {
      const kafkaSet = new Set(input === '' ? [] : input.split(','))
      if (kafkaSet.size === 0) throw new Error('At least one kafka broker must be configured')
      return [...kafkaSet]
    })({ default: ['localhost:9092'] }),
    KAFKA_PAYLOAD_TOPIC: envalid.str({ default: 'raw-payloads' }),
    WASP_INGEST_NAME: envalid.str({ default: 'mqtt' }),
    AUTH_SERVICE_HOST: envalid.host({ default: 'wasp-authentication-service' }),
    AUTH_SERVICE_PORT: envalid.port({ default: 80 }),
  },
  options
)

export default vars
