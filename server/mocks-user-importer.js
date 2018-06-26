'use strict';
const Async = require('async');
const Boom = require('boom');
const Config = require('../config');
const Joi = require('joi');
const fs = require('fs');

// const AuthAttempt = server.plugins['hapi-mongo-models'].AuthAttempt;
// const Session = server.plugins['hapi-mongo-models'].Session;
// const User = server.plugins['hapi-mongo-models'].User;
// const Account = server.plugins['hapi-mongo-models'].Account;

// A tool to import mocks users form old mocks db
console.log('Starting mocks users importer...');

function createUser(){
    console.log("createUser");
    // read the json file


}

require('readline')
    .createInterface({
        input:      fs.createReadStream('users-file.json'),
        output:     process.stdout,
        terminal:   false
    }).on('line', line => {
	    let obj = JSON.parse(line);
        console.log(obj)
    })

// var obj = JSON.parse(fs.readFileSync('users-file.json', 'utf8'));
// fs.readFile('users-file.json', 'utf8', function (err, data) {
//     if (err) throw err;
//     var parsedJSON = JSON.parse(data);
//     parsedJSON.forEach( function( val, index ){
//         console.log('Inserting user: ' + val['_id']);
//     })
// });
