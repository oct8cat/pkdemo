const express = require('express')
const bodyParser = require('body-parser')

const mkApp = (broadcaster) => {
  const app = express()
  app.start = start(app)
  app.use('/send', bodyParser.json(), broadcaster.middleware)
  return app
}

const start = (app) => async (port) => {
  return new Promise((resolve, reject) => {
    app.on('error', reject).listen(port, resolve)
  })
}

module.exports = {
  mkApp
}
