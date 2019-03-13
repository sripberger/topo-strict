import { Graph } from './graph';
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

	toGraph() {
		this._validate();
		return this._toFullGraph();
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
				...getMissingTargets(before, keys, 'before'),
				...getMissingTargets(after, keys, 'after')
			);
		}
		return results;
	}

	_toFullGraph() {
		const graph = this._toGraphWithNodes();
		const constraintsById = this._applyGroups();
		for (const id in constraintsById) {
			const { before = [], after = [] } = constraintsById[id];
			for (const key of before) graph.addEdge(id, key);
			for (const key of after) graph.addEdge(key, id);
		}
		return graph;
	}

	_toGraphWithNodes() {
		const graph = new Graph();
		for (const id in this.ids) graph.addNode(id);
		return graph;
	}

	_applyGroups() {
		return _.mapValues(
			this.ids,
			(constraints) => applyGroups(constraints, this.groups)
		);
	}
}

function getMissingTargets(constraintKeys, existingKeys, keyType) {
	return _.difference(constraintKeys, existingKeys).map((key) => ({
		type: 'missingTarget',
		keyType,
		key,
	}));
}

function applyGroups(constraints, groups) {
	return _.mapValues(constraints, (keys) => {
		return _(keys)
			.map((key) => groups[key] || key)
			.flatten()
			.value();
	});
}
