import { TopoStrictError } from './topo-strict-error';

export class ValidationError extends TopoStrictError {
	static getDefaultMessage() {
		return 'Key validation failed';
	}
}
