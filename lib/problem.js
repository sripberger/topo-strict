import { Graph } from './graph';
import { KeySet } from './key-set';
import { Validatable } from './validatable';
import _ from 'lodash';

// Note: the following class extends Validatable, but this is not noted below,
// in order to keep any mention of Validatable out of the public docs.
/**
 * Represents a single constraint satisfaction problem that can be solved by
 * topo-strict. Tracks all ids, group keys, and constraint keys to ensure that
 * invalid keys are never added, that collisions between keys are not possible,
 * and that all constraint keys reference some existing id or group before
 * solving.
 * @constructor Problem
 */
export class Problem extends Validatable {
	constructor() {
		super();

		/**
		 * Stores problem ids as keys, with their constraints as object
		 * properties on the values.
		 * @private
		 * @type {Object}
		 */
		this._ids = {};

		/**
		 * Stores grouped ids as arrays, keyed by group keys.
		 * @private
		 * @type {Object}
		 */
		this._groups = {};
	}

	// eslint-disable-next-line jsdoc/require-returns
	/**
	 * An object containing all keys in the Problem, categorized by their type.
	 * Ids appear in the `ids` property, and group keys appear in the `groups`
	 * property.
	 * @type {Object}
	 */
	get keysByType() {
		return {
			ids: _.keys(this._ids),
			groups: _.keys(this._groups),
		};
	}

	// eslint-disable-next-line jsdoc/require-returns
	/**
	 * An array of all keys in the problem, regardless of category.
	 */
	get keys() {
		return _(this.keysByType).map().flatten().value();
	}

	// eslint-disable-next-line jsdoc/check-param-names
	/**
	 * Adds new ids to the problem. Will validate all provided ids and options,
	 * ensuring that the problem is not put into an illegal state. Will throw
	 * a [ValidationError](#validationerror) if any issues are found.
	 * @function add
	 * @instance
	 * @memberof Problem
	 * @param {...string|Array<string>} [ids] - Non-empty strings-- or arrays of
	 *   non-empty strings-- to add to the problem.
	 * @param {Object} [options={}] - Options object for added ids.
	 *   @param {string|Array<string>} [options.ids=[]] - Single non-empty
	 *     string or array of non-empty strings to add to the problem. This
	 *     option is combined with any `ids` appearing before the options
	 *     object.
	 *   @param {string|null} [options.group=null] - Group key for associating
	 *     all added ids, if any. Group keys may be referenced in `before` and
	 *     `after` constraints. If provided with a group key that already
	 *     exists in the problem, the ids will be added to that group.
	 *   @param {string|Array<string>} [options.before=[]] - ids or group keys
	 *     that must appear before the provided ids in the final sort. These
	 *     may reference ids or groups that do not yet exist, but if a
	 *     corresponding id or group is not added by the time `#solve` or
	 *     `#toGraph` is called, said method will throw a ValidationError.
	 *   @param {string|Array<string>} [options.after=[]] - Similar to
	 *     `options.before`, except that it forces all provided ids to appear
	 *     *after* the referenced ids or groups in the final sort.
	 */
	add(...args) {
		// Create a keySet with the same arguments.
		const keySet = new KeySet(...args);

		// Ensure the keySet is valid and doesn't collide with existing keys.
		keySet.validate(this.keysByType);

		// Add the key set to the problem.
		this._addKeySet(keySet);
	}

	/**
	 * Returns a canonical plain object representation of the problem, with all
	 * keys sorted alphabetically. This is used as the basis for ``#toString`,
	 * so overriding it will also change the behavior of `#toString`.
	 * @returns {Object} - Object representation of the problem with two
	 *  properties:
	 *    - `ids`: An array of objects for id entries, each with a `key`
	 *      property and a `constraints` property that lists constraints. Each
	 *      constraint is itself an object with `type` and `key` properties.
	 *    - `groups`: An array of objects for group entries, each with a `key`
	 *      property and a `ids` property that lists ids contained in the group.
	 */
	toObject() {
		return {
			ids: _(this._ids)
				.keys()
				.sortBy()
				.map((id) => this._getObjectForId(id))
				.value(),
			groups: _(this._groups)
				.keys()
				.sortBy()
				.map((groupKey) => this._getObjectForGroup(groupKey))
				.value(),
		};
	}

	/**
	 * Converts the Problem into a string representation, ready to be printed to
	 * a console or otherwise displayed to a human user. Useful for debugging
	 * complicated dependency graphs.
	 * @returns {string} - Human-readable string representation of the Problem.
	 */
	toString() {
		const sections = [];
		const { ids, groups } = this.toObject();
		if (!_.isEmpty(ids)) sections.push(getIdsSection(ids));
		if (!_.isEmpty(groups)) sections.push(getGroupsSection(groups));
		return sections.join('\n\n') || 'Empty problem';
	}

	/**
	 * Converts the Problem into a [Graph](#graph) instance, with nodes
	 * containing ids and edges representing the constraints. This is the graph
	 * that will be used when calling `#solve`. Will throw a ValidationError if
	 * any constraints reference keys that do not exist in the Problem.
	 * @returns {Graph} - Resulting graph.
	 */
	toGraph() {
		this._validate();
		return this._toFullGraph();
	}

	/**
	 * Solves the problem by converting it to a directional graph and performing
	 * a depth-first search. Will return a sequence of ids that satisfies all
	 * contraints, if a such solution is possible. Will throw a CycleError if
	 * there is a cycle that prevents a solution, or a ValidationError if any
	 * constraints reference keys that do not exist in the Problem.
	 * @returns {Array<string>} - Sequence of ids.
	 */
	solve() {
		return this.toGraph().solve();
	}

