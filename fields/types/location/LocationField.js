import _ from 'lodash';
import React from 'react';
import Field from '../Field';
import { Button, Checkbox, FormField, FormInput, FormNote, FormRow } from 'elemental';
//import {Gmaps, Marker, InfoWindow, Circle} from 'react-gmaps';
import Gmap from './LocationMap';
/**
 * TODO:
 * - Remove dependency on underscore
 * - Custom path support
 */

module.exports = Field.create({

	displayName: 'LocationField',

	getInitialState () {
		return {
			collapsedFields: {},
			improve: false,
			overwrite: false,
		};
	},

	componentWillMount () {

		var collapsedFields = {};
		_.forEach(['number', 'name', 'street2', 'geo'], (i) => {
			if (!this.props.value[i]) {
				collapsedFields[i] = true;
			}
		}, this);
		this.setState({
			collapsedFields: collapsedFields,
		});

	},

	componentDidUpdate (prevProps, prevState) {
		if (prevState.fieldsCollapsed && !this.state.fieldsCollapsed) {
			this.refs.number.getDOMNode().focus();
		}
	},

	shouldCollapse () {
		return this.props.collapse && !this.formatValue();
	},

	uncollapseFields () {
		this.setState({
			collapsedFields: {},
		});
	},

	fieldChanged (path, event) {
		var value = this.props.value
		value[path] = event.target.value;
		this.props.onChange({
			path: this.props.path,
			value: value,
		});
	},

	geoChanged (i, event) {
		var value = this.props.value;

		if (!value.geo) {
			value.geo = ['', ''];
		}
		value.geo[i] = event.target.value;
		this.props.onChange({
			path: this.props.path,
			value: value,
		});
	},

	formatValue () {
		return _.compact([
			this.props.value.number,
			this.props.value.name,
			this.props.value.street1,
			this.props.value.street2,
			this.props.value.suburb,
			this.props.value.state,
			this.props.value.postcode,
			this.props.value.country,
		]).join(', ');
	},

	renderValue () {
		return <FormInput noedit>{this.formatValue() || '(no value)'}</FormInput>;
	},

	renderField (path, label, collapse) { // eslint-disable-line no-unused-vars
		if (this.state.collapsedFields[path]) {
			return null;
		}
		return (
			<FormField label={label} className="form-field--secondary" htmlFor={this.props.path + '.' + path}>
				<FormInput name={this.props.path + '.' + path} ref={path} value={this.props.value[path]} onChange={this.fieldChanged.bind(this, path)} placeholder={label} />
			</FormField>
		);
	},

	renderSuburbState () {
		return (
			<FormField label="Suburb / State" className="form-field--secondary" htmlFor={this.props.path + '.suburb'}>
				<FormRow>
					<FormField width="two-thirds" className="form-field--secondary">
						<FormInput name={this.props.path + '.suburb'} ref="suburb" value={this.props.value.suburb} onChange={this.fieldChanged.bind(this, 'suburb')} placeholder="Suburb" />
					</FormField>
					<FormField width="one-third" className="form-field--secondary">
						<FormInput name={this.props.path + '.state'} ref="state" value={this.props.value.state} onChange={this.fieldChanged.bind(this, 'state')} placeholder="State" />
					</FormField>
				</FormRow>
			</FormField>
		);
	},

	renderPostcodeCountry () {
		return (
			<FormField label="Postcode / Country" className="form-field--secondary" htmlFor={this.props.path + '.postcode'}>
				<FormRow>
					<FormField width="one-third" className="form-field--secondary">
						<FormInput name={this.props.path + '.postcode'} ref="postcode" value={this.props.value.postcode} onChange={this.fieldChanged.bind(this, 'postcode')} placeholder="Post Code" />
					</FormField>
					<FormField width="two-thirds" className="form-field--secondary">
						<FormInput name={this.props.path + '.country'} ref="country" value={this.props.value.country} onChange={this.fieldChanged.bind(this, 'country')} placeholder="Country" />
					</FormField>
				</FormRow>
			</FormField>
		);
	},

	renderGeo () {
		if (this.state.collapsedFields.geo) {
			return null;
		}

		//GoogleMapsLoader.KEY = 'AIzaSyAdK0hodWF2QM3em_zh66JOctMhLhCIl5k';

		return (
			<FormField label="Lat / Lng" className="form-field--secondary" htmlFor={this.props.paths.geo}>
				<FormRow>
					<FormField width="one-half" className="form-field--secondary">
						<FormInput name={this.props.paths.geo+ '[1]'} ref="geo1" value={this.props.value.geo ? this.props.value.geo[1] : ''} onChange={this.geoChanged.bind(this, 1)} placeholder="Latitude" />
					</FormField>
					<FormField width="one-half" className="form-field--secondary">
						<FormInput name={this.props.paths.geo+ '[0]'} ref="geo0" value={this.props.value.geo ? this.props.value.geo[0] : ''} onChange={this.geoChanged.bind(this, 0)} placeholder="Longitude" />
					</FormField>
				</FormRow>
			</FormField>

		);
	},

	updateGoogleOption (key, e) {
		var newState = {};
		newState[key] = e.target.checked;
		this.setState(newState);
	},

	renderGoogleOptions () {
		if (!this.props.enableMapsAPI) return null;
		var replace = this.state.improve ? (
			<Checkbox
				label="Replace existing data"
				name={this.props.paths.overwrite}
				onChange={this.updateGoogleOption.bind(this, 'overwrite')}
				checked={this.state.overwrite} />
		) : null;
		return (
			<FormField offsetAbsentLabel>
				<Checkbox
					label="Autodetect and improve location on save"
					name={this.props.paths.improve}
					onChange={this.updateGoogleOption.bind(this, 'improve')}
					checked={this.state.improve}
					title="When checked, this will attempt to fill missing fields. It will also get the lat/long" />
				{replace}
			</FormField>
		);
	},


	renderNote () {
		if (!this.props.note) return null;
		return (
			<FormField offsetAbsentLabel>
				<FormNote note={this.props.note} />
			</FormField>
		);
	},
	placeCallback(place){
		console.log(place);
		this.props.value.geo[1]=place.geometry.location.lat();
		this.props.value.geo[0]=place.geometry.location.lng();
		var address;
		if (place.address_components) {
			address = [
				(place.address_components[0] && place.address_components[0].short_name || ''),
				(place.address_components[1] && place.address_components[1].short_name || '')
			].join(' ');
		}
		this.props.value.street1=address;

		if(place.address_components[place.address_components.length-3]){
			this.props.value.state=place.address_components[place.address_components.length-3].long_name;
		}

		if(place.address_components[place.address_components.length-2]){
			this.props.value.country=place.address_components[place.address_components.length-2].long_name;
		}
		if(place.address_components[place.address_components.length-1]){
			this.props.value.postcode=place.address_components[place.address_components.length-1].short_name;
		}

		this.props.onChange({
			path: this.props.path,
			value: this.props.value,
		});

	},
	renderMap(){

		if(!this.props.value.geo){
			this.props.value.geo=[];
		}
			var coords = {
				lat: parseFloat(this.props.value.geo[1]) || 51.5082928,
				lng: parseFloat(this.props.value.geo[0]) || -0.1277552
			};
			var mapStyle={
				marginBottom:10
			}
			var zoom=this.props.zoom || 16;
			return (
				<div style={mapStyle}>
					<Gmap lat={coords.lat} lng={coords.lng} placeCallback={this.placeCallback}></Gmap>
				</div>
			);

	},

	renderSearch(){
		return (
			<FormField width="one-half" className="form-field--secondary">
				<FormInput name="hey" ref="geo0" value={this.props.value.search} placeholder="Search" onChange={this.onSearchChange} />
			</FormField>
		);
	},

	renderUI () {

		if (!this.shouldRenderField()) {
			return (
				<FormField label={this.props.label}>{this.renderValue()}</FormField>
			);
		}

		/* eslint-disable no-script-url */
		var showMore = !_.isEmpty(this.state.collapsedFields)
			? <Button type="link" className="collapsed-field-label" onClick={this.uncollapseFields}>(show more fields)</Button>
			: null;
		/* eslint-enable */

		return (
			<div>
				<FormField label={this.props.label}>
					{showMore}
				</FormField>
				{this.renderField('number', 'PO Box / Shop', true)}
				{this.renderField('name', 'Building Name', true)}
				{this.renderField('street1', 'Street Address')}
				{this.renderField('street2', 'Street Address 2', true)}
				{this.renderSuburbState()}
				{this.renderPostcodeCountry()}
				{this.renderSearch()}
				{this.renderGeo()}
				{this.renderGoogleOptions()}
				{this.renderNote()}
				{this.renderMap()}
			</div>
		);
	},

});
