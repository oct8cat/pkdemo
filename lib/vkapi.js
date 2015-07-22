'use strict';

var winston = require('winston')

/**
 * @namespace
 * @memberof pkdemo.lib
 */
var vkapi = module.exports = {}

/**
 * Logger instance.
 * @type object
 */
vkapi.logger = new (winston.Logger)({
    transports: [
        new (winston.transports.File)({filename: 'vkapi.log'})
    ]
})

/**
 *
 */
vkapi.sendMessage = function (ids, text, cb) {
    setTimeout(function () {
        ids.split(',').forEach(function (id) {
            vkapi.logger.info('"%s" sent to player #%s', text, id)
        })
        cb()
    }, 1)
}
