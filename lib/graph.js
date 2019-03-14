import { KeyError } from './key-error';
import { Search } from './search';
import _ from 'lodash';

/**
 * Represents a directed graph which is used to solve a [Problem](#problem).
 */
export class Graph {
	constructor() {
		this.nodesById = {};
	}

	// eslint-disable-next-line jsdoc/require-returns
	/**
	 * An array of objects representing nodes in the graph. Each has an `id`
	 * property which contains the node's id, and an `edges` property which
	 * contains references to nodes that follow the node in the graph.
	 * @type {Array<Object>}
	 */
	get nodes() {
		return _.values(this.nodesById);
	}

	/**
	 * Adds a node to the graph with the provided id.
	 * @param {string} id - The id of the new node. A node with this id cannot
	 *   already appear in the graph.
	 */
	addNode(id) {
		if (this.nodesById[id]) {
			throw new KeyError(
				`Id '${id}' is already in the graph`,
				{ info: { key: id } }
			);
		}
		this.nodesById[id] = { id, edges: [] };
	}

	/**
	 * Adds an edge to the graph from one id to another id.
	 * @param {string} from - Source node of the edge. Must have a corresponding
	 *   node in the graph.
	 * @param {string} to - Target node of the edge. Must have a corresponding
	 *   node in the graph.
	 */
	addEdge(from, to) {
		this._getNode(from).edges.push(this._getNode(to));
	}

	/**
	 * Converts the graph into a string representation, ready to be printed to
	 * a console or otherwise displayed to a human user. Useful for debugging
	 * complicated dependency graphs.
	 * @returns {string} - Human-readable string representation of the graph.
	 */
	toString() {
		const nodeLines = [ 'nodes', '-----' ];
		const edgeLines = [ 'edges', '-----' ];
		for (const id of _.keys(this.nodesById).sort()) {
			nodeLines.push(id);
			const { edges } = this.nodesById[id];
			for (const edge of _.sortBy(edges, 'id')) {
				edgeLines.push(`from: ${id}, to: ${edge.id}`);
			}
		}

		const sections = [];
		if (nodeLines.length > 2) sections.push(nodeLines.join('\n'));
		if (edgeLines.length > 2) sections.push(edgeLines.join('\n'));

		return sections.join('\n\n') || 'Empty graph';
	}

	/**
	 * Performs a depth-first search through the graph, returning the result.
	 * Will throw a CycleError if a cycle is detected in the graph.
	 * @returns {Array<string>} - Sequence of node ids as they are visited by
	 *   the search.
	 */
	solve() {
		return new Search(this).run();
	}

	/**
	 * Fetches the node with the provided id. Will throw if no such node exists.
	 * @private
	 * @param {string} id - id of the desired node.
	 * @returns {Object} - Fetched node object.
	 */
	_getNode(id) {
		const node = this.nodesById[id];
		if (!node) {
			throw new KeyError(
				`Id '${id}' is not in the graph`,
				{ info: { key: id } }
			);
		}
		return node;
	}
}
