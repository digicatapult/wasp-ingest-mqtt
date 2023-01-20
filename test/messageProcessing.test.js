import { describe, before, after, it } from 'mocha'
import { expect } from 'chai'

import { setupServer } from './helpers/server.js'
import { setupAuthMock } from './helpers/authMock.js'

import createPub from './helpers/pub.js'
import createSub from './helpers/sub.js'

import env from '../app/env.js'

describe('Message Processing', function () {
  const context = {}
  let sub = null
  setupServer(context)
  setupAuthMock(context)

  before(async function () {
    this.timeout(40000)
    sub = await createSub()
  })

  after(async function () {
    this.timeout(5000)
    await sub.disconnect()
  })

  describe('happy path', function () {
    let messages = null
    before(async function () {
      sub.resetMessages()
      const pub = await createPub({ username: 'jwt_validToken', password: 'N/A' })
      await pub.publish({ topic: 'things/574bd77c-4aba-4557-aa9e-066939f938cc/messages', message: { answer: 42 } })
      messages = await sub.waitForMessages({ expectedMessages: 1 })
    })

    it('should forward message', function () {
      expect(messages.length).to.equal(1)

      const message = messages[0]
      expect(message.topic).to.equal(env.KAFKA_PAYLOAD_TOPIC)
      expect(message.key).to.equal('574bd77c-4aba-4557-aa9e-066939f938cc')

      const { payloadId, timestamp, ...otherMessageProps } = message.message
      expect(payloadId).to.match(/^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$/)
      const now = new Date().getTime()
      expect(new Date(timestamp).getTime()).to.be.within(now - 1000, now + 1000)
      expect(otherMessageProps).to.deep.equal({
        ingest: env.WASP_INGEST_NAME,
        ingestId: '574bd77c-4aba-4557-aa9e-066939f938cc',
        payload: { answer: 42 },
        metadata: {
          deviceId: '574bd77c-4aba-4557-aa9e-066939f938cc',
        },
      })
    })
  })

  const authErrorTest = ({ name, username }) => {
    describe(`auth error (${name})`, function () {
      let error = null
      before(async function () {
        sub.resetMessages()
        try {
          await createPub({ username, password: 'N/A' })
        } catch (err) {
          error = err
        }
      })

      it('error with unauthorized', function () {
        expect(error.message).to.equal('Connection refused: Not authorized')
      })
    })
  }

  authErrorTest({ name: 'invalid token', username: 'jwt_invalidToken' })
  authErrorTest({ name: 'non jwt user', username: 'invalidToken' })

  const aclErrorTest = ({ name, username }) => {
    describe(`acl error (${name})`, function () {
      let messages = null
      before(async function () {
        sub.resetMessages()
        const pub = await createPub({ username, password: 'N/A' })
        await pub.publish({ topic: 'things/574bd77c-4aba-4557-aa9e-066939f938cd/messages', message: { answer: 42 } })
        messages = await sub.waitForMessages({ expectedMessages: 0, waitForExcessMessagesMS: 500 })
      })

      it('should not forward messages', function () {
        expect(messages.length).to.equal(0)
      })
    })
  }

  aclErrorTest({ name: 'no subject', username: 'jwt_noSubject' })
  aclErrorTest({ name: 'invalid subject', username: 'jwt_invalidSubject' })
  aclErrorTest({ name: 'wrong subject type', username: 'jwt_wrongSubject' })
})
