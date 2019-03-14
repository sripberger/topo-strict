import { TopoStrictError } from './topo-strict-error';

/**
 * Error class used to indicate when a Problem key is not valid. Instances will
 * be contained in the cause chain of ValidationErrors produced when calling
 * Problem#add, Problem#solve, or Problem#toGraph.
 *
 * The offending key will appear in the instance's `info` property.
 */
export class KeyError extends TopoStrictError {}
