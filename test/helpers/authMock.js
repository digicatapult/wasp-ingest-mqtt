import { before, after } from 'mocha'
import express from 'express'

import env from '../../app/env.js'

const { AUTH_SERVICE_PORT, AUTH_ROUTE } = env

const tokenResponses = {
  validToken: { status: 200, result: { sub: 'thing/574bd77c-4aba-4557-aa9e-066939f938cc' } },
  invalidToken: { status: 401, result: {} },
  serverBroken: { status: 500, result: {} },
  noSubject: { status: 200, result: {} },
  invalidSubject: { status: 200, result: { sub: '574bd77c-4aba-4557-aa9e-066939f938cc' } },
  wrongSubject: { status: 200, result: { sub: 'user/574bd77c-4aba-4557-aa9e-066939f938cc' } },
}

const tokenPrefix = 'Bearer '

const setupAuthMock = (context) => {
  before(async function () {
    const app = express()

    app.get(`/${AUTH_ROUTE}`, async (req, res) => {
      const authorization = req.headers.authorization
      if (!authorization || !authorization.startsWith(tokenPrefix)) {
        res.status(401).send()
        return
      }

      const { status, result } = tokenResponses[authorization.slice(tokenPrefix.length)]
      res.status(status).send(result)
    })

    await new Promise((resolve, reject) => {
      const server = app.listen(AUTH_SERVICE_PORT, (err) => {
        context.thingsServer = server
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      })
    })
  })

  after(function () {
    return new Promise((resolve, reject) => {
      context.thingsServer.close((err) => {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      })
    })
  })
}

export { setupAuthMock }
