'use strict';
const Async = require('async');
const Bcrypt = require('bcrypt');
const Boom = require('boom');
const Config = require('../../config');
const Joi = require('joi');
const fs = require('fs');

const internals = {};



internals.applyRoutes = function (server, next) {

    const AuthAttempt = server.plugins['hapi-mongo-models'].AuthAttempt;
    const Session = server.plugins['hapi-mongo-models'].Session;
    const User = server.plugins['hapi-mongo-models'].User;
    const Account = server.plugins['hapi-mongo-models'].Account;

    // server.auth.strategy('twitter', 'bell', {
    //   provider: 'twitter',
    //   password: 'secret_cookie_encryption_password', //Use something more secure in production
    //   clientId: '6EaarqQZEeA4mm9c1HmxTWi2M',
    //   clientSecret: '50u0anumuO3fdk083NVmGThIslmsFz6LcdRJ7n91M5CnshHKEK',
    //   isSecure: false //Should be set to true (which is the default) in production
    // });

    function importMocksUsers(request, reply, callback){
        console.log('importMocksUsers...')
        const mailer = request.server.plugins.mailer;

        // Read the users file and import them
        require('readline')
            .createInterface({
                input:      fs.createReadStream('users-file.json'),
                output:     process.stdout,
                terminal:   false
            }).on('line', line => {
        	    let obj = JSON.parse(line);
                console.log(obj)
            })
    }

    /**
    * Create a facebook user/account in aqua: When user auth with facebook a newUser
    *  Account and User are created in db.
    *  The account has a flag isFacebookUser set to true, also an object with the
    *  full facebook profile in stored (may be useful at a later point)
    **/
    function createFacebookAccount(request, reply){
        const mailer = request.server.plugins.mailer;
        const facebookProfile =  request.auth.credentials.profile;

        // Use the email in the facebook account as the username (unique in facebook)
        const username = facebookProfile.email;
        const password = '';
        const email = facebookProfile.email;
        const name = facebookProfile.raw.name;

        Async.auto({
            user: function (done) {
                console.log('create user...')

                User.create(username, password, email, done);
            },
            account: ['user', function (results, done) {
                console.log('create account...')

                Account.create(name, done);
            }],
            linkUser: ['account', function (results, done) {

                console.log('link user...')
                const id = results.account._id.toString();
                const update = {
                    $set: {
                        user: {
                            id: results.user._id.toString(),
                            name: results.user.username,
                        },
                        isFacebookUser: true,
                        facebookProfile: facebookProfile
                    }
                };

                Account.findByIdAndUpdate(id, update, done);
            }],
            linkAccount: ['account', function (results, done) {

                console.log('link account...')

                const id = results.user._id.toString();
                const update = {
                    $set: {
                        roles: {
                            account: {
                                id: results.account._id.toString(),
                                name: results.account.name.first + ' ' + results.account.name.last,
                            }
                        },
                        isFacebookAccount: true
                    }
                };

                User.findByIdAndUpdate(id, update, done);
            }],
            welcome: ['linkUser', 'linkAccount', function (results, done) {

                console.log('welcome...')

                const emailOptions = {
                    subject: 'Your ' + Config.get('/projectName') + ' account',
                    to: {
                        name: name,
                        address: email
                    }
                };
                const template = 'welcome';

                mailer.sendEmail(emailOptions, template, request.payload, (err) => {

                    if (err) {
                        console.warn('sending welcome email failed:', err.stack);
                    }
                });

                done();
            }],
            session: ['linkUser', 'linkAccount', function (results, done) {

                console.log('session...')

                Session.create(results.user._id.toString(), done);
            }]
        }, (err, results) => {

            if (err) {
                return reply(err);
            }

            const user = results.linkAccount;
            const credentials = user.username + ':' + results.session.key;
            const authHeader = 'Basic ' + new Buffer(credentials).toString('base64');
            const result = {
                user: {
                    _id: user._id,
                    username: user.username,
                    email: user.email,
                    roles: user.roles
                },
                session: results.session,
                authHeader
            };

            request.cookieAuth.set(result);
            //reply(result);
            reply.redirect('/account/details');
        });
    }

    //---- ROUTES

    server.route({
        method: 'POST',
        path: '/login',
        config: {
            validate: {
                payload: {
                    username: Joi.string().lowercase().required(),
                    password: Joi.string().required()
                }
            },
            pre: [{
                assign: 'abuseDetected',
                method: function (request, reply) {

                    const ip = request.info.remoteAddress;
                    const username = request.payload.username;

                    AuthAttempt.abuseDetected(ip, username, (err, detected) => {

                        if (err) {
                            return reply(err);
                        }

                        if (detected) {
                            return reply(Boom.badRequest('Maximum number of auth attempts reached. Please try again later.'));
                        }

                        reply();
                    });
                }
            }, {
                assign: 'user',
                method: function (request, reply) {

                    const username = request.payload.username;
                    const password = request.payload.password;

                        User.findByCredentials(username, password, (err, user) => {

                        if (err) {
                            return reply(err);
                        }

                        reply(user);
                    });
                }
            }, {
                assign: 'logAttempt',
                method: function (request, reply) {

                    if (request.pre.user) {
                        return reply();
                    }

                    const ip = request.info.remoteAddress;
                    const username = request.payload.username;

                    AuthAttempt.create(ip, username, (err, authAttempt) => {

                        if (err) {
                            return reply(err);
                        }

                        return reply(Boom.badRequest('Username and password combination not found or account is inactive.'));
                    });
                }
            }, {
                assign: 'session',
                method: function (request, reply) {

                    Session.create(request.pre.user._id.toString(), (err, session) => {

                        if (err) {
                            return reply(err);
                        }

                        return reply(session);
                    });
                }
            }]
        },
        handler: function (request, reply) {

            const credentials = request.pre.session._id.toString() + ':' + request.pre.session.key;
            const authHeader = 'Basic ' + new Buffer(credentials).toString('base64');

            const result = {
                user: {
                    _id: request.pre.user._id,
                    username: request.pre.user.username,
                    email: request.pre.user.email,
                    roles: request.pre.user.roles
                },
                session: request.pre.session,
                authHeader
            };

            console.log('result:')

            request.cookieAuth.set(result);
            reply(result);
        }
    });

    server.route({
        method: ['GET', 'POST'],            // Must handle both GET and POST
        path: '/import-mocks-users',            // The callback endpoint registered with the provider
        handler: function(request, reply) {
            console.log('server/api/login.json GET/POST /import-mocks-users');
            importMocksUsers( function(){
                reply('importMocksUser completed');
            });
        }
    })
    server.route({
        method: ['GET', 'POST'],            // Must handle both GET and POST
        path: '/login-facebook',            // The callback endpoint registered with the provider
        config: {
            auth: {
                mode: 'try',
                strategy: 'facebook',
            }
        },
        handler: function(request, reply) {
            console.log('server/api/login.js  GET/POST /login-facebook');

            if (!request.auth.isAuthenticated) {
                return reply({ err : 'Authentication failed due to: ' + request.auth.error.message });
            }

            const mailer = request.server.plugins.mailer;
            const facebookProfile =  request.auth.credentials.profile;

            // We use the email as the username, assuming emails in faceebook account are unique (an email is only used in a single account)
            // TODO contact name + surname
            const username = facebookProfile.email;

            Async.auto({
                user: function(done){
                    console.log('Check if fb user exists...')
                    User.findByUsername(username, (err, user) => {

                            if (err) {
                                console.log('error: ' + err);
                                done(err);
                            }

                            if (!user) {
                                // if facebook user doesn't exist, create account in system
                                return createFacebookAccount(request, reply);
                            }else{
                                // if user exist, then create a session and ad the cookie
                                done(err, user);
                            }
                        }
                    );
                },
                session: ['user', function(results, done){
                    console.log('create session....')
                    console.log(results)
                    console.log('THE USER ID: ' + results.user._id.toString())
                    Session.create(results.user._id.toString(), done);
                }],
                cookie: ['user', 'session', function(results, done){
                    console.log(results)
                    console.log('create cookie...');
                    const credentials = results.session._id.toString() + ':' + results.session.key;
                    const authHeader = 'Basic ' + new Buffer(credentials).toString('base64');

                    const result = {
                        user: {
                            _id: results.user._id,
                            username: results.user.username,
                            email: results.user.email,
                            roles: results.user.roles
                        },
                        session: results.session,
                        authHeader
                    };

                    request.cookieAuth.set(result);
                    reply.redirect('/account');
                }]

            });


            // Create an Hapi session TODO: Replace with inserting in the db
            const userId = username.id;
            // Session.create(userId.toString(), (err, session) => {
            //
            //     console.log('*****session created!')
            //     console.log(session)
            //
            //     if (err) {
            //         return reply(err);
            //     }
            //
            //     const credentials = userId + ':' + session.key;
            //     const authHeader = 'Basic ' + new Buffer(credentials).toString('base64');
            //
            //     const result = {
            //         user: {
            //             _id: userId,
            //             username: username.username || username.displayName || name.firts + " " + name.last,
            //             email: username.email,
            //             roles: ''
            //         },
            //         session: session,
            //         authHeader
            //     };
            //
            //     console.log('Session created! The sesssion result is: ')
            //     console.log(result);
            //
            //     // Set the session object
            //     request.cookieAuth.set(result);
            //
            //     return reply(result);
            //     //return reply.redirect('/login');
            //     //return reply.redirect('/')
            //     //return reply.redirect('/account');
            // });

        }
    });

    server.route({
        method: 'POST',
        path: '/login/forgot',
        config: {
            validate: {
                payload: {
                    email: Joi.string().email().lowercase().required()
                }
            },
            pre: [{
                assign: 'user',
                method: function (request, reply) {

                    const conditions = {
                        email: request.payload.email
                    };

                    User.findOne(conditions, (err, user) => {

                        if (err) {
                            return reply(err);
                        }

                        if (!user) {
                            return reply({ success: true }).takeover();
                        }

                        reply(user);
                    });
                }
            }]
        },
        handler: function (request, reply) {

            const mailer = request.server.plugins.mailer;

            Async.auto({
                keyHash: function (done) {

                    Session.generateKeyHash(done);
                },
                user: ['keyHash', function (results, done) {

                    const id = request.pre.user._id.toString();
                    const update = {
                        $set: {
                            resetPassword: {
                                token: results.keyHash.hash,
                                expires: Date.now() + 10000000
                            }
                        }
                    };

                    User.findByIdAndUpdate(id, update, done);
                }],
                email: ['user', function (results, done) {

                    const emailOptions = {
                        subject: 'Reset your ' + Config.get('/projectName') + ' password',
                        to: request.payload.email
                    };
                    const template = 'forgot-password';
                    const context = {
                        baseHref: Config.get('/baseUrl') + '/login/reset',
                        email: results.user.email,
                        key: results.keyHash.key
                    };

                    mailer.sendEmail(emailOptions, template, context, done);
                }]
            }, (err, results) => {

                if (err) {
                    return reply(err);
                }

                reply({ success: true });
            });
        }
    });


    server.route({
        method: 'POST',
        path: '/login/reset',
        config: {
            validate: {
                payload: {
                    key: Joi.string().required(),
                    email: Joi.string().email().lowercase().required(),
                    password: Joi.string().required()
                }
            },
            pre: [{
                assign: 'user',
                method: function (request, reply) {

                    const conditions = {
                        email: request.payload.email,
                        'resetPassword.expires': { $gt: Date.now() }
                    };

                    User.findOne(conditions, (err, user) => {

                        if (err) {
                            return reply(err);
                        }

                        if (!user) {
                            return reply(Boom.badRequest('Invalid email or key.'));
                        }

                        reply(user);
                    });
                }
            }]
        },
        handler: function (request, reply) {

            Async.auto({
                keyMatch: function (done) {

                    const key = request.payload.key;
                    const token = request.pre.user.resetPassword.token;
                    Bcrypt.compare(key, token, done);
                },
                passwordHash: ['keyMatch', function (results, done) {

                    if (!results.keyMatch) {
                        return reply(Boom.badRequest('Invalid email or key.'));
                    }

                    User.generatePasswordHash(request.payload.password, done);
                }],
                user: ['passwordHash', function (results, done) {

                    const id = request.pre.user._id.toString();
                    const update = {
                        $set: {
                            password: results.passwordHash.hash
                        },
                        $unset: {
                            resetPassword: undefined
                        }
                    };

                    User.findByIdAndUpdate(id, update, done);
                }]
            }, (err, results) => {

                if (err) {
                    return reply(err);
                }

                reply({ success: true });
            });
        }
    });

    next();
};


exports.register = function (server, options, next) {

    server.dependency(['mailer', 'hapi-mongo-models'], internals.applyRoutes);

    next();
};


exports.register.attributes = {
    name: 'login'
};
