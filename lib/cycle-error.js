import { TopoStrictError } from './topo-strict-error';

export class CycleError extends TopoStrictError {
	static getDefaultMessage({ id }) {
		let message = 'Cycle detected';
		if (id) message += ` at node with id '${id}'`;
		return message;
	}
}
