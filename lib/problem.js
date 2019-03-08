import { ArgumentError } from './argument-error';
import { KeySet } from './key-set';
import _ from 'lodash';
import { getDuplicates } from './utils';

export class Problem {
	constructor() {
		this.items = {};
		this.groups = {};
	}

	add(...args) {
		// Create a keySet with the same arguments.
		const keySet = new KeySet(...args);

		// Deconstruct options from the key set.
		const { values, before, after, group: groupKey } = keySet;

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

	_getKeyErrors(values, groupKey, before, after) {
		const invalidErrors = this._getInvalidKeyErrors(
			values,
			groupKey,
			before,
			after
		);
		const collisionErrors = this._getKeyCollisionErrors(values, groupKey);
		return invalidErrors.concat(collisionErrors);
	}

	_getInvalidKeyErrors() {
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
