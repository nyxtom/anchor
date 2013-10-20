/**
 * Module dependencies
 */

var util = require('lodash');
var sanitize = require('validator').sanitize;
var _ = require('underscore')._;
var async = require('async');


/**
 * Public access
 */

module.exports = function (entity) {
	return new Anchor(entity);
};


/**
 * Constructor of individual instance of Anchor
 * Specify the function, object, or list to be anchored
 */

function Anchor (entity) {
	if (util.isFunction(entity)) {
		this.fn = entity;
		throw new Error ('Anchor does not support functions yet!');
	}
	else this.data = entity;

	return this;
}


/**
 * Built-in data type rules
 */

Anchor.prototype.rules = require('./lib/rules');


/**
 * Enforce that the data matches the specified ruleset
 */

Anchor.prototype.to = function (ruleset) {

	var errors = [];

	// If ruleset doesn't contain any explicit rule keys,
	// assume that this is a type


	// Look for explicit rules
	for (var rule in ruleset) {

		if (rule === 'type') {

			// Use deep match to descend into the collection and verify each item and/or key
			// Stop at default maxDepth (50) to prevent infinite loops in self-associations
			errors = errors.concat(Anchor.match.type(this.data, ruleset['type']));
		}

		// Validate a non-type rule
		else {
			errors = errors.concat(Anchor.match.rule(this.data, rule, ruleset[rule]));
		}
	}

	// If errors exist, return the list of them
	if (errors.length) {
		return errors;
	}

	// No errors, so return false
	else return false;

};

Anchor.prototype.hasErrors = Anchor.prototype.to;


/**
 * Coerce the data to the specified ruleset if possible
 * otherwise throw an error
 * Priority: this should probably provide the default
 * implementation in Waterline core.  Currently it's completely
 * up to the adapter to define type coercion.
 *
 * Which is fine!.. but complicates custom CRUD adapter development.
 * Much handier would be an evented architecture, that allows
 * for adapter developers to write:
 *
	{
		// Called before find() receives criteria
		// Here, criteria refers to just attributes (the `where`)
		// limit, skip, and sort are not included
		coerceCriteria: function (criteria) {
			return criteria;
		},

		// Called before create() or update() receive values
		coerceValues: function () {}

	}
 *
 * Adapter developers would be able to use Anchor.prototype.cast()
 * to declaritively define these type coercions.

 * Down the line, we could take this further for an even nicer API,
 * but for now, this alone would be a nice improvement.
 *
 */

Anchor.prototype.cast = function (ruleset) {
	todo();
};


/**
 * Coerce the data to the specified ruleset no matter what
 */

Anchor.prototype.hurl = function (ruleset) {

	// Iterate trough given data attributes
	// to check if they exist in the ruleset
	for (var attr in this.data) {
		if (this.data.hasOwnProperty(attr)) {

			// If it doesnt...
			if (!ruleset[attr]) {

				// Declaring err here as error helpers live in match.js
				var err = new Error('Validation error: Attribute \"' + attr + '\" is not in the ruleset.');

				// just throw it
				throw err;
			}
		}
	}

	// Once we make sure that attributes match
	// we can just proceed to deepMatch
	Anchor.match(this.data, ruleset, this);
};


/**
 * Specify default values to automatically populated when undefined
 */

Anchor.prototype.defaults = function (ruleset) {
	todo();
};


/**
 * Declare a custom data type
 * If function definition is specified, `name` is required.
 * Otherwise, if dictionary-type `definition` is specified,
 * `name` must not be present.
 *
 * @param {String} name				[optional]
 * @param {Object|Function}	definition
 */

Anchor.prototype.define = function (name, definition) {

	// check to see if we have an dictionary
	if ( util.isObject(name) ) {

		// if so all the attributes should be validation functions
		for (var attr in name){
			if(!util.isFunction(name[attr])){
				throw new Error('Definition error: \"' + attr + '\" does not have a definition');
			}
		}

		// add the new custom data types
		util.extend(Anchor.prototype.rules, name);

		return this;

	}

	if ( util.isFunction(definition) && util.isString(name) ) {

		// Add a single data type
		Anchor.prototype.rules[name] = definition;

		return this;

	}

	throw new Error('Definition error: \"' + name + '\" is not a valid definition.');
};


