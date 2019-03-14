import { KeyError } from './key-error';
import { Search } from './search';
import _ from 'lodash';

export class Graph {
	constructor() {
		this.nodesById = {};
	}

	get nodes() {
		return _.values(this.nodesById);
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

		const lines = [];
		if (nodeLines.length > 2) lines.push(nodeLines.join('\n'));
		if (edgeLines.length > 2) lines.push(edgeLines.join('\n'));

		return lines.join('\n\n') || 'Empty graph';
	}

	solve() {
		return new Search(this).run();
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
