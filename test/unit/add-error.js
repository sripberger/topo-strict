import { AddError } from '../../lib/add-error';
import { TopoStrictError } from '../../lib/topo-strict-error';

describe('AddError', function() {
	it('extends TopoStrictError', function() {
		expect(new AddError()).to.be.an.instanceof(TopoStrictError);
	});

	describe('::getDefaultMessage', function() {
		it('returns an appropriate message', function() {
			expect(AddError.getDefaultMessage({})).to.equal(
				'Invalid arguments passed to add method'
			);
		});
	});
});
