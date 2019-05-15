const { dbUrl, testNames } = require('../settings')
const {
  db: { mkDb }
} = require('..')

const main = async () => {
  if (process.argv.length < 3) return usage()
  const total = +process.argv[2]

  const db = mkDb()
  const Player = db.model('Player')

  await db.connect(dbUrl)
  await Player.deleteMany({})
  for (let i = 0; i < total; i += 1) {
    const name = testNames[Math.floor(Math.random() * testNames.length)]
    await Player.create({ vk_id: i, first_name: name })
  }
  const count = await Player.countDocuments()
  console.log(`${count} players created`)
  await db.disconnect()
}

const usage = () => {
  console.log('Usage: generate-players.js <players>')
  console.log('<players> - number of player records to be generated.')
}

if (require.main === module) main()
