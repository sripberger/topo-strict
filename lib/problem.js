import { ArgumentError } from './argument-error';
import _ from 'lodash';
import { getDuplicates } from './utils';

export class Problem {
	constructor() {
		this.items = {};
		this.groups = {};
	}

	add(...args) {
		// Normalize arguments into values and options.
		// eslint-disable-next-line no-underscore-dangle
		const { values, options } = this.constructor._normalizeAddArgs(args);

		// Deconstruct options.
		const { group: groupKey, before, after } = options;

		// Ensure values and group key can be added without causing duplication.
		this._validateKeys(values, groupKey);

		// Loop over values, adding an item for each.
		for (const value of values) {
			const item = this.items[value] = {};
			if (before) item.before = before;
			if (after) item.after = after;
		}

		// Handle the group key, if any was specified.
		if (groupKey) {
			let group = this.groups[groupKey];
			if (!group) group = this.groups[groupKey] = [];
			group.push(...values);
		}
	}

	_validateKeys() {
		// TODO
	}

	_getKeyCollisionErrors(values, groupKey) {
		const stringValues = _.filter(values, _.isString);
		const collisionErrors = this._getKeyInUseErrors(
			_.uniq(stringValues),
			groupKey
		);
		// eslint-disable-next-line no-underscore-dangle
		const duplicateErrors = this.constructor._getDuplicateKeyErrors(
			stringValues,
			groupKey
		);
		return collisionErrors.concat(duplicateErrors);
	}

	_getKeyInUseErrors(values, groupKey) {
		const errors = this._getValueInUseErrors(_.uniq(values));
		if (_.includes(_.keys(this.items), groupKey)) {
			errors.push(new ArgumentError(
				`Group key '${groupKey}' is already in use as a value`,
				{ info: { group: groupKey } }
			));
		}
		return errors;
	}

	_getValueInUseErrors(values) {
		const valueErrors = this._getExistingValueErrors(values);
		const groupErrors = this._getExistingGroupErrors(values);
		return valueErrors.concat(groupErrors);
	}

	_getExistingValueErrors(values) {
		return _.intersection(values, _.keys(this.items))
			.map((value) => {
				return new ArgumentError(
					`Value '${value}' has already been added`,
					{ info: { value } }
				);
			});
	}

	_getExistingGroupErrors(values) {
		return _.intersection(values, _.keys(this.groups))
			.map((value) => {
				return new ArgumentError(
					`Value '${value}' is already in use as a group key`,
					{ info: { value } }
				);
			});
	}

	static _normalizeAddArgs(args) {
		const { values, options } = this._splitAddArgs(args);
		return {
			values: _.flatten(values),
			options: this._normalizeOptions(options),
		};
	}

	static _splitAddArgs(args) {
		const values = [];
		while (isValuesArg(args[0])) values.push(args.shift());
		return { values, options: args[0] || {} };
	}

	static _normalizeOptions(options) {
		options = _.clone(options);
		const { before, after } = options;
		if (before) options.before = this._normalizeConstraint(before);
		if (after) options.after = this._normalizeConstraint(after);
		return options;
	}

	static _normalizeConstraint(constraint) {
		return _.isArray(constraint) ? _.clone(constraint) : [ constraint ];
	}

	static _getDuplicateKeyErrors(values, groupKey) {
		const errors = this._getDuplicateValueErrors(values);
		if (_.includes(values, groupKey)) {
			errors.push(new ArgumentError(
				`Group key '${groupKey}' also appears in values`,
				{ info: { group: groupKey } }
			));
		}
		return errors;
	}

	static _getDuplicateValueErrors(values) {
		return getDuplicates(values).map((value) => {
			return new ArgumentError(
				`Duplicate value '${value}'`,
				{ info: { value } }
			);
		});
	}
}

function isValuesArg(arg) {
	return _.isString(arg) || _.isArray(arg);
}
