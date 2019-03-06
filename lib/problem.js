import { clone, flatten, isArray, isString } from 'lodash';

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

	static _normalizeAddArgs(args) {
		const { values, options } = this._splitAddArgs(args);
		return {
			values: flatten(values),
			options: this._normalizeOptions(options),
		};
	}

	static _splitAddArgs(args) {
		const values = [];
		while (isValuesArg(args[0])) values.push(args.shift());
		return { values, options: args[0] || {} };
	}

	static _normalizeOptions(options) {
		options = clone(options);
		const { before, after } = options;
		if (before) options.before = this._normalizeConstraint(before);
		if (after) options.after = this._normalizeConstraint(after);
		return options;
	}

	static _normalizeConstraint(constraint) {
		return isArray(constraint) ? clone(constraint) : [ constraint ];
	}
}

function isValuesArg(arg) {
	return isString(arg) || isArray(arg);
}
