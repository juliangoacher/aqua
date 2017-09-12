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
const SelectControl = require('../../../components/form/select-control.jsx');
const MultiselectControl = require('../../../components/form/multiselect-control.jsx');
const Select = require('react-select');

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
    }),
    subjects: PropTypes.oneOfType([
        PropTypes.bool,
        PropTypes.object,
        PropTypes.string
    ]),
    showSaveSuccess: PropTypes.bool
};


class DetailsForm extends React.Component {
    constructor(props) {

        super(props);

        // TODO: Inititiate the details
        this.state = {
            username: props.username
        };
    }

    onSelectChange(event) {
        console.log('onSelectChange')
        // TODO: remove, not needed as not pages
        //this.setState({ page: '1' }, this.props.onChange.bind(this));
    }

    componentWillReceiveProps(nextProps) {
        console.log('componentWillReceiveProps')
        console.log(nextProps)

        // jl: TODO review: I need to init detailsOfBirth to avoid error firt time
        // the form is loaded.
        this.setState({
            username: nextProps.username,
            details: nextProps.details,
            subjects: nextProps.subjects
        });

    }

    handleSelectChange (value) {

        console.log('You\'ve selected:', value);
        console.log(this.state);

        //this.state.details.subjects = { value };
        //this.setState({details:{ subjects: value}});
        this.setState( {subjects: value} )
    }

    handleSubmit(event) {

        console.log('handleSubmit!!!');
        console.log(this.state);

        event.preventDefault();
        event.stopPropagation();

        Actions.saveMocksDetails( {
            details : {
                dateOfBirth: this.state.details.dateOfBirth,
                location: this.state.details.location,
                ethnicity: this.state.details.ethnicity,
                cycle:  this.state.details.cycle,
                exam: this.state.details.exam,
                userType: this.state.details.userType
            },
            subjects: this.state.subjects
        });

    }

    render() {

        console.log("RENDER --> details are:")
        console.log(this.state)

        if (!this.state.details){
            this.state.details = {}
        }

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
            <form
                onSubmit={this.handleSubmit.bind(this)}>
                <fieldset>
                    <legend>General info</legend>
                    {alerts}

                    <TextControl
                        name="details.dateOfBirth"
                        label="Date of birth"
                        type="date"
                        value={this.state.details.dateOfBirth}
                        onChange={LinkState.bind(this)}
                        hasError={this.props.hasError['details.dateOfBirth']}
                        help={this.props.help['details.dateOfBirth']}
                        disabled={this.props.loading}
                    />

                    <SelectControl
                        name="details.location"
                        label="Location"
                        value={this.state.details.location}
                        onChange={LinkState.bind(this)}
                        disabled={this.props.loading}>

                           <option value="">-- choose--</option>
                           <option value="antrim">Antrim</option>
                           <option value="armagh">Armagh</option>
                           <option value="carlow">Carlow</option>
                           <option value="cavan">Cavan</option>
                           <option value="clare">Clare</option>
                           <option value="cork">Cork</option>
                           <option value="derry">Derry</option>
                           <option value="donegal">Donegal</option>
                           <option value="down">Down</option>
                           <option value="dublin">Dublin</option>
                           <option value="fermanagh">Fermanagh</option>
                           <option value="galway">Galway</option>
                           <option value="kerry">Kerry</option>
                           <option value="kildare">Kildare</option>
                           <option value="kilkenny">Kilkenny</option>
                           <option value="laois">Laois</option>
                           <option value="leitrim">Leitrim</option>
                           <option value="limerick">Limerick</option>
                           <option value="longford">Longford</option>
                           <option value="louth">Louth</option>
                           <option value="mayo">Mayo</option>
                           <option value="meath">Meath</option>
                           <option value="monaghan">Monaghan</option>
                           <option value="offaly">Offaly</option>
                           <option value="roscommon">Roscommon</option>
                           <option value="sligo">Sligo</option>
                           <option value="tipperary">Tipperary</option>
                           <option value="tyrone">Tyrone</option>
                           <option value="waterford">Waterford</option>
                           <option value="westmeath">Westmeath</option>
                           <option value="wexford">Wexford</option>
                           <option value="wicklow">Wicklow</option>
                    </SelectControl>

                    <SelectControl
                        name="details.ethnicity"
                        label="Ethnicity"
                        value={this.state.details.ethnicity}
                        onChange={LinkState.bind(this)}
                        disabled={this.props.loading}>

                           <option value="">-- choose--</option>
                           <option value="caucasian">Caucasian</option>
                           <option value="asian">Asian</option>
                           <option value="black">Black</option>
                    </SelectControl>

                    <legend>Studies info</legend>

                    <SelectControl
                        name="details.userType"
                        label="User Type"
                        value={this.state.details.userType}
                        onChange={LinkState.bind(this)}
                        disabled={this.props.loading}>

                        <option value="">-- choose--</option>
                        <option value="student">Student</option>
                        <option value="parent">Parent</option>
                        <option value="teacher">Teacher</option>
                    </SelectControl>

                    <SelectControl
                        name="details.cycle"
                        label="Cycle"
                        value={this.state.details.cycle}
                        onChange={LinkState.bind(this)}
                        disabled={this.props.loading}>

                        <option value="">-- choose--</option>
                        <option value="leaving">Leaving</option>
                        <option value="junior">Junior</option>
                    </SelectControl>

                    <SelectControl
                        name="details.exam"
                        label="Exam"
                        value={this.state.details.exam}
                        onChange={LinkState.bind(this)}
                        disabled={this.props.loading}>

                        <option value="">-- choose--</option>
                        <option value="2018">2018</option>
                        <option value="2019">2019</option>
                        <option value="2020">2020</option>
                        <option value="2021">2021</option>
                        <option value="2022">2022</option>
                        <option value="2023">2023</option>
                        <option value="2024">2024</option>
                        <option value="2025">2025</option>
                        <option value="2026">2026</option>
                        <option value="2027">2027</option>
                        <option value="2028">2028</option>
                        <option value="2029">2029</option>
                        <option value="2030">2030</option>
                    </SelectControl>

                    <legend>Subjects</legend>

                    <MultiselectControl
                        name="subjects"
                        onChange={this.handleSelectChange.bind(this)}
                        value={this.state.subjects} />

                    <br></br>

                    {/*    <TextControl
                        name="details.subjects"
                        label="Subjects"
                        value={this.state.details.subjects}
                        onChange={LinkState.bind(this)}
                        hasError={this.props.hasError['details.subjects']}
                        help={this.props.help['details.subjects']}
                        disabled={this.props.loading}
                    />
                    */}

                    <ControlGroup hideLabel={true} hideHelp={true}>
                        <Button
                            type="submit"
                            inputClasses={{ 'btn-primary': true }}
                            disabled={this.props.loading}>

                            Update my details
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
