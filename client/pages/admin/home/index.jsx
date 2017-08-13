'use strict';
const Actions = require('./actions');
const React = require('react');
const Moment = require('moment');
const Store = require('./store');

class HomePage extends React.Component {

    constructor(props) {

        super(props);

        Actions.getResults();

        this.state = {
            results : []
        }
    }

    componentDidMount() {
        console.log("componentDidMount")
        this.unsubscribeStore = Store.subscribe(this.onStoreChange.bind(this));
        //this.interval = setInterval(this.refreshTime.bind(this), 1000);
    }

    componentWillReceiveProps(nextProps) {
        console.log("componentWillReceiveProps")
        Actions.getResults(query);
    }

    onStoreChange() {
        console.log("onStoreChange");
        this.setState(Store.getState());
        console.log(Store.getState())
    }
    // getUsers() {
    //     Actions.getResults("", function(err, response){
    //         console.log('callback')
    //         console.log(response)
    //     });
    //     console.log("return")
    //     return {
    //         total       : 0,
    //         active      : 0,
    //         facebook    : 0
    //     }
    // }

    render() {
        console.log('RENDER: this.props')
        //console.log(this.props)
        console.log('here')
        console.log(this.state.results.data)
        var data = this.state.results.data || [];
        //var total = this.state.results.data;
        console.log('total is : ' + data.length)
        var total = data.length;
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

                                    </div>
                                    <div className="stat-label">ACTIVE USERS</div>
                                </div>
                            </div>
                            <div className="col-sm-4">
                                <div className="well text-center">
                                    <div className="stat-value">

                                    </div>
                                    <div className="stat-label">FACEBOOK USERS</div>
                                </div>
                            </div>

                        </div>
                    </div>
                    <div className="col-sm-5 text-center">
                        <h1 className="page-header">Throttle guage</h1>
                        <i className="fa fa-dashboard bamf"></i>
                    </div>
                </div>
            </section>
        );
    }
}


module.exports = HomePage;
