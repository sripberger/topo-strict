import _ from 'lodash';
import { getDuplicates } from './utils';

export class KeySet {
	constructor(...args) {
		// Normalize arguments into an options object.
		// eslint-disable-next-line no-underscore-dangle
		const options = this.constructor._normalizeArgs(args);

		// Assign options properties onto instance, with defaults.
		_.defaults(this, options, { group: null });
	}

	_getDuplicationInfo() {
		// Map duplicated values to info objects.
		const duplicates = getDuplicates(this.values).map((key) => ({
			type: 'duplication',
			keyType: 'value',
			key,
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
		).map((key) => ({
			type: 'valueCollision',
			keyType: 'value',
			key,
		}));

		// Map intersections between values and existin group keys.
		const groupCollisions = _.intersection(
			this.values,
			existingKeys.groups
		).map((key) => ({
			type: 'groupCollision',
			keyType: 'value',
			key,
		}));

		const collisions = valueCollisions.concat(groupCollisions);

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

function isValuesArg(arg) {
	return _.isString(arg) || _.isArray(arg);
}
