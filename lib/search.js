import { isEmpty, orderBy } from 'lodash';
import { CycleError } from './cycle-error';

/**
 * Internal class responsible for performing depth-first searches on Graph
 * instances.
 * @private
 * @param {Graph} - Graph instance to search.
 */
export class Search {
	constructor(graph) {
		/**
		 * Used to store node objects that still need to be searched.
		 * @private
		 * @type {Set<Object>}
		 */
		this._nodes = new Set(graph ? graph.nodes : []);

		/**
		 * Used to store node objects that have already been visited.
		 * important for detecting cycles.
		 * @private
		 * @type {Set<Object>}
		 */
		this._markedNodes = new Set();

		/**
		 * Used to store node ids as the search is performed..
		 * Will hold the final result when the search is complete.
		 * @private
		 * @type {Array<string>}
		 */
		this._result = [];
	}

	/**
	 * Runs the search and returns the result. Will throw a CycleError if a
	 * cycle is detected.
	 * @returns {Array<string>} - Sequence of ids.
	 */
	run() {
		while (!isEmpty(this._nodes)) {
			this._visitNode(this._getNextNode());
		}
		return this._result;
	}

	/**
	 * Fetches the next node object that should be visited. Prioritizes nodes
	 * in reverse alphabetical order.
	 * @private
	 * @returns {Object} - Node object.
	 */
	_getNextNode() {
		let result = null;
		for (const node of this._nodes) {
			if (!result || node.id > result.id) result = node;
		}
		return result;
	}

	// eslint-disable-next-line jsdoc/require-returns
	/**
	 * Visits a single node as part of the dept-first search.
	 * @private
	 * @param {Object} node - Node object to visit.
	 */
	_visitNode(node) {
		// Do nothing if the node is no longer part of the search.
		if (!this._nodes.has(node)) return;

		// If the node is marked, this must be a cycle.
		if (this._markedNodes.has(node)) {
			throw new CycleError({ info: { id: node.id } });
		}

		// Mark the node to detect cycles.
		this._markedNodes.add(node);

		// Visit all of the node's edge nodes.
		this._visitEdges(node);

		// We've visited the node and everything it points to without finding a
		// cycle, so we can ignore it from now on. Remove it from the search.
		this._nodes.delete(node);

		// Prepend the node's id to the search result.
		this._result.unshift(node.id);
	}

	/**
	 * Visits all a node's edge nodes.
	 * @private
	 * @param {Object} node - Node object with edges to visit.
	 */
	_visitEdges(node) {
		const edges = orderBy(node.edges, 'id', 'desc');
		for (const edge of edges) this._visitNode(edge);
	}
}
