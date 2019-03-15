import { KeyError } from './key-error';
import { Search } from './search';
import _ from 'lodash';

/**
 * Represents a directed graph which is used to solve a [Problem](#problem).
 */
export class Graph {
	constructor() {
		/**
		 * Stores graph nodes keyed by their id. Each node is an object with an
		 * `id` property and an 'edges' property which may reference other
		 * nodes.
		 * @private
		 * @type {Object}
		 */
		this._nodesById = {};
	}

	// eslint-disable-next-line jsdoc/require-returns
	/**
	 * An array of objects representing nodes in the graph. Each has an `id`
	 * property which contains the node's id, and an `edges` property which
	 * contains references to nodes that follow the node in the graph.
	 * @type {Array<Object>}
	 */
	get nodes() {
		return _.values(this._nodesById);
	}

	/**
	 * Adds a node to the graph with the provided id.
	 * @param {string} id - The id of the new node. A node with this id cannot
	 *   already appear in the graph.
	 */
	addNode(id) {
		if (this._nodesById[id]) {
			throw new KeyError(
				`Id '${id}' is already in the graph`,
				{ info: { key: id } }
			);
		}
		this._nodesById[id] = { id, edges: [] };
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
	 * Returns a canonical plain object representation of the graph, with all
	 * nodes and edges sorted alphabetically. This is used as the basis for
	 * `#toString`, so overriding it will also change the behavior of
	 * `#toString`.
	 * @returns {Object} - An object representation of the graph with two
	 *   properties:
	 *     - `nodes`: An array of id strings that have been added as nodes.
	 *     - `edges`: An array of edge objects, each with string `from` and `to`
	 *       properties identifying its source node and target node.
	 *
	 */
	toObject() {
		return {
			nodes: _.keys(this._nodesById).sort(),
			edges: _(this.nodes)
				.sortBy('id')
				.map(getEdgeObjects)
				.flatten()
				.value(),
		};
	}

	/**
	 * Converts the graph into a string representation, ready to be printed to
	 * a console or otherwise displayed to a human user. Useful for debugging
	 * complicated dependency graphs.
	 * @returns {string} - Human-readable string representation of the graph.
	 */
	toString() {
		// Convert the graph to an object.
		const { nodes, edges } = this.toObject();

		// Get lines for the nodes section.
		const nodeLines = [ 'nodes', '-----' ];
		for (const id of nodes) nodeLines.push(id);

		// Get lines for the edges section.
		const edgeLines = [ 'edges', '-----' ];
		for (const { from, to } of edges) {
			edgeLines.push(`from: ${from}, to: ${to}`);
		}

		// Build a list of sections, ignoring any empty ones.
		const sections = [];
		if (nodeLines.length > 2) sections.push(nodeLines.join('\n'));
		if (edgeLines.length > 2) sections.push(edgeLines.join('\n'));

		// Return joined sections or an empty graph indicator.
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
	 * Internal helper method for `#addEdge`. Fetches the node with the provided
	 * id. Will throw if no such node exists.
	 * @private
	 * @param {string} id - id of the desired node.
	 * @returns {Object} - Fetched node object.
	 */
	_getNode(id) {
		const node = this._nodesById[id];
		if (!node) {
			throw new KeyError(
				`Id '${id}' is not in the graph`,
				{ info: { key: id } }
			);
		}
		return node;
	}
}

/**
 * Helper function for Graph#toObject. Retrieves plain object representations
 * of a node's edges.
 * @private
 * @param {Object} node - node object from the graph.
 * @returns {Object} - Plain object representation of the node's edges.
 */
function getEdgeObjects(node) {
	const { id, edges } = node;
	return _.sortBy(edges, 'id').map((edge) => ({ from: id, to: edge.id }));
}
