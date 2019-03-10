import { TopoStrictError } from '../../lib/topo-strict-error';
import { ValidationError } from '../../lib/validation-error';

describe('ValidationError', function() {
	it('extends TopoStrictError', function() {
		expect(new ValidationError()).to.be.an.instanceof(TopoStrictError);
	});

	describe('::getDefaultMessage', function() {
		it('returns an appropriate message', function() {
			expect(ValidationError.getDefaultMessage()).to.equal(
				'Key validation failed'
			);
		});
	});
});
