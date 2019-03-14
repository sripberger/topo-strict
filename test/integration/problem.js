const {
	CycleError,
	KeyError,
	Problem,
	ValidationError,
} = require('../../cjs');

const _ = require('lodash');
const nani = require('nani');

describe('Problem', function() {
	it('can perform a deterministic topological sort', function() {
		// Create a problem.
		const problem = new Problem();

		// Add some stuff using various add signatures.
		problem.add('foo', { before: 'bar' });
		problem.add('bar', 'baz');
		problem.add('qux', { after: 'baz' });
		problem.add('quux', { before: 'baz', after: 'foo' });
		problem.add({ ids: [ 'wtf', 'omg' ], after: 'qux' });
		problem.add({ ids: 'wow', after: 'omg' });

		// Solve it and check the result.
		expect(problem.solve()).to.deep.equal([
			'foo',
			'bar',
			'quux',
			'baz',
			'qux',
			'omg',
			'wow',
			'wtf',
		]);
	});

	it('supports groups and multi-constraints', function() {
		// Create a problem.
		const problem = new Problem();

		// Add some stuff with groups and multi-constraints.
		problem.add('Nap', { after: 'breakfast' });
		problem.add('Pour juice', 'Pour cereal', { group: 'prepCold' });
		problem.add('Make coffee', 'Make toast', { group: 'prepHot' });
		problem.add('Eat breakfast', {
			group: 'breakfast',
			after: [ 'prepCold', 'prepHot' ],
		});
		problem.add('Wake up', { before: [ 'prepCold', 'prepHot' ] });

		// Solve it and check the result.
		expect(problem.solve()).to.deep.equal([
			'Wake up',
			'Make coffee',
			'Make toast',
			'Pour cereal',
			'Pour juice',
			'Eat breakfast',
			'Nap',
		]);

		// Add some more stuff to the prepHot group.
		problem.add('Fry bacon', { group: 'prepHot' });

		// Solve it again and make sure the new item is in the proper place.
		expect(problem.solve()).to.deep.equal([
			'Wake up',
			'Fry bacon',
			'Make coffee',
			'Make toast',
			'Pour cereal',
			'Pour juice',
			'Eat breakfast',
			'Nap',
		]);
	});

	it('detects cycles when solving', function() {
		// Create a problem.
		const problem = new Problem();

		// Add some stuff that will cause a cycle.
		problem.add('foo');
		problem.add('bar', { after: 'foo' });
		problem.add('baz', { after: 'bar', before: 'foo' });

		// Try to solve, make sure it throws.
		expect(() => {
			problem.solve();
		}).to.throw(CycleError).that.satisfies((err) => {
			expect(err.info.id).to.equal('foo');
			return true;
		});
	});

	it('detects unknown constraint keys when solving', function() {
		// Create a problem.
		const problem = new Problem();

		// Add some stuff, but leave some unknown constraint keys.
		problem.add('foo', {
			before: [ 'bar', 'qux', 'group2' ],
			after: [ 'group1', 'baz', 'omg' ],
		});
		problem.add('bar', { group: 'group1' });
		problem.add('baz');

		// Try to solve, make sure it throws.
		expect(() => {
			problem.solve();
		}).to.throw(ValidationError).that.satisfies((err) => {
			// Check the key errors inside the validation error.
			const keyErrors = nani.filter(err, KeyError);
			expect(keyErrors).to.have.length(3);
			expect(_.map(keyErrors, 'info.key')).to.have.members([
				'qux',
				'group2',
				'omg',
			]);
			return true;
		});
	});

	it('prevents colliding and invalid keys when adding', function() {
		// Create a problem.
		const problem = new Problem();

		// Add some valid stuff.
		problem.add('foo', 'bar', { group: 'group1' });

		// Try adding some colliding and invalid keys, make sure it throws.
		expect(() => {
			problem.add([
				'foo',
				'wow',
				'omg',
				'group1',
				42,
				'bar',
				null,
				'baz',
				'omg',
			], { group: 'wow', before: 0, after: [ 'qux', true ] });
		}).to.throw(ValidationError).that.satisfies((err) => {
			// Check the key errors inside the validation error.
			const keyErrors = nani.filter(err, KeyError);
			expect(keyErrors).to.have.length(9);
			expect(_.map(keyErrors, 'info.key')).to.have.members([
				42,
				null,
				0,
				true,
				'omg',
				'wow',
				'foo',
				'bar',
				'group1',
			]);
			return true;
		});

		// Make sure invalid group keys are also prevented.
		expect(() => {
			problem.add('baz', { group: false });
		}).to.throw(ValidationError).that.satisfies((err) => {
			// Check the key errors inside the validation error.
			const keyErrors = nani.filter(err, KeyError);
			expect(keyErrors).to.have.length(1);
			expect(keyErrors[0].info.key).to.be.false;
			return true;
		});

		// Make sure colliding groups keys are also prevented.
		expect(() => {
			problem.add('baz', { group: 'foo' });
		}).to.throw(ValidationError).that.satisfies((err) => {
			// Check the key errors inside the validation error.
			const keyErrors = nani.filter(err, KeyError);
			expect(keyErrors).to.have.length(1);
			expect(keyErrors[0].info.key).to.equal('foo');
			return true;
		});
	});
});
