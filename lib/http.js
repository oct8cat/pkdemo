'use strict';

var express = require('express')
var bodyParser = require('body-parser')
var broadcaster = require('./broadcaster')

/**
 * @namespace
 * @memberof pkdemo.lib
 */
var http = module.exports = {}

/**
 * Creates a new `express` web-application.
 * @returns {object}
 */
http.createApp = function () {
    var app = express()

    app.post('/send', bodyParser.urlencoded({extended: true}), function (req, res, next) {
        if (!req.body.template) { res.status(400).end(); return }
        broadcaster.schedule(req.body.template, function (err, message) {
            if (err) { console.error(err) }
        })
        res.status(200).end()
    })

    return app
}
