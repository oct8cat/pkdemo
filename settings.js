module.exports = {
  dbUrl: 'mongodb://localhost:27017/pkdemo',
  batchSize: 100,
  interval: 400,
  logPath: require('path').resolve(__dirname, 'pkdemo.log'),
  testNames: ['alice', 'bob', 'carol']
}
