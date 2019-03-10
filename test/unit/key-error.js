import { KeyError } from '../../lib/key-error';
import { TopoStrictError } from '../../lib/topo-strict-error';

describe('KeyError', function() {
	it('extends TopoStrictError', function() {
		expect(new KeyError()).to.be.an.instanceof(TopoStrictError);
	});
});
