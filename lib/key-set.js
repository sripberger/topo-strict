import { getDuplicates, getErrorForInfo } from './utils';
import { ValidationError } from './validation-error';
import _ from 'lodash';
import { fromArray } from 'nani';

export class KeySet {
	constructor(...args) {
		// Normalize arguments into an options object.
		// eslint-disable-next-line no-underscore-dangle
		const options = this.constructor._normalizeArgs(args);

		// Populate the instance with options properties and defaults.
		_.defaults(this, options, { group: null });
	}

	validate(existingKeys) {
		const err = fromArray(this._getErrors(existingKeys));
		if (err) throw new ValidationError(err);
	}

	_getErrors(existingKeys) {
		return this._getErrorInfo(existingKeys).map(getErrorForInfo);
	}

	_getErrorInfo(existingKeys) {
		return [
			...this._getInvalidKeyInfo(),
			...this._getDuplicationInfo(),
			...this._getCollisionInfo(existingKeys),
		];
	}

	_getInvalidKeyInfo() {
		// Map invalid value keys to info objects.
		const invalidValues = this.values.filter(isInvalidKey)
			.map((key) => ({
				type: 'invalidKey',
				keyType: 'value',
				key,
			}));

		// Map invalid before keys to info objects.
		const invalidBefores = this.before.filter(isInvalidKey)
			.map((key) => ({
				type: 'invalidKey',
				keyType: 'before',
				key,
			}));

		// Map invalid after keys to info objects.
		const invalidAfters = this.after.filter(isInvalidKey)
			.map((key) => ({
				type: 'invalidKey',
				keyType: 'after',
				key,
			}));

		// Concat all created info objects together.
		const invalidKeys = [
			...invalidValues,
			...invalidBefores,
			...invalidAfters,
		];

		// Append info for group key, if it is set and not valid.
		if (this.group !== null && isInvalidKey(this.group)) {
			invalidKeys.push({
				type: 'invalidKey',
				keyType: 'group',
				key: this.group,
			});
		}

		return invalidKeys;
	}

	_getDuplicationInfo() {
		// Map duplicated values to info objects.
		const duplicates = getDuplicates(this.values)
			.map((value) => ({
				type: 'duplication',
				keyType: 'value',
				key: value,
			}));

		// Append info for group if it appears in values.
		if (_.includes(this.values, this.group)) {
			duplicates.push({
				type: 'duplication',
				keyType: 'group',
				key: this.group,
			});
		}

		return duplicates;
	}

	_getCollisionInfo(existingKeys) {
		// Map intersections between values and existing item keys.
		const valueCollisions = _.intersection(
			this.values,
			existingKeys.items
		).map((value) => ({
			type: 'valueCollision',
			keyType: 'value',
			key: value,
		}));

		// Map intersections between values and existing group keys.
		const groupCollisions = _.intersection(
			this.values,
			existingKeys.groups
		).map((value) => ({
			type: 'groupCollision',
			keyType: 'value',
			key: value,
		}));

		// Concat all created info objects together.
		const collisions = [ ...valueCollisions, ...groupCollisions ];

		// Append info for group if it appears in existing values.
		if (_.includes(existingKeys.items, this.group)) {
			collisions.push({
				type: 'valueCollision',
				keyType: 'group',
				key: this.group,
			});
		}

		return collisions;
	}

	static _normalizeArgs(args) {
		const normalized = this._normalizeUnflattenedArgs(args);
		normalized.values = _.flatten(normalized.values);
		return normalized;
	}

	static _normalizeUnflattenedArgs(args) {
		const { values, options } = this._splitArgs(args);
		const normalized = this._normalizeOptions(options);
		normalized.values = values.concat(normalized.values);
		return normalized;
	}

	static _splitArgs(args) {
		const values = [];
		while (isValuesArg(args[0])) values.push(args.shift());
		return { values, options: args[0] || {} };
	}

	static _normalizeOptions(options) {
		options = _.clone(options);
		for (const key of [ 'values', 'before', 'after' ]) {
			if (key in options) {
				options[key] = this._normalizeArrayOption(options[key]);
			} else {
				options[key] = [];
			}
		}
		return options;
	}

	static _normalizeArrayOption(option) {
		return _.isArray(option) ? _.clone(option) : [ option ];
	}
}

function isInvalidKey(key) {
	return !_.isString(key) || _.isEmpty(key);
}

function isValuesArg(arg) {
	return _.isString(arg) || _.isArray(arg);
}
