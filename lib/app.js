const express = require('express')
const bodyParser = require('body-parser')

const mkApp = (broadcaster) => {
  const app = express()
  app.use('/send', bodyParser.json(), broadcaster.middleware)
  return app
}

module.exports = {
  mkApp
}
