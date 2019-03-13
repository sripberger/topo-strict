import { KeyError } from './key-error';
import { values } from 'lodash';

export class Graph {
	constructor() {
		this.nodesById = {};
	}

	get nodes() {
		return values(this.nodesById);
	}

	addNode(id) {
		if (this.nodesById[id]) {
			throw new KeyError(
				`Id '${id}' is already in the graph`,
				{ info: { key: id } }
			);
		}
		this.nodesById[id] = { id, edges: [] };
	}

	addEdge(from, to) {
		this._getNode(from).edges.push(this._getNode(to));
	}

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
