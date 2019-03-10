import { KeyError } from './key-error';

export class Graph {
	constructor() {
		this.nodes = {};
	}

	add(value, constraints = {}) {
		if (this.nodes[value]) {
			throw new KeyError(
				`Value '${value}' is already in the graph`,
				{ info: { key: value } }
			);
		}

		const node = this.nodes[value] = { value, edges: [] };
		const { before = [], after = [] } = constraints;
		for (const key of before) node.edges.push(this.nodes[key]);
		for (const key of after) this.nodes[key].edges.push(node);
	}
}
