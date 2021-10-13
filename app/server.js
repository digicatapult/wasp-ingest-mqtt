const express = require('express')
const bodyParser = require('body-parser')
const pinoHttp = require('pino-http')

const startMessagePipeline = require('./messagePipeline')
const { PORT } = require('./env')
const {
  validateToken,
  Errors: { AuthServiceError },
} = require('./authService')
const logger = require('./logger')

const { jwtFormat, subjectFormat, topicFormat } = require('./formats')

async function createHttpServer() {
  const app = express()
  const requestLogger = pinoHttp({ logger })

  app.use((req, res, next) => {
    if (req.path !== '/health') requestLogger(req, res)
    next()
  })

  app.use(
    bodyParser.json({
      type: 'application/json',
      strict: false, // strict false as /user is passed null
    })
  )

  app.get('/health', async (req, res) => {
    res.status(200).send({ status: 'ok' })
  })

  const getJWT = (req) => {
    const tokenRaw = req.headers.authorization || ''
    const tokenMatch = jwtFormat(tokenRaw)
    const token = (tokenMatch && tokenMatch[1]) || null
    return token
  }

  app.post('/user', async (req, res) => {
    logger.trace('USER HEADERS: %j', req.headers)
    logger.trace('USER BODY: %j', req.body)

    const token = getJWT(req)
    if (!token) {
      res.status(401).send({ Ok: false, Error: 'Invalid Token' })
      return
    }

    try {
      await validateToken({ token })
    } catch (err) {
      if (err instanceof AuthServiceError && err.code === 401) {
        res.status(401).send({ Ok: false, Error: 'Invalid token' })
        return
      }

      res.status(500).send({ Ok: false, Error: 'Internal service error' })
      return
    }

    res.status(200).send({ Ok: true })
  })

  app.post('/acl', async (req, res) => {
    logger.trace('ACL HEADERS: %j', req.headers)
    logger.trace('ACL BODY: %j', req.body)

    const token = getJWT(req)
    // if there's no token error Unauthenticated
    if (!token) {
      res.status(401).send({ Ok: false, Error: `Invalid Token` })
      return
    }

    // if this isn't a write request to a topic error Unauthorised
    if (!req.body || req.body.acc !== 2) {
      res.status(403).send({ Ok: false, Error: `Invalid Operation` })
      return
    }

    // if the topic doesn't match out pattern error Unauthorised
    const parseTopic = topicFormat(req.body.topic)
    if (!parseTopic) {
      res.status(403).send({ Ok: false, Error: `Invalid Operation` })
      return
    }

    const [, topicSubjectId] = parseTopic

    try {
      // parse the token this will throw is the response from Auth service is not a 2XX
      const parsedToken = await validateToken({ token })

      // if the token has no sub claim then error Unauthorised
      let { sub: subject } = parsedToken
      if (!subject) {
        res.status(403).send({ Ok: false, Error: `Invalid Operation` })
        return
      }

      // if the subject in the token is not formatted as that of a thing error Unauthorised
      const parseSubject = subjectFormat(subject)
      if (!parseSubject) {
        res.status(403).send({ Ok: false, Error: `Invalid Operation` })
        return
      }

      // if the topic doesn't match our pattern error Unauthorised
      const [, tokenSubjectType, tokenSubjectId] = parseSubject
      if (tokenSubjectType !== 'thing' || tokenSubjectId !== topicSubjectId) {
        res.status(403).send({ Ok: false, Error: `Invalid subject id for topic` })
        return
      }
    } catch (err) {
      // if the auth service threw a 401 then error Unauthenticated. Other unexpected throws are internal server error
      if (err instanceof AuthServiceError && err.code === 401) {
        res.status(401).send({ Ok: false, Error: 'Invalid token' })
      } else {
        res.status(500).send({ Ok: false, Error: 'Internal service error' })
      }
    }

    // if all checks pass then success 👍
    res.status(200).send({ Ok: true })
  })

  // Sorry - app.use checks arity
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err.status) {
      res.status(err.status).send({ error: err.status === 401 ? 'Unauthorised' : err.message })
    } else {
      logger.error('Fallback Error %j', err.stack)
      res.status(500).send('Fatal error!')
    }
  })

  await startMessagePipeline()

  return { app }
}

/* istanbul ignore next */
async function startServer() {
  try {
    const { app } = await createHttpServer()

    const setupGracefulExit = ({ sigName, server, exitCode }) => {
      process.on(sigName, async () => {
        server.close(() => {
          process.exit(exitCode)
        })
      })
    }

    const server = await new Promise((resolve, reject) => {
      let resolved = false
      const server = app.listen(PORT, (err) => {
        if (err) {
          if (!resolved) {
            resolved = true
            reject(err)
          }
        }
        logger.info(`Listening on port ${PORT} `)
        if (!resolved) {
          resolved = true
          resolve(server)
        }
      })
      server.on('error', (err) => {
        if (!resolved) {
          resolved = true
          reject(err)
        }
      })
    })

    setupGracefulExit({ sigName: 'SIGINT', server, exitCode: 0 })
    setupGracefulExit({ sigName: 'SIGTERM', server, exitCode: 143 })
  } catch (err) {
    logger.fatal('Fatal error during initialisation: %j', err)
    process.exit(1)
  }
}

module.exports = { startServer, createHttpServer }
