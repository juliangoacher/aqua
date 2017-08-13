/* global window */
'use strict';
const ApiActions = require('../../../actions/api');
const Constants = require('./constants');
const Store = require('./store');
const Qs = require('qs');

class Actions {

	static getResults(data, callback) {

        ApiActions.get(
            '/api/users',
            data,
            Store,
            Constants.GET_RESULTS,
            Constants.GET_RESULTS_RESPONSE,
			callback
        );
    }
}

module.exports = Actions;
