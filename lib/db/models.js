'use strict';

var mongoose = require('mongoose')

/**
 * @namespace
 * @memberof pkdemo.lib.db
 */
var models = module.exports = {}

models.Message = mongoose.model('Message', new mongoose.Schema({
    template: {type: 'String', required: true},
    ready: {type: 'Boolean', required: true, default: false}
}))

models.Player = mongoose.model('Player', new mongoose.Schema({
    vk_id: {type: 'Number', required: true},
    first_name: {type: 'String', required: true}
}))

models.Batch = mongoose.model('Batch', new mongoose.Schema({
    message: {type: 'ObjectId', ref: 'Message'},
    players: {type: ['Number']},
    text: {type: 'String', required: true}
}))
