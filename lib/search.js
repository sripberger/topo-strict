import { isEmpty, orderBy } from 'lodash';
import { CycleError } from './cycle-error';

export class Search {
	constructor(graph) {
		this.nodes = new Set(graph ? graph.nodes : []);
		this.markedNodes = new Set();
		this.result = [];
	}

	run() {
		while (!isEmpty(this.nodes)) {
			this._visitNode(this._getNextNode());
		}
		return this.result;
	}

	_getNextNode() {
		let result = null;
		for (const node of this.nodes) {
			if (!result || node.id > result.id) result = node;
		}
		return result;
	}

	_visitNode(node) {
		if (!this.nodes.has(node)) return;
		if (this.markedNodes.has(node)) {
			throw new CycleError({ info: { id: node.id } });
		}
		this.markedNodes.add(node);
		this._visitEdges(node);
		this.nodes.delete(node);
		this.result.unshift(node.id);
	}

	_visitEdges(node) {
		const edges = orderBy(node.edges, 'id', 'desc');
		for (const edge of edges) this._visitNode(edge);
	}
}
