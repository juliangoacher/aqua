'use strict';
const Constants = require('../constants');
const ObjectAssign = require('object-assign');
const ParseValidation = require('../../../../helpers/parse-validation');


const initialState = {
    hydrated: false,
    loading: false,
    showSaveSuccess: false,
    error: undefined,
    hasError: {},
    help: {},
    name: {
        first: '',
        middle: '',
        last: ''
    },
    details: {
        dateOfBirth: '',
        location: '',
        ethnicity: '',
        cycle: '',
        exam: '',
        userType: ''
    },
    subjects: ''
};
const reducer = function (state = initialState, action) {

    console.log("REDUCER. actions.type:")
    console.log(action.type)
    if (action.type === Constants.GET_DETAILS) {
        return ObjectAssign({}, state, {
            loading: true,
            hydrated: false
        });
    }

    if (action.type === Constants.GET_DETAILS_RESPONSE) {
        const validation = ParseValidation(action.response);
        console.log('GET_DETAILS_RESPONSE')
        console.log(action.response);

        return ObjectAssign({}, state, {
            loading: false,
            hydrated: true,
            error: validation.error,
            hasError: validation.hasError,
            help: validation.help,
            name: action.response.name,
            details: action.response.details,
            subjects: action.response.subjects
        });
    }

    if (action.type === Constants.SAVE_DETAILS) {
        return ObjectAssign({}, state, {
            loading: true,
            name: action.request.data.name,
        });
    }

    // jl comment: the details and subjects has been added so after the
    // element saves the fields update NOTE: This may not be required
    if (action.type === Constants.SAVE_DETAILS_RESPONSE) {
        const validation = ParseValidation(action.response);
        const stateUpdates = {
            loading: false,
            showSaveSuccess: !action.err,
            error: validation.error,
            hasError: validation.hasError,
            help: validation.help,
            details: action.response.details,
            subjects: action.response.subjects
        };

        if (action.response.hasOwnProperty('name')) {
            stateUpdates.name = action.response.name;
        }

        return ObjectAssign({}, state, stateUpdates);
    }

    if (action.type === Constants.HIDE_DETAILS_SAVE_SUCCESS) {
        return ObjectAssign({}, state, {
            showSaveSuccess: false
        });
    }

    return state;
};


module.exports = reducer;
