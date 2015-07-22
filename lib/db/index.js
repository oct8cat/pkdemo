'use strict';

var mongoose = require('mongoose')

/**
 * @namespace
 * @memberof pkdemo.lib
 */
var db = module.exports = {}

/**
 * Opens database connection.
 */
db.connect = function () {
    return mongoose.connect.apply(mongoose, arguments)
}

db.models = require('./models')
