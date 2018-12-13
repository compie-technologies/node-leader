/**
 * Created by Amit Landau on 12/13/18
 */

'use strict';

const {Leader, EVENT_TYPE} = require('./lib/leader');
Leader.event = EVENT_TYPE;

module.exports = Leader;