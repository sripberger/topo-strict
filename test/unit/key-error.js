import { ArgumentError } from '../../lib/argument-error';
import { TopoStrictError } from '../../lib/topo-strict-error';

describe('ArgumentError', function() {
	it('extends TopoStrictError', function() {
		expect(new ArgumentError()).to.be.an.instanceof(TopoStrictError);
	});
});
