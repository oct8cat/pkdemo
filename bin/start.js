const { dbUrl } = require('../settings')
const {
  db: { mkDb },
  app: { mkApp },
  broadcaster: { mkBroadcaster }
} = require('..')

const main = async () => {
  const db = mkDb()
  const broadcaster = mkBroadcaster(db)
  const app = mkApp(broadcaster)
  const port = process.env.PORT || 3000

  await db.connect(dbUrl)
  await broadcaster.start()
  await app.start(port)
}

if (require.main === module) main()
