import { TopoStrictError } from './topo-strict-error';

export class AddError extends TopoStrictError {
	static getDefaultMessage() {
		return 'Invalid arguments passed to add method';
	}
}
