import { KeyError } from './key-error';

export class Graph {
	constructor() {
		this.nodes = {};
	}

	addNode(id) {
		if (this.nodes[id]) {
			throw new KeyError(
				`Id '${id}' is already in the graph`,
				{ info: { key: id } }
			);
		}
		this.nodes[id] = { id, edges: [] };
	}

	addEdge(from, to) {
		this._getNode(from).edges.push(this._getNode(to));
	}

	_getNode(id) {
		const node = this.nodes[id];
		if (!node) {
			throw new KeyError(
				`Id '${id}' is not in the graph`,
				{ info: { key: id } }
			);
		}
		return node;
	}
}
