'use strict';
const Async = require('async');
const Boom = require('boom');
const Config = require('../config');

const internals = {};

internals.applyStrategy = function (server, next) {

    console.log('apply strategy');

    const Session = server.plugins['hapi-mongo-models'].Session;
    const User = server.plugins['hapi-mongo-models'].User;

    server.auth.strategy('session', 'cookie', {
        password: Config.get('/cookieSecret'),
        cookie: 'sid-aqua',
        isSecure: false,
        redirectTo: '/login',
        appendNext: 'returnUrl',
        validateFunc: function (request, data, callback) {

            console.log('---validateFunc');
            console.log('data.session:')
            console.log(data.session)

            Async.auto({
                session: function (done) {
                    console.log('session OK')
                    const id = data.session._id;
                    const key = data.session.key;

                    Session.findByCredentials(id, key, done);
                },
                user: ['session', function (results, done) {
                    console.log('user OK')
                    if (!results.session) {
                        return done();
                    }

                    User.findById(results.session.userId, done);
                }],
                roles: ['user', function (results, done) {
                    console.log('roles OK')
                    if (!results.user) {
                        return done();
                    }

                    results.user.hydrateRoles(done);
                }],
                scope: ['user', function (results, done) {
                    console.log('scope OK')

                    if (!results.user || !results.user.roles) {
                        return done();
                    }

                    done(null, Object.keys(results.user.roles));
                }]
            }, (err, results) => {

                if (err) {
                    console.log('****error co!: ' + err)
                    return callback(err);
                }

                if (!results.session) {
                    console.log('****there is not session!!!')
                    return callback(null, false);
                }

                callback(null, Boolean(results.user), results);
            });
        }
    });

    server.auth.strategy('facebook', 'bell' , {
            provider: 'facebook',
            password: 'cookie_encryption_password_secure',
            isSecure: false,
            //redirectTo: '/login',
            // You'll need to go to  h and set up a
            // Website application to get started
            // Once you create your app, fill out Settings and set the App Domains
            // Under Settings >> Advanced, set the Valid OAuth redirect URIs to include http://<yourdomain.com>/bell/door
            // and enable Client OAuth Login
            // TODO: Use location-testing: server.info.uri when testing locally
            clientId: '115199272474609',
            clientSecret: '1ad8608299b69d88215da228fa4286f4',
            location: 'http://locomote.sh/api/login-facebook'
    });


    // //Setup the social Twitter login strategy
    // server.auth.strategy('twitter', 'bell', {
    //   provider: 'twitter',
    //   password: 'secret_cookie_encryption_password', //Use something more secure in production
    //   clientId: '6EaarqQZEeA4mm9c1HmxTWi2M',
    //   clientSecret: '50u0anumuO3fdk083NVmGThIslmsFz6LcdRJ7n91M5CnshHKEK',
    //   isSecure: false //Should be set to true (which is the default) in production
    // });

    next();
};


internals.preware = {
    ensureNotRoot: {
        assign: 'ensureNotRoot',
        method: function (request, reply) {

            if (request.auth.credentials.user.username === 'root') {
                const message = 'Not permitted for root user.';

                return reply(Boom.badRequest(message));
            }

            reply();
        }
    },
    ensureAdminGroup: function (groups) {

        return {
            assign: 'ensureAdminGroup',
            method: function (request, reply) {

                if (Object.prototype.toString.call(groups) !== '[object Array]') {
                    groups = [groups];
                }

                const groupFound = groups.some((group) => {

                    return request.auth.credentials.roles.admin.isMemberOf(group);
                });

                if (!groupFound) {
                    const message = `Missing admin group membership to [${groups.join(' or ')}].`;

                    return reply(Boom.badRequest(message));
                }

                reply();
            }
        };
    }
};


exports.register = function (server, options, next) {

    server.dependency(['mailer', 'hapi-mongo-models'], internals.applyStrategy);

    next();
};


exports.preware = internals.preware;


exports.register.attributes = {
    name: 'auth'
};
