import { KeySet } from './key-set';
import { Validatable } from './validatable';
import _ from 'lodash';

export class Problem extends Validatable {
	constructor() {
		super();

		this.ids = {};
		this.groups = {};
	}

	get keysByType() {
		return _(this).pick('ids', 'groups').mapValues(_.keys).value();
	}

	get keys() {
		return _(this.keysByType).map().flatten().value();
	}

	add(...args) {
		// Create a keySet with the same arguments.
		const keySet = new KeySet(...args);

		// Ensure the keySet is valid and doesn't collide with existing keys.
		keySet.validate(this.keysByType);

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

	_getErrorInfo() {
		const { ids, keys } = this;
		const results = [];
		for (const id in ids) {
			const { before, after } = this.ids[id];
			results.push(
				...missingTarget(before, keys, 'before'),
				...missingTarget(after, keys, 'after')
			);
		}
		return results;
	}
}

function missingTarget(constraintKeys, existingKeys, keyType) {
	return _.difference(constraintKeys, existingKeys).map((key) => ({
		type: 'missingTarget',
		keyType,
		key,
	}));
}