	/**
	 * Internal method that actually adds the provided KeySet instance to the
	 * problem. Used by the public #add method after building and validating a
	 * KeySet.
	 * @private
	 * @param {KeySet} keySet - Normalized and validated KeySet instance.
	 */
	_addKeySet(keySet) {
		// Deconstruct the key set.
		const { ids, before, after, group: groupKey } = keySet;

		// Loop over ids, adding an entry for each.
		for (const id of ids) {
			const constraints = this._ids[id] = {};
			if (!_.isEmpty(before)) constraints.before = before;
			if (!_.isEmpty(after)) constraints.after = after;
		}

		// Handle the group key, if any.
		if (groupKey) {
			let group = this._groups[groupKey];
			if (!group) group = this._groups[groupKey] = [];
			group.push(...ids);
		}
	}

	/**
	 * The Problem class's implementation of Validatable#_getErrorInfo. See
	 * the internal Validatable class for more information.
	 * @private
	 * @returns {Array<Object>} - Array of error info objects.
	 */
	_getErrorInfo() {
		const { _ids, keys } = this;
		const results = [];
		for (const id in _ids) {
			const { before, after } = _ids[id];
			results.push(
				...getMissingTargets(before, keys, 'before'),
				...getMissingTargets(after, keys, 'after')
			);
		}
		return results;
	}

	/**
	 * Internal method that actually generates a graph from the problem,
	 * complete with both nodes and edges. Used by the public `#toGraph` method
	 * after validating the problem to ensure that a valid graph is possible.
	 * @private
	 * @returns {Graph} - Resulting graph.
	 */
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

	/**
	 * Internal method that generates a starting graph with just nodes, and no
	 * edges. It is used by the internal `#_toFullGraph` method to ensure that
	 * all nodes are created before all graphs.
	 * @private
	 * @returns {Graph} - Resulting graph with nodes only.
	 */
	_toGraphWithNodes() {
		const graph = new Graph();
		for (const id in this._ids) graph.addNode(id);
		return graph;
	}

	/**
	 * Internal method that applies groups to all constraint keys, replacing
	 * any group key with the ids contained in the group. This does not change
	 * the Problem itself.
	 * @private
	 * @returns {Object} - A copy of @_ids with groups applied.
	 */
	_applyGroups() {
		return _.mapValues(
			this._ids,
			(constraints) => applyGroups(constraints, this._groups)
		);
	}

	/**
	 * Internal helper method used by #toObject. Returns the object
	 * representation for entry in #_ids.
	 * @private
	 * @param {string} id - Id string and key for the entry.
	 * @returns {Object} - Object representation of the ids entry.
	 */
	_getObjectForId(id) {
		let { before, after } = this._ids[id];
		before = _(before)
			.sortBy()
			.map((key) => ({ type: 'before', key }))
			.value();
		after = _(after)
			.sortBy()
			.map((key) => ({ type: 'after', key }))
			.value();
		return { key: id, constraints: [ ...before, ...after ] };
	}

	/**
	 * Internal helper method used by #toObject. Returns the object
	 * representation for entry in #_groups.
	 * @private
	 * @param {string} groupKey - Group key for the entry.
	 * @returns {Object} - Object representation of the groups entry.
	 */
	_getObjectForGroup(groupKey) {
		return { key: groupKey, ids: _.sortBy(this._groups[groupKey]) };
	}
}

/**
 * Helper function for Problem#toString. Returns the string that will be shown
 * to display the ids in the problem, along with their constraints.
 * @private
 * @param {Array<Objets>} idObjects - Sorted id objects from #toObject.
 * @returns {string} - String for displaying all ids. Will be empty if there are
 *   none.
 */
function getIdsSection(idObjects) {
	const lines = [ 'ids', '---' ];
	for (const { key: id, constraints } of idObjects) {
		lines.push(id);
		for (const { type, key } of constraints) {
			lines.push(`    ${type}: ${key}`);
		}
	}
	return lines.join('\n');
}

/**
 * Helper function for Problem#toString. Returns the string that will be shown
 * to display the groups in the problem, along with their associated ids.
 * @private
 * @param {Array<Object>} groupObjects - Sorted group objects from #toObject.
 * @returns {string} - String for displaying all groups. Will be empty if there
 *   are none.
 */
function getGroupsSection(groupObjects) {
	const lines = [ 'groups', '------' ];
	for (const { key, ids } of groupObjects) {
		lines.push(key);
		for (const id of ids) lines.push(`    ${id}`);
	}
	return lines.join('\n');
}

/**
 * Helper function for Problem#_getErrorInfo. Creates info objects for all items
 * in an array of constraint keys that do not appear in an array of existing
 * keys.
 * @private
 * @param {Array<string>} constraintKeys - Array of constraint keys.
 * @param {Array<string>} existingKeys - Array of keys that exist in the
 *   Problem, including both ids and group keys.
 * @param {string} keyType - The keyType to include in created error info
 *   objects.
 * @returns {Array<Object>} - Array of error info objects.
 */
function getMissingTargets(constraintKeys, existingKeys, keyType) {
	return _.difference(constraintKeys, existingKeys).map((key) => ({
		type: 'missingTarget',
		keyType,
		key,
	}));
}

/**
 * Helper function for Problem#_applyGroups. Creates a copy of an array of
 * constraint keys with any group keys replaced with the corresponding ids.
 * @private
 * @param {Array<string>} constraints - Array of constraint keys.
 * @param {Object} groups - Arrays of grouped ids, keyed by group id.
 * @returns {Array<string>} - Copy of `constraints` with groups applied.
 */
function applyGroups(constraints, groups) {
	return _.mapValues(constraints, (keys) => {
		return _(keys)
			.map((key) => groups[key] || key)
			.flatten()
			.value();
	});
}
