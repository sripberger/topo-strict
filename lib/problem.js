import { KeySet } from './key-set';
import _ from 'lodash';

export class Problem {
	constructor() {
		this.ids = {};
		this.groups = {};
	}

	get keys() {
		return _(this).pick('ids', 'groups').mapValues(_.keys).value();
	}

	add(...args) {
		// Create a keySet with the same arguments.
		const keySet = new KeySet(...args);

		// Ensure the keySet is valid and doesn't collide with existing keys.
		keySet.validate(this.keys);

		// Add the key set to the problem.
		this._addKeySet(keySet);
	}

	_addKeySet(keySet) {
		// Deconstruct the key set.
		const { ids, before, after, group: groupKey } = keySet;

		// Loop over ids, adding an entry for each.
		for (const id of ids) {
			const constraints = this.ids[id] = {};
			if (!_.isEmpty(before)) constraints.before = before;
			if (!_.isEmpty(after)) constraints.after = after;
		}

		// Handle the group key, if any.
		if (groupKey) {
			let group = this.groups[groupKey];
			if (!group) group = this.groups[groupKey] = [];
			group.push(...ids);
		}
	}
}
