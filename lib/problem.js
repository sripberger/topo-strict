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

		// Ensure values and group key can be added without causing duplication.
		this._validateKeys(keySet.values, keySet.group);

		// Add the key set to the problem.
		this._addKeySet(keySet);
	}

	_addKeySet(keySet) {
		// Deconstruct the key set.
		const { values, before, after, group: groupKey } = keySet;

		// Loop over values, adding an item for each.
		for (const value of values) {
			const item = this.items[value] = {};
			if (!_.isEmpty(before)) item.before = before;
			if (!_.isEmpty(after)) item.after = after;
		}

		// Handle the group key, if any.
		if (groupKey) {
			let group = this.groups[groupKey];
			if (!group) group = this.groups[groupKey] = [];
			group.push(...values);
		}
	}

	_validateKeys() {
		// TODO
	}
}
