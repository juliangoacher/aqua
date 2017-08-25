'use strict';
const Actions = require('./actions');
const Alert = require('../../../components/alert.jsx');
const Button = require('../../../components/form/button.jsx');
const ControlGroup = require('../../../components/form/control-group.jsx');
const LinkState = require('../../../helpers/link-state');
const PropTypes = require('prop-types');
const React = require('react');
const Spinner = require('../../../components/form/spinner.jsx');
const TextControl = require('../../../components/form/text-control.jsx');


const propTypes = {
    error: PropTypes.string,
    hasError: PropTypes.object,
    help: PropTypes.object,
    hydrated: PropTypes.bool,
    loading: PropTypes.bool,
    name: PropTypes.shape({
        first: PropTypes.string,
        middle: PropTypes.string,
        last: PropTypes.string
    }),
    details : PropTypes.shape({
        dateOfBirth: PropTypes.string,
        location: PropTypes.string,
        ethnicity: PropTypes.string,
        cycle: PropTypes.string,
        exam: PropTypes.string,
        userType: PropTypes.string,
        subjects: PropTypes.string              // this is an array  []
    }),
    showSaveSuccess: PropTypes.bool
};


class DetailsForm extends React.Component {
    constructor(props) {

        super(props);

        this.state = {
            name: props.name,
            details: props.details
        };
    }

    componentWillReceiveProps(nextProps) {

        this.setState({
            name: nextProps.name,
            details: nextProps.details
        });
    }

    handleSubmit(event) {

        event.preventDefault();
        event.stopPropagation();

        Actions.saveDetails({
            name: this.state.name
        });
    }

    render() {

        if (!this.props.hydrated) {
            return (
                <div className="alert alert-info">
                    Loading contact info data...
                </div>
            );
        }

        const alerts = [];

        if (this.props.showSaveSuccess) {
            alerts.push(<Alert
                key="success"
                type="success"
                onClose={Actions.hideDetailsSaveSuccess}
                message="Success. Changes have been saved."
            />);
        }

        if (this.props.error) {
            alerts.push(<Alert
                key="danger"
                type="danger"
                message={this.props.error}
            />);
        }

        return (
            <form onSubmit={this.handleSubmit.bind(this)}>
                <fieldset>
                    <legend>Additional info</legend>
                    {alerts}
                    <TextControl
                        name="details.dateOfBirth"
                        label="Date of birth"
                        value={this.state.details.dateOfBirth}
                        onChange={LinkState.bind(this)}
                        hasError={this.props.hasError['details.dateOfBirth']}
                        help={this.props.help['details.dateOfBirth']}
                        disabled={this.props.loading}
                    />
                    <TextControl
                        name="details.location"
                        label="Location"
                        value={this.state.details.location}
                        onChange={LinkState.bind(this)}
                        hasError={this.props.hasError['details.location']}
                        help={this.props.help['details.location']}
                        disabled={this.props.loading}
                    />
                    <TextControl
                        name="details.ethnicity"
                        label="Ethnicity"
                        value={this.state.details.ethnicity}
                        onChange={LinkState.bind(this)}
                        hasError={this.props.hasError['details.ethnicity']}
                        help={this.props.help['details.ethnicity']}
                        disabled={this.props.loading}
                    />
                    <TextControl
                        name="details.cycle"
                        label="Cycle"
                        value={this.state.details.cycle}
                        onChange={LinkState.bind(this)}
                        hasError={this.props.hasError['details.cycle']}
                        help={this.props.help['details.cycle']}
                        disabled={this.props.loading}
                    />
                    <TextControl
                        name="details.exam"
                        label="Exam"
                        value={this.state.details.exam}
                        onChange={LinkState.bind(this)}
                        hasError={this.props.hasError['details.exam']}
                        help={this.props.help['details.exam']}
                        disabled={this.props.loading}
                    />
                    <TextControl
                        name="details.userType"
                        label="User Type"
                        value={this.state.details.userType}
                        onChange={LinkState.bind(this)}
                        hasError={this.props.hasError['details.userType']}
                        help={this.props.help['details.userType']}
                        disabled={this.props.loading}
                    />
                    <TextControl
                        name="details.subjects"
                        label="Subjects"
                        value={this.state.details.subjects}
                        onChange={LinkState.bind(this)}
                        hasError={this.props.hasError['details.subjects']}
                        help={this.props.help['details.subjects']}
                        disabled={this.props.loading}
                    />
                
                    <ControlGroup hideLabel={true} hideHelp={true}>
                        <Button
                            type="submit"
                            inputClasses={{ 'btn-primary': true }}
                            disabled={this.props.loading}>

                            Update contact info
                            <Spinner
                                space="left"
                                show={this.props.loading}
                            />
                        </Button>
                    </ControlGroup>
                </fieldset>
            </form>
        );
    }
}

DetailsForm.propTypes = propTypes;


module.exports = DetailsForm;
