/* global window */
'use strict';
const ApiActions = require('../../../actions/api');
const Constants = require('./constants');
const Store = require('./store');


class Actions {

    // static sendRequest(data) {
    //
    //     ApiActions.post(
    //         '/api/signup2',
    //         data,
    //         Store,
    //         Constants.REGISTER,
    //         Constants.REGISTER_RESPONSE,
    //         (err, response) => {
    //
    //             if (!err) {
    //                 window.location.href = '/account';
    //             }
    //         }
    //     );
    // }

    // TODO: Repeted code: this is also in actions in the accounts/settions/actions.js
    // Code could be shared
    static getDetails() {

        ApiActions.get(
            '/api/accounts/my',
            undefined,
            Store,
            Constants.GET_DETAILS,
            Constants.GET_DETAILS_RESPONSE
        );
    }

    static saveDetails(data) {

        ApiActions.put(
            '/api/accounts/my',
            data,
            Store,
            Constants.SAVE_DETAILS,
            Constants.SAVE_DETAILS_RESPONSE
        );
    }

    static hideDetailsSaveSuccess() {

        Store.dispatch({
            type: Constants.HIDE_DETAILS_SAVE_SUCCESS
        });
    }

    static getUser() {

        ApiActions.get(
            '/api/users/my',
            undefined,
            Store,
            Constants.GET_USER,
            Constants.GET_USER_RESPONSE
        );
    }

    static saveUser(data) {

        ApiActions.put(
            '/api/users/my',
            data,
            Store,
            Constants.SAVE_USER,
            Constants.SAVE_USER_RESPONSE
        );
    }
};


module.exports = Actions;
