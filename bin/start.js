const debug = require('debug')('pkdemo:app')
const settings = require('../settings.json')
const {
  db: { mkDb },
  app: { mkApp },
  broadcaster: { mkBroadcaster }
} = require('..')

const start = async () => {
  const db = mkDb()
  const broadcaster = mkBroadcaster(db)
  const app = mkApp(broadcaster)
  const port = process.env.PORT || 3000

  await db.connect(settings.db.uri)
  await broadcaster.start()
  app.listen(port, () => debug(`App is now running on port ${port}`))
}

if (require.main === module) start()
