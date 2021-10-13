const fetch = require('node-fetch')

const { AUTH_SERVICE_HOST, AUTH_SERVICE_PORT, API_MAJOR_VERSION, AUTH_ROUTE } = require('./env')
const logger = require('./logger')

class AuthServiceError extends Error {
  constructor({ code, message }) {
    super(message)
    this.code = code
  }
}

const apiPrefix = `http://${AUTH_SERVICE_HOST}:${AUTH_SERVICE_PORT}/${API_MAJOR_VERSION}`

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

module.exports = {
  Errors: {
    AuthServiceError,
  },
  validateToken,
}
