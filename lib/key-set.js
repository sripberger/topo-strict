import _ from 'lodash';
import { getDuplicates } from './utils';

export class KeySet {
	constructor(...args) {
		// Normalize arguments.
		// eslint-disable-next-line no-underscore-dangle
		const options = this.constructor._normalizeArgs(args);
		const { values, before, after, group } = options;

		// Assign instance properties.
		this.values = values;
		this.before = before;
		this.after = after;
		this.group = group || null;
	}

	_getDuplicationInfo() {
		// Set type to include in info objects.
		const type = 'duplication';

		// Map duplicated values to info objects.
		const duplicates = getDuplicates(this.values).map((value) => ({
			type,
			key: value,
			keyType: 'value',
		}));

		// Append info for group if it appears in values.
		if (_.includes(this.values, this.group)) {
			duplicates.push({ type, key: this.group, keyType: 'group' });
		}

		return duplicates;
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
