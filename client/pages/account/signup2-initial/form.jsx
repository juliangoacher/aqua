'use strict';
const Actions = require('./actions');
const Alert = require('../../../components/alert.jsx');
const Button = require('../../../components/form/button.jsx');
const ControlGroup = require('../../../components/form/control-group.jsx');
const React = require('react');
const Spinner = require('../../../components/form/spinner.jsx');
const Store = require('./store');
const TextControl = require('../../../components/form/text-control.jsx');
const SelectControl = require('../../../components/form/select-control.jsx');


class Form extends React.Component {
    constructor(props) {

        super(props);
        console.log(props)
        
        this.input = {};
        this.state = Store.getState();

        Actions.getDetails();
        Actions.getUser();
    }

    componentDidMount() {

        this.unsubscribeStore = Store.subscribe(this.onStoreChange.bind(this));

        if (this.input.name) {
            this.input.name.focus();
        }
    }

    componentWillUnmount() {

        this.unsubscribeStore();
    }

    onStoreChange() {

        this.setState(Store.getState());
    }

    handleSubmit(event) {

        event.preventDefault();
        event.stopPropagation();

        Actions.sendRequest({
            name: this.input.name.value(),
            username: this.input.username.value(),
            email: this.input.email.value()
        });
    }

    render() {

        console.log('-----state----')
        console.log(this.state)

        let alert = [];

        if (this.state.success) {
            alert = <Alert
                type="success"
                message="Success. Redirecting..."
            />;
        }
        else if (this.state.error) {
            alert = <Alert
                type="danger"
                message={this.state.error}
            />;
        }

        let formElements;


        if (!this.state.success) {
            formElements = <fieldset>
                <TextControl
                    name="username"
                    label="Username"
                    value={this.state.username}

                />
                <TextControl
                    value={this.state.email}
                    name="email"
                    label="Email"
                />
                <TextControl
                    value={this.state.username}
                    name="username"
                    label="Username"
                />
                <TextControl
                    ref={(c) => (this.input.dateofbirth = c)}
                    name="dateofbirth"
                    label="Date of birth"
                    disabled={this.state.loading}
                />
                <ControlGroup hideLabel={true} hideHelp={true}>
                    <SelectControl
                        name="gender"
                        label="Gender">

                        <option value="male">male</option>
                        <option value="female">female</option>
                    </SelectControl>
                </ControlGroup>
                <ControlGroup hideLabel={true} hideHelp={true}>
                    <SelectControl
                        name="gender"
                        label="Choose subjects you are interested">

                        <option value="art">Art, Craft and Design</option>
                        <option value="english">English</option>
                        <option value="design">Design</option>
                        <option value="eands">E & S Studies</option>
                    </SelectControl>
                </ControlGroup>
                <ControlGroup hideLabel={true} hideHelp={true}>
                    <SelectControl
                        name="gender"
                        label="Choose subjects you are interested">

                        <option value="art">Art, Craft and Design</option>
                        <option value="english">English</option>
                        <option value="design">Design</option>
                        <option value="eands">E & S Studies</option>
                    </SelectControl>
                </ControlGroup>
                <ControlGroup hideLabel={true} hideHelp={true}>
                    <SelectControl
                        name="gender"
                        label="Choose subjects you are interested">

                        <option value="art">Art, Craft and Design</option>
                        <option value="english">English</option>
                        <option value="design">Design</option>
                        <option value="eands">E & S Studies</option>
                    </SelectControl>
                </ControlGroup>
                <ControlGroup hideLabel={true} hideHelp={true}>
                    <Button
                        type="submit"
                        inputClasses={{ 'btn-success': true }}
                        disabled={this.state.loading}>

                        Access to Mocks
                        <Spinner space="left" show={this.state.loading} />
                    </Button>
                </ControlGroup>
            </fieldset>;
        }

        return (
            <section>
                <h1 className="page-header">Mocks signup</h1>
                <form onSubmit={this.handleSubmit.bind(this)}>
                    {alert}
                    {formElements}
                </form>
            </section>
        );
    }
}


module.exports = Form;