/**
 * Specify custom ruleset
 */

Anchor.prototype.as = function (ruleset) {
	todo();
};


/**
 * Specify named arguments and their rulesets as an object
 */

Anchor.prototype.args = function (args) {
	todo();
};


/**
 * Specify each of the permitted usages for this function
 */

Anchor.prototype.usage = function () {
	var usages = util.toArray(arguments);
	todo();
};


/**
 * Deep-match a complex collection or model against a schema
 */

Anchor.match = require('./lib/match.js');


/**
 * Expose `define` so it can be used globally
 */

module.exports.define = Anchor.prototype.define;

/**
 * Handles validation on a model
 */

var Validator = function () {
  this.validations = {};
};

/**
 * Builds a Validation Object from a normalized attributes
 * object.
 *
 * Loops through an attributes object to build a validation object
 * containing attribute name as key and a series of validations that
 * are run on each model. Skips over type and defaultsTo as they are
 * schema properties.
 *
 * Example:
 *
 * attributes: {
 *   name: {
 *     type: 'string',
 *     length: { min: 2, max: 5 }
 *   }
 *   email: {
 *     type: 'string',
 *     required: true
 *   }
 * }
 *
 * Returns: {
 *   name: { length: { min:2, max: 5 }},
 *   email: { required: true }
 * }
 */

Validator.prototype.initialize = function(attrs, types) {

  // add custom type definitions to anchor
  types = types || {};
  anchor.define(types);

  var validations = this.validations;
  for(var attr in attrs) {
    var validation = validations[attr] = {};
    var attrsVal = attrs[attr];

    for(var prop in attrsVal) {
      if(/^(defaultsTo|primaryKey|autoIncrement|unique|index|columnName)$/.test(prop)) continue;

      // use the Anchor `in` method for enums
      if(prop === 'enum') {
        validation['in'] = attrsVal[prop];
      }
      else {
        validation[prop] = attrsVal[prop];
      }
    }
  }
};

/**
 * Validate
 *
 * Accepts an object of values and runs them through the
 * schema's validations using Anchor.
 *
 * @param {Object} values to check
 * @param {Boolean} presentOnly only validate present values
 * @param {Function} callback
 * @return Array of errors
 */

Validator.prototype.validate = function(values, presentOnly, cb) {
  var self = this,
      errors = {},
      validations = Object.keys(this.validations);

  // Handle optional second arg
  if(typeof presentOnly === 'function') {
    cb = presentOnly;
  }
  // Use present values only or all validations
  else if(presentOnly) {
    validations = _.intersection(validations, Object.keys(values));
  }

  function validate(validation, cb) {
    var curValidation = self.validations[validation];

    // Build Requirements
    var requirements = anchor(curValidation);

    // Grab value and set to null if undefined
    var value = values[validation];
    if(typeof value == 'undefined') value = null;

    // If value is not required and empty then don't
    // try and validate it
    if(!curValidation.required) {
      if(value === null || value === '') return cb();
    }

    // Ignore Text type validation
    if(curValidation.type === 'text') return cb();

    // If Boolean and required manually check
    if(curValidation.required && curValidation.type === 'boolean') {
      if(value.toString() == 'true' || value.toString() == 'false') return cb();
    }

    // Validate with Anchor
    var err = anchor(value).to(requirements.data);

    // If No Error return
    if(!err) return cb();

    errors[validation] = err;
    return cb();
  }

  // Validate all validations in parallell
  async.each(validations, validate, function() {
    if(Object.keys(errors).length === 0) return cb();
    cb({ 'ValidationError': errors });
  });

};

module.exports.Validator = Validator;
