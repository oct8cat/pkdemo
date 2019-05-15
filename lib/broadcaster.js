const R = require('ramda')
const debug = require('./debug')
const vkapi = require('./vkapi')
const { interval, batchSize, logPath } = require('../settings')
const log = require('fs').createWriteStream(logPath, { flags: 'a' })

const mkBroadcaster = (db) => {
  const broadcaster = {}
  broadcaster.model = db.model.bind(db)
  broadcaster.isPreparing = false
  broadcaster.isSending = false
  broadcaster.start = start(broadcaster)
  broadcaster.middleware = middleware(broadcaster)
  return broadcaster
}

const middleware = (broadcaster) => async (req, res, next) => {
  const template = req.body.template || req.query.template
  if (!template) return res.sendStatus(400)
  const message = await addMessage(broadcaster, template)
  res.send({ message })
}

const start = (broadcaster) => async () => {
  const unpreparedMessage = await getUnpreparedMessage(broadcaster)
  if (unpreparedMessage) prepareMessage(broadcaster, unpreparedMessage)
  const preparedMessage = await getPreparedMessage(broadcaster)
  if (preparedMessage) sendMessage(broadcaster, preparedMessage)
}

const addMessage = async (broadcaster, template) => {
  const isSimple = !template.match(/\{name\}/)
  const message = await broadcaster
    .model('Message')
    .create({ template, isSimple })
  prepareMessage(broadcaster, message)
}

const prepareMessage = async (broadcaster, message) => {
  if (broadcaster.isPreparing) return
  debug(`preparing message ${message.id}`)
  broadcaster.isPreparing = true
  await broadcaster.model('Batch').deleteMany({ message: message.id }) // XXX
  const cursor = broadcaster
    .model('Player')
    .find()
    .lean()
    .batchSize(batchSize)
    .cursor()
  let players = []
  let player
  const keys = message.isSimple ? ['vk_id'] : ['vk_id', 'first_name']
  while ((player = await cursor.next())) {
    players.push(R.pick(keys, player))
    if (players.length === batchSize) {
      await createBatches(broadcaster, message, players)
      players = []
    }
  }
  if (players.length) await createBatches(broadcaster, message, players)
  message.set({ isPrepared: true })
  await message.save()
  broadcaster.isPreparing = false
  debug(`message ${message.id} prepared`)
  sendMessage(broadcaster, message)
  const nextMessage = await getUnpreparedMessage(broadcaster)
  if (nextMessage) prepareMessage(broadcaster, nextMessage)
}

const sendMessage = async (broadcaster, message) => {
  if (broadcaster.isSending) return
  broadcaster.isSending = true
  debug(`sending message ${message.id}`)
  const cursor = broadcaster
    .model('Batch')
    .find({ message: message._id })
    .cursor()
  let batch
  while ((batch = await cursor.next())) {
    const ids = await vkapi.sendNotification(batch.players, batch.text) // XXX
    logBatch(batch, ids)
    await batch.remove()
    await new Promise((resolve) => setTimeout(resolve, interval))
  }
  await message.remove()
  debug(`message ${message.id} sent`)
  const nextMessage = await getPreparedMessage(broadcaster)
  broadcaster.isSending = false
  if (nextMessage) sendMessage(broadcaster, nextMessage)
}

const createBatches = async (broadcaster, message, players) => {
  let inputs
  if (message.isSimple) {
    inputs = [
      {
        message: message.id,
        players: R.pluck('vk_id', players),
        text: message.template
      }
    ]
  } else {
    const playersByName = R.groupBy(R.prop('first_name'), players)
    inputs = R.map(
      (name) => ({
        message: message.id,
        players: R.pluck('vk_id', playersByName[name]),
        text: message.template.replace('{name}', name)
      }),
      R.keys(playersByName)
    )
  }
  const batches = await broadcaster.model('Batch').create(inputs)
  R.forEach((b) => debug(`batch ${b.message}:${b.id} created`), batches)
}

const logBatch = (batch, ids) => {
  const t = new Date().toISOString()
  const msgs = R.map((id) => `${t}: "${batch.text}" sent to player ${id}`, ids)
  log.write(msgs.join('\n') + '\n')
}

const getUnpreparedMessage = (broadcaster) => {
  return broadcaster
    .model('Message')
    .findOne({ isPrepared: false })
    .sort('createdAt')
}

const getPreparedMessage = (broadcaster) => {
  return broadcaster
    .model('Message')
    .findOne({ isPrepared: true })
    .sort('createdAt')
}

module.exports = {
  mkBroadcaster
}
