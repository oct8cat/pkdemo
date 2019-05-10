const { Mongoose } = require('mongoose')

const mkDb = () => {
  const db = new Mongoose()
  db.set('useNewUrlParser', true)
  db.set('useCreateIndex', true)

  const Message = new db.Schema({
    template: { type: 'String', required: true },
    ready: { type: 'Boolean', required: true, default: false }
  })
  db.model('Message', Message)

  const Player = new db.Schema({
    vk_id: { type: 'Number', required: true, unique: true },
    first_name: { type: 'String', required: true }
  })
  db.model('Player', Player)

  const Batch = new db.Schema({
    message: { type: 'ObjectId', ref: 'Message' },
    players: { type: ['Number'] },
    text: { type: 'String', required: true }
  })
  db.model('Batch', Batch)

  return db
}

module.exports = {
  mkDb
}
