'use strict';

var debug = require('debug')('pkdemo:lib:broadcaster')

var db = require('./db')
var vkapi = require('./vkapi')

var Message = db.models.Message
var Batch = db.models.Batch
var Player = db.models.Player

/**
 * @namespace
 * @memberof pkdemo.lib
 */
var broadcaster = module.exports = {}

/**
 * Whether the broadcaster isn't busy and is ready to send next message.
 * @type boolean
 */
broadcaster.ready = false

/**
 * Sending interval.
 * @type number
 */
broadcaster.interval = Math.ceil(1000 / 3)

/**
 * Maximum batch size.
 * @type number
 */
broadcaster.batchSize = 100

/**
 * Starts the broadcaster. Checks is there is unprocessed messages left in DB
 * and starts to process them (if any).
 * @param {function} cb
 */
broadcaster.start = function (cb) {
    broadcaster.nextMessage(function (err, message) {
        if (!message) { broadcaster.ready = true; cb(null); return }
        debug('Recovering from message #%s', message._id)
        broadcaster.send(message)
        cb(null)
    })
}

/**
 * Checks if there is a next message in the queue and it's ready to be processed.
 * @param {function} cb
 */
broadcaster.nextMessage = function (cb) {
    Message.findOne(function (err, message) {
        if (err) { cb(err); return }
        if (!message || !message.ready) { cb(null, null); return }
        cb(null, message)
    })
}

/**
 * Sends the message. When finished, automatically checks if there is another
 * message to be sent.
 * @param {object} message
 */
broadcaster.send = function (message) {
    // Unset `ready` flag.
    broadcaster.ready = false
    debug('Broadcasting message #%s.', message._id)
    // Stream the message's batches.
    var stream = Batch.find({message: message._id}).stream()
    stream.on('data', function (batch) {
        stream.pause()
        vkapi.sendMessage(batch.players.join(','), batch.text, function () {
            // Delete processed batch and resume after `interval`.
            batch.remove(function (err, batch) {
                debug('Batch #%s/%s sent.', message._id, batch._id)
                setTimeout(function () {
                    stream.resume()
                }, broadcaster.interval)
            })

        })
    })
    stream.on('end', function () {
        // All batches were processed - delete the message.
        message.remove(function (err, message) {
            debug('Message #%s sent.', message._id)
            // Check if there is another message in the queue.
            broadcaster.nextMessage(function (err, message) {
                if (!message) {
                    // No messages - restore `ready` flag and wait.
                    broadcaster.ready = true
                    debug('Queue is empty. Waiting.')
                    return
                }
                // Send the message.
                debug('Next message found.')
                broadcaster.send(message)
            })
        })
    })
}

/**
 * Adds a new message to the queue. If the broadcaster isn't buys right now,
 * starts to broadcast the message.
 * @param {string} template Message template.
 * @param {function} cb
 */
broadcaster.schedule = function (template, cb) {
    // Save the message to DB.
    var message = new Message({template: template})
    message.save(function (err, message) {
        if (err) { cb(err); return }
        debug('Message #%s saved.', message._id)
        var isSimpleMessage = !message.template.match(/%name%/)
        var players = []
        var prevName = ''
        var createBatch = function (cb) {
            var batch = new Batch({
                message: message.id,
                players: players,
                // TODO: Cache templates by player name.
                text: isSimpleMessage ? message.template : message.template.replace('%name%', prevName)
            })
            batch.save(function () {
                debug('Batch #%s:%s saved.', message._id, batch._id)
                cb()
            })
        }
        // Stream players.
        var stream = Player.find().sort({first_name: 1}).lean().stream()
        stream.on('data', function (player) {
            stream.pause()
            if (!prevName) { prevName = player.first_name}
            // Check if the batch end isn't reached yet.
            if (
                players.length < broadcaster.batchSize &&
                (isSimpleMessage || player.first_name === prevName)
            ) {
                // Add the player to the batch.
                players.push(player.vk_id)
                stream.resume()
            } else {
                // Save the batch and start a new one.
                createBatch(function () {
                    players = [player.vk_id]
                    prevName = player.first_name
                    stream.resume()
                })
            }
        })
        stream.on('end', function () {
            var next = function (cb) {
                // Set the message's `ready` flag.
                message.set('ready', true)
                message.save(function (err, message) {
                    if (err) { cb(err); return }
                    debug('Message #%s scheduled.', message._id)
                    // Start broadcasting if the broadcaster isnt busy.
                    if (broadcaster.ready) { broadcaster.send(message) }
                    cb(null, message)
                })
            }

            // Check if there are players left in the last batch.
            if (!players.length) { next(cb); return }
            createBatch(function (err) {
                if (err) { cb(err); return }
                next(cb)
            })
        })
    })
}

