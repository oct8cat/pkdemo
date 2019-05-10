const { createLogger, transports, format } = require('winston')
const { combine, simple, timestamp } = format
const logger = createLogger({
  transports: [new transports.File({ filename: 'vkapi.log' })],
  format: combine(timestamp(), simple())
})

const sendMessage = async (playerIds, text) => {
  playerIds.split(',').forEach((id) => {
    logger.info(`"${text}" sent to player #${id}`)
  })
}

module.exports = {
  sendMessage
}
