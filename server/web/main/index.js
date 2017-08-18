'use strict';
const React = require('react');
const ReactDomServer = require('react-dom/server');
const ReactHelmet = require('react-helmet');
const ReactRouter = require('react-router-dom');

const internals = {};
const StaticRouter = ReactRouter.StaticRouter;


internals.routeHandler = function (request, reply) {

    const routerState = {};
    const routerProps = {
        location: request.url.path,
        context: routerState
    };
    const AppUniversal = require('../../../client/pages/main/app-universal.jsx');
    const AppEl = React.createElement(AppUniversal);
    const App = React.createElement(StaticRouter, routerProps, AppEl);
    const markup = ReactDomServer.renderToString(App);
    const helmet = ReactHelmet.Helmet.renderStatic(); // leaks if not called after render

    if (routerState.url) {
        return reply().redirect(routerState.url).code(routerState.code);
    }

    const response = reply.view('main/index', {
        helmet,
        markup,
        state: request.app.state
    });

    if (routerState.code) {
        response.code(routerState.code);
    }

    if (request.app.headers) {
        Object.keys(request.app.headers).forEach((key) => {

            response.header(key, request.app.headers[key]);
        });
    }
};


internals.applyRoutes = function (server, next) {

    // server.auth.strategy('facebook', 'bell' , {
    //         provider: 'facebook',
    //         password: 'cookie_encryption_password_secure',
    //         isSecure: false,
    //         // You'll need to go to https://developers.facebook.com/ and set up a
    //         // Website application to get started
    //         // Once you create your app, fill out Settings and set the App Domains
    //         // Under Settings >> Advanced, set the Valid OAuth redirect URIs to include http://<yourdomain.com>/bell/door
    //         // and enable Client OAuth Login
    //         clientId: '115199272474609',
    //         clientSecret: '1ad8608299b69d88215da228fa4286f4',
    //         location: server.info.uri
    //     });

    server.route({
        method: 'GET',
        path: '/{glob*}',
        handler: internals.routeHandler
    });

   //  server.route({
   //      method: 'GET',
   //      path: '/login-facebook',
   //      config: {
   //      // Use the 'oauth' auth strategy to allow bell to handle the oauth flow.
   //      auth: 'oauth',
   //      handler: function loginHandler(request, reply) {
   //          console.log('handler login-facebook')
   //          // Here we take the profile that was kindly pulled in
   //          // by bell and set it to our cookie session.
   //          // This will set the cookie during the redirect and
   //          // log them into your application.
   //          request.auth.session.set(request.auth.credentials.profile);
   //
   //          // User is now logged in, redirect them to their account area
   //          return reply.redirect('/my-account');
   //      }
   // }
   //  });

    server.route({
        method: 'GET',
        path: '/login/{glob*}',
        config: {
            auth: {
                mode: 'try',
                strategy: 'session'
            },
            plugins: {
                'hapi-auth-cookie': {
                    redirectTo: false
                },
                'bell': {
                }
            }
        },
        handler: function (request, reply) {
            console.log("HANDLER: params.glob: " + request.params.glob)
            if (request.params.glob !== 'logout' &&
                request.auth.isAuthenticated) {

                if (request.auth.credentials.user.roles.admin) {
                    return reply.redirect('/admin');
                }

                return reply.redirect('/account');
            }

            if (!request.auth.isAuthenticated) {
                request.app.headers = {
                    'x-auth-required': true
                };
            }

            internals.routeHandler(request, reply);
        }
    });


    next();
};


exports.register = function (server, options, next) {

    server.dependency(['auth', 'hapi-mongo-models'], internals.applyRoutes);

    next();
};


exports.register.attributes = {
    name: 'web/main'
};
