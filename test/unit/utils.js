import { getDuplicates } from '../../lib/utils';

describe('Internal utils', function() {
	describe('getDuplicates', function() {
		it('returns unique duplicated values in an array', function() {
			const arr = [ 'foo', 'bar', 'bar', 'foo', 'baz', 'foo' ];

			expect(getDuplicates(arr)).to.deep.equal([ 'foo', 'bar' ]);
		});
	});
});
