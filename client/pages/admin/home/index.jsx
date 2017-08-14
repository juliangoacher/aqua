'use strict';
const Actions = require('./actions');
const React = require('react');
const Moment = require('moment');
const Store = require('./store');

class HomePage extends React.Component {

    constructor(props) {

        super(props);

        this.state = {
            results : []
        }

        // TODO: query is just called on creation, find a way to refresh when required
        // a) with timer b) every time users navigates to this screen section
        Actions.getResults();
    }

    getInitialState(){
        this.state = {
            results : {
                data : [],
                items : {}
            }
        }
    }

    componentDidMount() {
        console.log("componentDidMount")
        this.unsubscribeStore = Store.subscribe(this.onStoreChange.bind(this));
        //this.interval = setInterval(this.refreshTime.bind(this), 1000);
    }

    componentWillUnmount() {
        this.unsubscribeStore();
    }

    componentWillReceiveProps(nextProps) {
        console.log("componentWillReceiveProps")
        var query = '';
        Actions.getResults(query);
    }

    onStoreChange() {
        console.log("onStoreChange");
        console.log(Store.getState())
        this.setState(Store.getState());
    }

    render() {
        console.log('Render home - Dashboard')
        //var items = this.state.results.items || [];
        var data = this.state.results.data || [];
        console.log(data)

        var total = data.length || 0;
        console.log('Total users: ' + total)

        // filter only active users
        var activeUsers = data.filter(function(user){
            return user.isActive
        });
        var totalActive = activeUsers.length;
        console.log('Total Active users: ' + totalActive)

        return (
            <section className="section-home container">
                <div className="row">
                    <div className="col-sm-7">
                        <h1 className="page-header">Admin</h1>
                        <div className="row">
                            <div className="col-sm-4">
                                <div className="well text-center">
                                    <div className="stat-value">
                                        {total}
                                    </div>
                                    <div className="stat-label">TOTAL USERS</div>
                                </div>
                            </div>
                            <div className="col-sm-4">
                                <div className="well text-center">
                                    <div className="stat-value">
                                        {totalActive}
                                    </div>
                                    <div className="stat-label">ACTIVE USERS</div>
                                </div>
                            </div>
                            <div className="col-sm-4">
                                <div className="well text-center">
                                    <div className="stat-value">
                                        0
                                    </div>
                                    <div className="stat-label">FACEBOOK USERS</div>
                                </div>
                            </div>

                        </div>
                    </div>
                    {/*
                    <div className="col-sm-5 text-center">
                        <h1 className="page-header">Throttle guage</h1>
                        <i className="fa fa-dashboard bamf"></i>
                    </div>
                    */}
                </div>
            </section>
        );
    }
}


module.exports = HomePage;
