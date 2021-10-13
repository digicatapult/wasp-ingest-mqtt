const { before, after } = require('mocha')
const request = require('supertest')

const env = require('../../app/env')
const { createHttpServer } = require('../../app/server')

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

module.exports = { setupMockServer, setupServer }
