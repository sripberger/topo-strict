import { NaniError } from 'nani';

/**
 * Base class for all errors defined by topo-strict. This class, as well as all
 * other error classes in this project, inherit from
 * [NaniError](https://sripberger.github.io/nani/#nanierror) and may use any of
 * the constructor arguments of that class.
 */
export class TopoStrictError extends NaniError {}
