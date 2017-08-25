'use strict';
const Footer = require('./footer.jsx');
const Home = require('./home/index.jsx');
const Navbar = require('./navbar.jsx');
const NotFound = require('./not-found.jsx');
const React = require('react');
const ReactRouter = require('react-router-dom');
const Settings = require('./settings/index.jsx');
const Details = require('./details/index.jsx');

const Route = ReactRouter.Route;
const Router = ReactRouter.BrowserRouter;
const Switch = ReactRouter.Switch;


const App = (
    <Router>
        <div>
            <Route component={Navbar} />
            <Switch>
                <Route path="/account" exact component={Home} />
                <Route path="/account/settings" exact component={Settings} />
                <Route path="/account/details" exact component={Details} />

                <Route component={NotFound} />
            </Switch>
            <Footer />
        </div>
    </Router>
);


module.exports = App;
