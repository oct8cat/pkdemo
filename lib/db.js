const { Mongoose } = require('mongoose')

const mkDb = () => {
  const db = new Mongoose()
  db.set('useNewUrlParser', true)
  db.set('useCreateIndex', true)

  const Message = new db.Schema({
    template: { type: 'String', required: true },
    isPrepared: { type: 'Boolean', required: true, default: false },
    isSimple: { type: 'Boolean', required: true },
    createdAt: { type: 'Date', required: true, default: () => new Date() }
  })
  db.model('Message', Message)

  const Player = new db.Schema({
    vk_id: { type: 'Number' },
    first_name: { type: 'String' }
  })
  db.model('Player', Player)

  const Batch = new db.Schema({
    message: { type: 'ObjectId' },
    players: { type: ['Number'] },
    text: { type: 'String' }
  })
  db.model('Batch', Batch)

  return db
}

module.exports = {
  mkDb
}
