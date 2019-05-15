const sendNotification = (() => {
  const timeout = 1000 / 3
  let calledAt = null
  /**
   * @param {Array<Number>} ids
   * @param {String} text
   */
  return async (ids, text) => {
    if (!ids || !ids.length || ids.length > 100 || !text) {
      throw mkErr(3, 'Invalid data')
    }
    const now = Date.now()
    if (calledAt && now - calledAt < timeout) throw mkErr(1, 'Too frequently')
    calledAt = now
    return Promise.resolve(ids)
  }
})()

const mkErr = (code, description) => {
  return Object.assign(new Error(description), { code, description })
}

module.exports = {
  sendNotification
}
