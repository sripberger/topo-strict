import { KeyError } from './key-error';

export class Graph {
	constructor() {
		this.nodes = {};
	}

	addNode(value) {
		if (this.nodes[value]) {
			throw new KeyError(
				`'${value}' is already a node in the graph`,
				{ info: { key: value } }
			);
		}
		this.nodes[value] = { value, edges: [] };
	}

	addEdge(from, to) {
		this._getNode(from).edges.push(this._getNode(to));
	}

	_getNode(value) {
		const node = this.nodes[value];
		if (!node) {
			throw new KeyError(
				`'${value}' is not a node in the graph`,
				{ info: { key: value } }
			);
		}
		return node;
	}
}
