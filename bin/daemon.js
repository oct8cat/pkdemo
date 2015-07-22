#!/usr/bin/env node
'use strict';

var debug = require('debug')('pkdemo:bin:daemon')
var settings = require('../settings.json')
var lib = require('../lib')

var PORT = process.env.PORT || 3000

/**
 * @namespace
 * @memberof pkdemo.bin
 */
var daemon = module.exports = {}

daemon.run = function (cb) {
    lib.db.connect(settings.db.uri, function (err) {
        if (err) { cb(err); return }
        lib.http.createApp().listen(PORT, function () {
            lib.broadcaster.start(cb)
        })
    })
}

if (require.main === module) {
    daemon.run(function (err) {
        if (err) {
            console.error(err.stack || err)
            process.exit(1)
            return
        }
        debug('Now running.')
    })
}
