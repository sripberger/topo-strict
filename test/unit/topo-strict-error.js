import { NaniError } from 'nani';
import { TopoStrictError } from '../../lib/topo-strict-error';

describe('TopoStrictError', function() {
	it('extends NaniError', function() {
		expect(new TopoStrictError()).to.be.an.instanceof(NaniError);
	});
});
