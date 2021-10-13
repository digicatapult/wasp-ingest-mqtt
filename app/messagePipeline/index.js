const setupListener = require('./mqtt')
const setupParser = require('./parser')
const setupForwarder = require('./forwarder')

module.exports = async () => {
  // This is the order in which the message should pass along the chain
  const setupChain = [setupListener, setupParser, setupForwarder]
  // compose the promises together
  await setupChain.reverse().reduce(async (next, setup) => {
    return await setup(await next)
  }, Promise.resolve())
}
