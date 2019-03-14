import { TopoStrictError } from './topo-strict-error';

/**
 * Error class used to indicate when invalid arguments were passed to
 * Problem#add, or when the problem is in an invalid state-- i.e. missing keys
 * referenced by constraints-- when calling Problem#solve or Problem#toGraph.
 *
 * The reasons for failure will be instances of [KeyError](#keyerror) in the
 * ValidationError's cause chain.
 */
export class ValidationError extends TopoStrictError {
	static getDefaultMessage() {
		return 'Key validation failed';
	}
}
