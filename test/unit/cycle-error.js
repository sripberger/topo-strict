import { CycleError } from '../../lib/cycle-error';
import { TopoStrictError } from '../../lib/topo-strict-error';

describe('CycleError', function() {
	it('extends TopoStrictError', function() {
		expect(new CycleError()).to.be.an.instanceof(TopoStrictError);
	});

	describe('::getDefaultMessage', function() {
		it('returns an appropriate message', function() {
			expect(CycleError.getDefaultMessage({})).to.equal('Cycle detected');
		});

		it('includes id from info, if any', function() {
			expect(CycleError.getDefaultMessage({ id: 'foo' })).to.equal(
				'Cycle detected at node with id \'foo\''
			);
		});
	});
});
