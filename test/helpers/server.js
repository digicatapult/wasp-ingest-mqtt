import { before, after } from 'mocha'
import request from 'supertest'

import env from '../../app/env.js'
import { createHttpServer } from '../../app/server.js'

let server = null
const setupMockServer = async (context) => {
  before(async function () {
    this.timeout(10000)
    if (!server) {
      server = await createHttpServer()
    }
    context.request = request(server.app)
  })
}

const setupServer = async (context) => {
  before(async function () {
    this.timeout(10000)
    if (!server) {
      server = await createHttpServer()
    }

    let resolved = false
    return new Promise((resolve, reject) => {
      context.server = server.app.listen(env.PORT, (err) => {
        if (!resolved) {
          resolved = true
          if (err) {
            reject(err)
          } else {
            resolve()
          }
        }
      })
    })
  })

  after(async function () {
    this.timeout(5000)
    return new Promise((resolve) => {
      context.server.close(() => {
        resolve()
      })
    })
  })
}

export { setupMockServer, setupServer }
