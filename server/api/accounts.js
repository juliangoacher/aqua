'use strict';
const Async = require('async');
const AuthPlugin = require('../auth');
const Boom = require('boom');
const EscapeRegExp = require('escape-string-regexp');
const Joi = require('joi');

var stripe = require("stripe")(process.env.STRIPE_SECRET);


const internals = {};


internals.applyRoutes = function (server, next) {

    const Account = server.plugins['hapi-mongo-models'].Account;
    const User = server.plugins['hapi-mongo-models'].User;
    const Status = server.plugins['hapi-mongo-models'].Status;


    server.route({
        method: 'GET',
        path: '/accounts',
        config: {
            auth: {
                strategy: 'session',
                scope: 'admin'
            },
            validate: {
                query: {
                    username: Joi.string().allow(''),
                    fields: Joi.string(),
                    sort: Joi.string().default('_id'),
                    limit: Joi.number().default(20),
                    page: Joi.number().default(1)
                }
            }
        },
        handler: function (request, reply) {

            const query = {};
            if (request.query.username) {
                query['user.name'] = new RegExp('^.*?' + EscapeRegExp(request.query.username) + '.*$', 'i');
            }
            const fields = request.query.fields;
            const sort = request.query.sort;
            const limit = request.query.limit;
            const page = request.query.page;

            Account.pagedFind(query, fields, sort, limit, page, (err, results) => {

                if (err) {
                    return reply(err);
                }

                reply(results);
            });
        }
    });


    server.route({
        method: 'GET',
        path: '/accounts/{id}',
        config: {
            auth: {
                strategy: 'session',
                scope: 'admin'
            }
        },
        handler: function (request, reply) {

            Account.findById(request.params.id, (err, account) => {

                if (err) {
                    return reply(err);
                }

                if (!account) {
                    return reply(Boom.notFound('Document not found.'));
                }

                reply(account);
            });
        }
    });


    server.route({
        method: 'GET',
        path: '/accounts/my',
        config: {
            auth: {
                strategy: 'session',
                scope: 'account'
            }
        },
        handler: function (request, reply) {

            const id = request.auth.credentials.roles.account._id.toString();
            const fields = Account.fieldsAdapter('user name timeCreated details subjects notes status accountPlan stripe');

            Account.findById(id, fields, (err, account) => {

                if (err) {
                    return reply(err);
                }

                if (!account) {
                    return reply(Boom.notFound('Document not found. That is strange.'));
                }

                reply(account);
            });
        }
    });


    server.route({
        method: 'POST',
        path: '/accounts',
        config: {
            auth: {
                strategy: 'session',
                scope: 'admin'
            },
            validate: {
                payload: {
                    name: Joi.string().required()
                }
            }
        },
        handler: function (request, reply) {

            const name = request.payload.name;

            Account.create(name, (err, account) => {

                if (err) {
                    return reply(err);
                }

                reply(account);
            });
        }
    });


    server.route({
        method: 'PUT',
        path: '/accounts/{id}',
        config: {
            auth: {
                strategy: 'session',
                scope: 'admin'
            },
            validate: {
                payload: {
                    name: Joi.object().keys({
                        first: Joi.string().required(),
                        middle: Joi.string().allow(''),
                        last: Joi.string().required()
                    }).required()
                }
            }
        },
        handler: function (request, reply) {

            const id = request.params.id;
            const update = {
                $set: {
                    name: request.payload.name
                }
            };

            Account.findByIdAndUpdate(id, update, (err, account) => {

                if (err) {
                    return reply(err);
                }

                if (!account) {
                    return reply(Boom.notFound('Document not found.'));
                }

                reply(account);
            });
        }
    });


    server.route({
        method: 'PUT',
        path: '/accounts/my',
        config: {
            auth: {
                strategy: 'session',
                scope: 'account'
            },
            validate: {
                payload: {
                    name: Joi.object().keys({
                        first: Joi.string().required(),
                        middle: Joi.string().allow(''),
                        last: Joi.string().required()
                    }).required()
                }
            }
        },
        handler: function (request, reply) {

            const id = request.auth.credentials.roles.account._id.toString();
            const update = {
                $set: {
                    name: request.payload.name
                }
            };
            const findOptions = {
                fields: Account.fieldsAdapter('user name timeCreated')
            };

            Account.findByIdAndUpdate(id, update, findOptions, (err, account) => {

                if (err) {
                    return reply(err);
                }

                reply(account);
            });
        }
    });

    // JL: Added to test adding additional mocks data
    server.route({
        method: 'PUT',
        path: '/accounts/my/mocks',
        config: {
            auth: {
                strategy: 'session',
                scope: 'account'
            },
            validate: {
                payload: {
                    details: Joi.object().keys({
                        dateOfBirth: Joi.string().allow(''),
                        location: Joi.string().allow(''),
                        ethnicity: Joi.string().allow(''),
                        cycle: Joi.string().allow(''),
                        exam: Joi.string().allow(''),
                        userType: Joi.string().allow('')
                    }).required(),
                    subjects: Joi.string().allow('')
                }
            }
        },
        handler: function (request, reply) {
            console.log('***server/api/accounts.js /accounts/my/mocks');

            const id = request.auth.credentials.roles.account._id.toString();
            const update = {
                $set: {
                    details: request.payload.details,
                    subjects: request.payload.subjects
                }
            };
            const findOptions = {
                fields: Account.fieldsAdapter('user timeCreated details subjects')
            };
            console.log('--> update:')
            console.log(update);

            Account.findByIdAndUpdate(id, update, findOptions, (err, account) => {
                console.log('(RETURN) account is:')
                console.log(account)

                if (err) {
                    return reply(err);
                }

                reply(account);
            });
        }
    });

    // jloriente: added to support stripe payments
    server.route({
        method: 'PUT',
        path: '/accounts/plan/subscribe',
        config: {
            auth: {
                strategy: 'session',
                scope: 'account'
            },
            validate: {
                payload: {
                    email: Joi.string().allow(''),
                    plan: Joi.string().required(),
                    token: Joi.string().allow(''),
                    stripeCustomerId: Joi.string().allow('')
                }
            }
        },
        handler: function (request, reply) {
            console.log('***server/api/accounts.js /accounts/stripe PUT');

            // jloriente:
            // if token is received then means it's a new customer with a new card (used the elements to get token in UI)
            // if source then means it's stripe customer, not need to create user.
            var plan = request.payload.plan;
            var email = request.payload.email;      // used for new customers
            var token = request.payload.token;
            var stripeCustomerId = request.payload.stripeCustomerId;

            console.log('/account/plan/subscribe email %s plan %s token: %s stripeCustomerId %s', email, plan, token, stripeCustomerId );

            // callback function takes a full stripeCustomer object to update the db
            function addSubscriptionToCustomer ( stripeCustomer) {
                console.log('addSubscriptionToCustomer. Customer object:')
                console.log(stripeCustomer)
                // YOUR CODE: Save the customer ID and other info in a database for later.
                return stripe.subscriptions.create({
                    customer: stripeCustomer.id,
                    items: [{plan: plan}],
                }).then( function( subscription ){
                    console.log("subscription created!");
                    console.log(subscription);

                    const id = request.auth.credentials.roles.account._id.toString();
                    // Set the status to account premium
                    const update = {
                        $set: {
                            status: {
                                current: {
                                    id: 'account-premium'
                                }
                            },
                            accountPlan : plan,
                            stripe: {
                                customer: stripeCustomer,
                                subscription: subscription
                            }
                        }
                    };
                    const findOptions = {
                        fields: Account.fieldsAdapter('user timeCreated details subjects accountPlan stripe')
                    };
                    console.log('--> update account with stripe info...')
                    console.log(update);

                    Account.findByIdAndUpdate(id, update, findOptions, (err, account) => {
                        console.log('Account updated with new subscription.')
                        console.log(account)

                        if (err) {
                            console.log(err);
                            return reply(Boom.notFound('Document not found.'));
                        }

                        reply(account);
                    });
                },
                function(error){
                    console.log(error)
                    if (error) {
                        // TODO: error just return a generic server error
                        // how to return also err msg from stripe?
                        // next line won't work as expected and stripeError is not in response
                        //error.stripeError = error.stack;
                        //return reply(error.stack);
                        return reply(Boom.notFound('Error creating a Stripe customer.'));
                    }
                })
            }
            // only create if customer doesn't exist, check if customer alread exists?

            // check if stripeCustomer already exist for that email (or token)

            if ( stripeCustomerId ){
                console.log('CustomerId is already a stripe customer. StripeCustomerId: ' + stripeCustomerId);
                // if it's already a stripe customer: retrieve the stripe customer info, then add the customer to subscriptions
                stripe.customers.retrieve(
                    stripeCustomerId
                ).then( addSubscriptionToCustomer );
            }else{
                // if is a new stripe customer: create a new stripe customer, then add the customer to subscription
                stripe.customers.create({
                    email: email,
                    source: token,
                }).then( addSubscriptionToCustomer, function(err){
                    if (err) {
                        return reply(Boom.notFound('Error adding Stripe Subscription to customer.'));
                    }
                });
            }
        }
    });

    // jloriente: added to support stripe payments
    server.route({
        method: 'PUT',
        path: '/accounts/plan/unsubscribe',
        config: {
            auth: {
                strategy: 'session',
                scope: 'account'
            },
            validate: {
                payload: {
                    stripeCustomerId: Joi.string().required(),
                    stripeSubscriptionId: Joi.string().required()
                }
            }
        },
        handler: function (request, reply) {
            console.log('***server/api/accounts.js /accounts/plan/unsubscribe PUT');

            var stripeSubscriptionId = request.payload.stripeSubscriptionId;
            var stripeCustomerId = request.payload.stripeCustomerId;
            
            
            function removeSubscriptionFromCustomer ( stripeCustomer) {
                console.log('removeSubscriptionFromCustomer. Customer object:')
                console.log(stripeCustomer)
                
                return stripe.subscriptions.del( stripeSubscriptionId ).then( function( subscription ){
                    console.log('Subscrpition has been deleted. New subscription info:');
                    console.log(subscription);
                    
                    const id = request.auth.credentials.roles.account._id.toString();
                    // Set the status to account free (because it has been cancelled)
                    const update = {
                        $set: {
                            status: {
                                current: {
                                    id: 'account-free'
                                }
                            },
                            accountPlan : 'acccount-free',
                            stripe: {
                                subscription: subscription
                            }
                        }
                    };
                    const findOptions = {
                        fields: Account.fieldsAdapter('user timeCreated details subjects accountPlan stripe')
                    };
                    console.log('--> update account with stripe info...')
                    console.log(update);
                    
                    Account.findByIdAndUpdate(id, update, findOptions, (err, account) => {
                        console.log('Account updated with new subscription (unsuscribed)')
                        console.log(account)
                    
                        if (err) {
                            console.log(err);
                            return reply(Boom.notFound('Document not found.'));
                        }
                    
                        reply(account);
                    });
                }, 
                function( error ){
                    console.log(error)
                    if (error) {
                    
                        return reply(Boom.notFound('Error deleting subscription'));
                    }
                })
            }
            
            // main code
            stripe.customers.retrieve(
                stripeCustomerId
            ).then( removeSubscriptionFromCustomer );
            
        }
    });
    
    server.route({
        method: 'PUT',
        path: '/accounts/{id}/user',
        config: {
            auth: {
                strategy: 'session',
                scope: 'admin'
            },
            validate: {
                payload: {
                    username: Joi.string().lowercase().required()
                }
            },
            pre: [{
                assign: 'account',
                method: function (request, reply) {

                    Account.findById(request.params.id, (err, account) => {

                        if (err) {
                            return reply(err);
                        }

                        if (!account) {
                            return reply(Boom.notFound('Document not found.'));
                        }

                        reply(account);
                    });
                }
            }, {
                assign: 'user',
                method: function (request, reply) {

                    User.findByUsername(request.payload.username, (err, user) => {

                        if (err) {
                            return reply(err);
                        }

                        if (!user) {
                            return reply(Boom.notFound('User document not found.'));
                        }

                        if (user.roles &&
                            user.roles.account &&
                            user.roles.account.id !== request.params.id) {

                            return reply(Boom.conflict('User is already linked to another account. Unlink first.'));
                        }

                        reply(user);
                    });
                }
            }, {
                assign: 'userCheck',
                method: function (request, reply) {

                    if (request.pre.account.user &&
                        request.pre.account.user.id !== request.pre.user._id.toString()) {

                        return reply(Boom.conflict('Account is already linked to another user. Unlink first.'));
                    }

                    reply(true);
                }
            }]
        },
        handler: function (request, reply) {

            Async.auto({
                account: function (done) {

                    const id = request.params.id;
                    const update = {
                        $set: {
                            user: {
                                id: request.pre.user._id.toString(),
                                name: request.pre.user.username
                            }
                        }
                    };

                    Account.findByIdAndUpdate(id, update, done);
                },
                user: function (done) {

                    const id = request.pre.user._id;
                    const update = {
                        $set: {
                            'roles.account': {
                                id: request.pre.account._id.toString(),
                                name: request.pre.account.name.first + ' ' + request.pre.account.name.last
                            }
                        }
                    };

                    User.findByIdAndUpdate(id, update, done);
                }
            }, (err, results) => {

                if (err) {
                    return reply(err);
                }

                reply(results.account);
            });
        }
    });


    server.route({
        method: 'DELETE',
        path: '/accounts/{id}/user',
        config: {
            auth: {
                strategy: 'session',
                scope: 'admin'
            },
            pre: [{
                assign: 'account',
                method: function (request, reply) {

                    Account.findById(request.params.id, (err, account) => {

                        if (err) {
                            return reply(err);
                        }

                        if (!account) {
                            return reply(Boom.notFound('Document not found.'));
                        }

                        if (!account.user || !account.user.id) {
                            return reply(account).takeover();
                        }

                        reply(account);
                    });
                }
            }, {
                assign: 'user',
                method: function (request, reply) {

                    User.findById(request.pre.account.user.id, (err, user) => {

                        if (err) {
                            return reply(err);
                        }

                        if (!user) {
                            return reply(Boom.notFound('User document not found.'));
                        }

                        reply(user);
                    });
                }
            }]
        },
        handler: function (request, reply) {

            Async.auto({
                account: function (done) {

                    const id = request.params.id;
                    const update = {
                        $unset: {
                            user: undefined
                        }
                    };

                    Account.findByIdAndUpdate(id, update, done);
                },
                user: function (done) {

                    const id = request.pre.user._id.toString();
                    const update = {
                        $unset: {
                            'roles.account': undefined
                        }
                    };

                    User.findByIdAndUpdate(id, update, done);
                }
            }, (err, results) => {

                if (err) {
                    return reply(err);
                }

                reply(results.account);
            });
        }
    });


    server.route({
        method: 'POST',
        path: '/accounts/{id}/notes',
        config: {
            auth: {
                strategy: 'session',
                scope: 'admin'
            },
            validate: {
                payload: {
                    data: Joi.string().required()
                }
            }
        },
        handler: function (request, reply) {

            const id = request.params.id;
            const update = {
                $push: {
                    notes: {
                        data: request.payload.data,
                        timeCreated: new Date(),
                        userCreated: {
                            id: request.auth.credentials.user._id.toString(),
                            name: request.auth.credentials.user.username
                        }
                    }
                }
            };

            Account.findByIdAndUpdate(id, update, (err, account) => {

                if (err) {
                    return reply(err);
                }

                reply(account);
            });
        }
    });


    server.route({
        method: 'POST',
        path: '/accounts/{id}/status',
        config: {
            auth: {
                strategy: 'session',
                scope: 'admin'
            },
            validate: {
                payload: {
                    status: Joi.string().required()
                }
            },
            pre: [{
                assign: 'status',
                method: function (request, reply) {

                    Status.findById(request.payload.status, (err, status) => {

                        if (err) {
                            return reply(err);
                        }

                        reply(status);
                    });
                }
            }]
        },
        handler: function (request, reply) {

            const id = request.params.id;
            const newStatus = {
                id: request.pre.status._id.toString(),
                name: request.pre.status.name,
                timeCreated: new Date(),
                userCreated: {
                    id: request.auth.credentials.user._id.toString(),
                    name: request.auth.credentials.user.username
                }
            };
            const update = {
                $set: {
                    'status.current': newStatus
                },
                $push: {
                    'status.log': newStatus
                }
            };

            Account.findByIdAndUpdate(id, update, (err, account) => {

                if (err) {
                    return reply(err);
                }

                reply(account);
            });
        }
    });


    server.route({
        method: 'DELETE',
        path: '/accounts/{id}',
        config: {
            auth: {
                strategy: 'session',
                scope: 'admin'
            },
            pre: [
                AuthPlugin.preware.ensureAdminGroup('root')
            ]
        },
        handler: function (request, reply) {

            Account.findByIdAndDelete(request.params.id, (err, account) => {

                if (err) {
                    return reply(err);
                }

                if (!account) {
                    return reply(Boom.notFound('Document not found.'));
                }

                reply({ success: true });
            });
        }
    });


    next();
};


exports.register = function (server, options, next) {

    server.dependency(['auth', 'hapi-mongo-models'], internals.applyRoutes);

    next();
};


exports.register.attributes = {
    name: 'account'
};
