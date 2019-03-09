import * as keySetModule from '../../lib/key-set';
import * as utils from '../../lib/utils';
import { ArgumentError } from '../../lib/argument-error';
import { Problem } from '../../lib/problem';
import _ from 'lodash';

describe('Problem', function() {
	let problem;

	beforeEach(function() {
		problem = new Problem();
	});

	it('creates an object for storing items', function() {
		expect(problem.items).to.deep.equal({});
	});

	it('creates an object for storing groups', function() {
		expect(problem.groups).to.deep.equal({});
	});

	describe('#add', function() {
		let keySet;

		beforeEach(function() {
			keySet = new keySetModule.KeySet();
			sinon.stub(keySetModule, 'KeySet').returns(keySet);
			sinon.stub(problem, '_addKeySet');
			sinon.stub(problem, '_validateKeys');
		});

		it('creates a key set with provided arguments', function() {
			problem.add('foo', 'bar');

			expect(keySetModule.KeySet).to.be.calledOnce;
			expect(keySetModule.KeySet).to.be.calledWithNew;
			expect(keySetModule.KeySet).to.be.calledWith('foo', 'bar');
		});

		it('adds the key set to the problem', function() {
			problem.add();

			expect(problem._addKeySet).to.be.calledOnce;
			expect(problem._addKeySet).to.be.calledOn(problem);
			expect(problem._addKeySet).to.be.calledWith(keySet);
		});

		it('invokes #_validateKeys with key set values and group', function() {
			keySet.values.push('foo', 'bar');
			keySet.group = 'baz';

			problem.add();

			expect(problem._validateKeys).to.be.calledOnce;
			expect(problem._validateKeys).to.be.calledOn(problem);
			expect(problem._validateKeys).to.be.calledWith(
				keySet.values,
				keySet.group
			);
		});

		it('does not add the key set if #_validateKeys throws', function() {
			problem._validateKeys.throws(new Error('omg'));

			expect(() => problem.add()).to.throw();
			expect(problem._addKeySet).to.not.be.called;
		});
	});

	describe('#_addKeySet', function() {
		let keySet;

		beforeEach(function() {
			keySet = new keySetModule.KeySet();
		});

		it('adds an item for each key set value', function() {
			problem.items = { foo: {} };
			keySet.values.push('bar', 'baz');

			problem._addKeySet(keySet);

			expect(problem.items).to.have.keys('foo', 'bar', 'baz');
		});

		it('copies key set before and after property to items', function() {
			keySet.values.push('foo');
			keySet.before = [ 'bar', 'baz' ];
			keySet.after = [ 'omg', 'wow' ];

			problem._addKeySet(keySet);

			expect(problem.items.foo).to.deep.equal({
				before: keySet.before,
				after: keySet.after,
			});
		});

		it('skips empty before property', function() {
			keySet.values.push('foo');
			keySet.after = [ 'bar' ];

			problem._addKeySet(keySet);

			expect(problem.items.foo).to.deep.equal({ after: keySet.after });
		});

		it('skips empty after property', function() {
			keySet.values.push('foo');
			keySet.before = [ 'bar' ];

			problem._addKeySet(keySet);

			expect(problem.items.foo).to.deep.equal({ before: keySet.before });
		});

		it('adds a group with values, if key set has one', function() {
			keySet.values.push('foo', 'bar', 'baz');
			keySet.group = 'qux';

			problem._addKeySet(keySet);

			expect(problem.groups).to.have.keys('qux');
			expect(problem.groups.qux).to.deep.equal([ 'foo', 'bar', 'baz' ]);
		});

		it('appends to group values, if they already exist', function() {
			keySet.values.push('foo', 'bar');
			keySet.group = 'baz';
			problem.groups.baz = [ 'qux' ];

			problem._addKeySet(keySet);

			expect(problem.groups).to.have.keys('baz');
			expect(problem.groups.baz).to.deep.equal([ 'qux', 'foo', 'bar' ]);
		});
	});

	describe('_validateKeys', function() {
		it('throws if there is a duplicate in the provided values');

		it('throws if the group key appears in values');

		it('throws if a value already has an item');

		it('throws if the group key already has an item');

		it('throws if a value is already in use as a group key');

		it('does nothing if everything is ok', function() {
			problem._validateKeys([ 'foo', 'bar' ], 'baz');
		});
	});
});
