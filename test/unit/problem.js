import * as keySetModule from '../../lib/key-set';
import { Problem } from '../../lib/problem';

describe('Problem', function() {
	let problem;

	beforeEach(function() {
		problem = new Problem();
	});

	it('creates an object for storing ids with their constraints', function() {
		expect(problem.ids).to.deep.equal({});
	});

	it('creates an object for storing groups with their ids', function() {
		expect(problem.groups).to.deep.equal({});
	});

	describe('@keys', function() {
		it('returns categorized keys from ids and groups', function() {
			problem.ids = { foo: {}, bar: {} };
			problem.groups = { baz: [], qux: [] };
			problem.randomProp = { omg: 'wtf' };

			expect(problem.keys).to.deep.equal({
				ids: [ 'foo', 'bar' ],
				groups: [ 'baz', 'qux' ],
			});
		});
	});

	describe('#add', function() {
		let keySet;

		beforeEach(function() {
			keySet = new keySetModule.KeySet();
			sinon.stub(keySetModule, 'KeySet').returns(keySet);
			sinon.stub(keySet, 'validate');
			sinon.stub(problem, '_addKeySet');
		});

		it('creates a key set with provided arguments', function() {
			problem.add('foo', 'bar');

			expect(keySetModule.KeySet).to.be.calledOnce;
			expect(keySetModule.KeySet).to.be.calledWithNew;
			expect(keySetModule.KeySet).to.be.calledWith('foo', 'bar');
		});

		it('validates the key set with existing keys', function() {
			const existingKeys = {};
			sinon.stub(problem, 'keys').get(() => existingKeys);

			problem.add();

			expect(keySet.validate).to.be.calledOnce;
			expect(keySet.validate).to.be.calledOn(keySet);
			expect(keySet.validate).to.be.calledWith(
				sinon.match.same(existingKeys)
			);
		});

		it('adds the key set to the problem', function() {
			problem.add();

			expect(problem._addKeySet).to.be.calledOnce;
			expect(problem._addKeySet).to.be.calledOn(problem);
			expect(problem._addKeySet).to.be.calledWith(keySet);
		});

		it('does not add the key set if validation throws', function() {
			keySet.validate.throws(new Error('omg'));

			expect(() => problem.add()).to.throw();
			expect(problem._addKeySet).to.not.be.called;
		});
	});

	describe('#_addKeySet', function() {
		let keySet;

		beforeEach(function() {
			keySet = new keySetModule.KeySet();
		});

		it('adds entry for each id', function() {
			problem.ids = { foo: {} };
			keySet.ids.push('bar', 'baz');

			problem._addKeySet(keySet);

			expect(problem.ids).to.have.keys('foo', 'bar', 'baz');
		});

		it('copies constraints to new entries', function() {
			keySet.ids.push('foo');
			keySet.before = [ 'bar', 'baz' ];
			keySet.after = [ 'omg', 'wow' ];

			problem._addKeySet(keySet);

			expect(problem.ids.foo).to.deep.equal({
				before: keySet.before,
				after: keySet.after,
			});
		});

		it('skips empty before constraint', function() {
			keySet.ids.push('foo');
			keySet.after = [ 'bar' ];

			problem._addKeySet(keySet);

			expect(problem.ids.foo).to.deep.equal({ after: keySet.after });
		});

		it('skips empty after constraint', function() {
			keySet.ids.push('foo');
			keySet.before = [ 'bar' ];

			problem._addKeySet(keySet);

			expect(problem.ids.foo).to.deep.equal({ before: keySet.before });
		});

		it('adds a group with ids, if key set has one', function() {
			keySet.ids.push('foo', 'bar', 'baz');
			keySet.group = 'qux';

			problem._addKeySet(keySet);

			expect(problem.groups).to.have.keys('qux');
			expect(problem.groups.qux).to.deep.equal([ 'foo', 'bar', 'baz' ]);
		});

		it('appends to group ids, if they already exist', function() {
			keySet.ids.push('foo', 'bar');
			keySet.group = 'baz';
			problem.groups.baz = [ 'qux' ];

			problem._addKeySet(keySet);

			expect(problem.groups).to.have.keys('baz');
			expect(problem.groups.baz).to.deep.equal([ 'qux', 'foo', 'bar' ]);
		});
	});
});
