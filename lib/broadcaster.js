const debug = require('debug')('pkdemo:broadcaster')
const vkapi = require('./vkapi')

const INTERVAL = Math.ceil(1000 / 3)
const BATCH_SIZE = 100

const mkBroadcaster = (db) => {
  const broadcaster = {}
  broadcaster.db = db
  broadcaster.ready = false
  broadcaster.getNextMessage = getNextMessage.bind(null, broadcaster)
  broadcaster.sendMessage = sendMessage.bind(null, broadcaster)
  broadcaster.queueMessage = queueMessage.bind(null, broadcaster)
  broadcaster.start = start.bind(null, broadcaster)
  broadcaster.middleware = mkMiddleware(broadcaster)
  return broadcaster
}

const start = async (broadcaster) => {
  const message = await broadcaster.getNextMessage()
  if (message) {
    debug('Recovering from message #%s', message._id)
    broadcaster.sendMessage(message)
  } else {
    debug('No messages in the queue. Waiting.')
    broadcaster.ready = true
  }
}

const getNextMessage = async (broadcaster) => {
  const message = await broadcaster.db.model('Message').findOne()
  return message && message.ready ? message : null
}

const sendMessage = (broadcaster, message) => {
  broadcaster.ready = false
  debug('Broadcasting message #%s.', message._id)
  // Stream the message's batches.
  const cursor = broadcaster.db
    .model('Batch')
    .find({ message: message._id })
    .cursor()
  cursor.on('data', async (batch) => {
    // Send message to batch players
    cursor.pause()
    await vkapi.sendMessage(batch.players.join(','), batch.text)
    await batch.remove()
    setTimeout(() => cursor.resume(), INTERVAL)
    debug('Batch #%s/%s sent.', message._id, batch._id)
  })
  cursor.on('end', async () => {
    // All batches were sent - delete the message.
    await message.remove()
    // Check if there is another message in the queue.
    const nextMessage = await broadcaster.getNextMessage()
    if (nextMessage) {
      // Send the message.
      debug('Next message found.')
      broadcaster.sendMessage(nextMessage)
    } else {
      // No messages - restore `ready` flag and wait.
      broadcaster.ready = true
      debug('Queue is empty. Waiting.')
    }
  })
}

const queueMessage = async (broadcaster, template) => {
  const model = broadcaster.db.model.bind(broadcaster.db)
  // Save the message to DB.
  const message = await model('Message').create({ template })
  debug('Message #%s saved.', message._id)
  const isSimpleMessage = !message.template.match(/\{name\}/)
  let players = []
  let prevName = ''
  const saveBatch = async () => {
    // TODO: Cache compiled templates by player name.
    const text = isSimpleMessage
      ? message.template
      : message.template.replace('{name}', prevName)
    const batch = await model('Batch').create({
      message: message.id,
      players,
      text
    })
    debug('Batch #%s:%s saved.', message._id, batch._id)
  }
  // Stream players.
  const cursor = model('Player')
    .find()
    .sort({ first_name: 1 })
    .lean()
    .cursor()
  cursor.on('data', async (player) => {
    cursor.pause()
    if (!prevName) prevName = player.first_name
    // Check if the batch end isn't reached yet.
    if (
      players.length < BATCH_SIZE &&
      (isSimpleMessage || player.first_name === prevName)
    ) {
      // Add the player to the batch.
      players.push(player.vk_id)
    } else {
      // Save the batch and start a new one.
      await saveBatch()
      players = [player.vk_id]
      prevName = player.first_name
    }
    cursor.resume()
  })
  cursor.on('end', async () => {
    if (players.length) await saveBatch()
    // Set the message's `ready` flag.
    message.set('ready', true)
    await message.save()
    debug('Message #%s scheduled.', message._id)
    // Start broadcasting if the broadcaster isnt busy.
    if (broadcaster.ready) broadcaster.sendMessage(message)
  })
}

const mkMiddleware = (broadcaster) => async (req, res, next) => {
  const template = req.body.template || req.query.template
  if (!template) return res.sendStatus(400)
  await broadcaster.queueMessage(req.body.template)
  res.sendStatus(200)
}

module.exports = {
  mkBroadcaster
}
