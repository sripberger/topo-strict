import { TopoStrictError } from './topo-strict-error';

/**
 * Error class used to indicate when a cycle is detected while trying to solve
 * a Problem or Graph.
 */
export class CycleError extends TopoStrictError {
	static getDefaultMessage({ id }) {
		let message = 'Cycle detected';
		if (id) message += ` at node with id '${id}'`;
		return message;
	}
}
