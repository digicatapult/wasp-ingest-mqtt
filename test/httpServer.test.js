import { describe, before, it } from 'mocha'
import { expect } from 'chai'

import { setupMockServer } from './helpers/server.js'

describe('health', function () {
  const context = {}
  setupMockServer(context)

  before(async function () {
    context.response = await context.request.get('/health')
  })

  it('should return 200', function () {
    expect(context.response.status).to.equal(200)
  })

  it('should return success', function () {
    expect(context.response.body).to.deep.equal({ status: 'ok' })
  })
})
