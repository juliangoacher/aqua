'use strict';

const PropTypes = require('prop-types');
const React = require('react');
const Select = require('react-select');

const propTypes = {
    children: PropTypes.node,
    defaultValue: PropTypes.string,
    disabled: PropTypes.bool,
    hasError: PropTypes.bool,
    help: PropTypes.string,
    inputClasses: PropTypes.object,
    label: PropTypes.string,
    multiple: PropTypes.string,
    name: PropTypes.string,
    onChange: PropTypes.func,
    size: PropTypes.string,
    value: PropTypes.oneOfType([
        PropTypes.bool,
        PropTypes.string
    ])
};

var juniorCertSubjects = [
    { value: 'artcraftdesign', label: 'Art, Craft & Design' },
    { value: 'business', label: 'Business Studies' },
    { value: 'civilsocial', label: 'Civic Social and Political Education' },
    { value: 'classicalstudies', label: 'Classical Studies' },
    { value: 'english', label: 'English' },
    { value: 'env', label: 'Environmental Social Studies' },
    { value: 'french', label: 'French' },
    { value: 'gaeilge', label: 'Gaeilge' },
    { value: 'geography', label: 'Geography' },
    { value: 'german', label: 'German' },
    { value: 'history', label: 'History' },
    { value: 'economics', label: 'Home Economics' },
    { value: 'italian', label: 'Italian' },
    { value: 'materialstech', label: 'Materials Technology (wood)' },
    { value: 'mathematics', label: 'Mathematics' },
    { value: 'metalwork', label: 'Metalwork' },
    { value: 'music', label: 'Music' },
    { value: 'physicaleducation', label: 'Physical Education' },
    { value: 'religiouseducation', label: 'Religious Education' },
    { value: 'science', label: 'Science' },
    { value: 'spanish', label: 'Spanish' },
    { value: 'technicalgraphic', label: 'Technical Graphics' },
    { value: 'technology', label: 'Technology' }
]

class MultiselectControl extends React.Component {

	constructor(props) {

		super(props);
        this.state = {};

	}



	render() {

		return (
			<Select multi simpleValue
				name={this.props.name}
				value={this.props.value}
				options={juniorCertSubjects}
                onChange={this.props.onChange}
			/>


		);

	}

}

MultiselectControl.propTypes = propTypes;

module.exports = MultiselectControl;
