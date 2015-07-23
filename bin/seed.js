#!/usr/bin/env node
'use strict';

var async = require('async')
var crypto = require('crypto')
var mongodb = require('mongoose/node_modules/mongodb')
var settings = require('../settings.json')

/**
 * @namespace
 * @memberof pkdemo.bin
 */
var seed = module.exports = {}

/**
 * Refills players collection with random data.
 */
seed.run = function (cb) {
    var argv = process.argv
    if (argv.length < 3) { seed.usage(); cb(null); return }
    var total = Number(argv[2])

    mongodb.MongoClient.connect(settings.db.uri, function (err, db) {
        if (err) { cb(err); return }
        var players = db.collection('players')
        players.drop(function (err) {
            if (err) { cb(err); return }
            var i = 1;
            async.whilst(function () {
                return i < total + 1
            }, function (cb) {
                var player = {vk_id: i, first_name: seed.randomName(i) }
                players.insert(player, function () {
                    if (i % 10000 === 0) { console.log(i) }
                    i += 1
                    cb(null)
                })
            }, function (err) {
                if (err) { cb(err); return }
                cb(null, total)
            })
        })
    })
}

/**
 * Generates a random players name.
 * @returns {string}
 */
seed.randomName = function (src) {
    return crypto.createHash('md5').update('' + src + Date.now()).digest('hex')
}

/**
 * Displays usage information.
 */
seed.usage = function () {
    console.log('Usage: ./seed.js <players>')
    console.log('<players> - number of player records to be generated.')
}

if (require.main === module) {
    seed.run(function (err, total) {
        if (err) {
            console.error(err.stack || err)
            process.exit(1)
            return
        }
        console.log(total + ' player records created.')
        process.exit(0)
    })
}
