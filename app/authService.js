import fetch from 'node-fetch'

import env from './env.js'
import logger from './logger.js'

const { AUTH_SERVICE_HOST, AUTH_SERVICE_PORT, AUTH_ROUTE } = env

class AuthServiceError extends Error {
  constructor({ code, message }) {
    super(message)
    this.code = code
  }
}

const apiPrefix = `http://${AUTH_SERVICE_HOST}:${AUTH_SERVICE_PORT}`

const validateToken = async ({ token }) => {
  const url = `${apiPrefix}/${AUTH_ROUTE}`

  logger.debug(`Validating token using POST ${url}`)

  const response = await fetch(url, {
    method: 'get',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  })

  logger.debug(`Fetch ${url} returned response ${response.status}`)

  if (!response.ok) {
    if (response.status !== 401) {
      logger.warn(
        `Error validating token using auth service (${url}). Error was (${response.status}) ${response.statusText}`
      )
    }
    throw new AuthServiceError({ code: response.status, message: response.statusText })
  }

  const responseText = await response.text()
  if (responseText) {
    const result = JSON.parse(responseText)
    logger.trace(`Token details were: %j`, result)
    return result
  }
}

export { AuthServiceError, validateToken }
