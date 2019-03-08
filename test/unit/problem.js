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
			sinon.stub(problem, '_validateKeys');
		});

		it('creates a key set with provided arguments', function() {
			problem.add('foo', 'bar');

			expect(keySetModule.KeySet).to.be.calledOnce;
			expect(keySetModule.KeySet).to.be.calledWithNew;
			expect(keySetModule.KeySet).to.be.calledWith('foo', 'bar');
		});

		it('adds an item for each key set value', function() {
			problem.items = { foo: {} };
			keySet.values.push('bar', 'baz');

			problem.add();

			expect(problem.items).to.have.keys('foo', 'bar', 'baz');
		});

		it('copies key set before and after property to items', function() {
			keySet.values.push('foo', 'bar');
			keySet.before = [ 'baz', 'qux' ];
			keySet.after = [ 'omg', 'wow' ];

			problem.add();

			expect(problem.items).to.have.keys('foo', 'bar');
			expect(problem.items.foo).to.deep.equal({
				before: keySet.before,
				after: keySet.after,
			});
		});

		it('adds a group with copy of values, if key set has one', function() {
			keySet.values.push('foo', 'bar', 'baz');
			keySet.group = 'qux';

			problem.add();

			expect(problem.groups).to.have.keys('qux');
			expect(problem.groups.qux).to.deep.equal(keySet.values);
			expect(problem.groups.qux).to.not.equal(keySet.values);
		});

		it('appends to group values, if they already exist', function() {
			keySet.values.push('foo', 'bar');
			keySet.group = 'baz';
			problem.groups.baz = [ 'qux' ];

			problem.add();

			expect(problem.groups).to.have.keys('baz');
			expect(problem.groups.baz).to.deep.equal([ 'qux', 'foo', 'bar' ]);
		});

		it('invokes #_validateKeys with values and group', function() {
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

		it('does not change instance if #_validateKeys throws', function() {
			problem.items = { foo: {} };
			problem.groups = { bar: [ 'foo' ] };
			keySet.values.push('baz');
			keySet.group = 'qux';
			problem._validateKeys.throws(new Error('omg'));

			expect(() => problem.add()).to.throw();
			expect(problem.items).to.deep.equal({ foo: {} });
			expect(problem.groups).to.deep.equal({ bar: [ 'foo' ] });
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

	describe('#_getKeyErrors', function() {
		const values = [ 'Value 1', 'Value 2' ];
		const groupKey = 'Group key';
		const before = [ 'Before 1', 'Before 2' ];
		const after = [ 'After 1', 'after 2' ];
		let result;

		beforeEach(function() {
			sinon.stub(problem, '_getInvalidKeyErrors')
				.returns([ 'foo', 'bar' ]);

			sinon.stub(problem, '_getKeyCollisionErrors')
				.returns([ 'baz', 'qux' ]);

			result = problem._getKeyErrors(values, groupKey, before, after);
		});

		it('gets invalid key errors from all arguments', function() {
			expect(problem._getInvalidKeyErrors).to.be.calledOnce;
			expect(problem._getInvalidKeyErrors).to.be.calledOn(problem);
			expect(problem._getInvalidKeyErrors).to.be.calledWith(
				values,
				groupKey,
				before,
				after
			);
		});

		it('gets key collision errors from values and group key', function() {
			expect(problem._getKeyCollisionErrors).to.be.calledOnce;
			expect(problem._getKeyCollisionErrors).to.be.calledOn(problem);
			expect(problem._getKeyCollisionErrors).to.be.calledWith(
				values,
				groupKey
			);
		});

		it('returns all fetched errors', function() {
			expect(result).to.deep.equal([ 'foo', 'bar', 'baz', 'qux' ]);
		});
	});

	describe('#_getInvalidKeyErrors', function() {
		it('gets all errors for non-string keys');
	});

	describe('#_getKeyCollisionErrors', function() {
		const values = [ 'foo', 1, 'bar', 'bar', true, {}, 'foo', 'baz' ];
		const groupKey = 'group key';
		let result;

		beforeEach(function() {
			sinon.stub(problem, '_getKeyInUseErrors')
				.returns([ 'omg', 'wow' ]);

			sinon.stub(Problem, '_getDuplicateKeyErrors')
				.returns([ 'wtf', 'ffs' ]);

			result = problem._getKeyCollisionErrors(values, groupKey);
		});

		it('gets key-in-use errors with unique string values', function() {
			expect(problem._getKeyInUseErrors).to.be.calledOnce;
			expect(problem._getKeyInUseErrors).to.be.calledOn(problem);
			expect(problem._getKeyInUseErrors).to.be.calledWith(
				[ 'foo', 'bar', 'baz' ],
				groupKey
			);
		});

		it('gets duplicate key errors with all string values', function() {
			expect(Problem._getDuplicateKeyErrors).to.be.calledOnce;
			expect(Problem._getDuplicateKeyErrors).to.be.calledOn(Problem);
			expect(Problem._getDuplicateKeyErrors).to.be.calledWith(
				[ 'foo', 'bar', 'bar', 'foo', 'baz' ],
				groupKey
			);
		});

		it('returns all fetched errors', function() {
			expect(result).to.deep.equal([ 'omg', 'wow', 'wtf', 'ffs' ]);
		});
	});

	describe('::_getKeyInUseErrors', function() {
		const values = [ 'foo', 'bar' ];
		const valueCollisionErrors = [ new Error('foo'), new Error('bar') ];

		beforeEach(function() {
			problem.items = { baz: {}, qux: {} };

			sinon.stub(problem, '_getValueInUseErrors')
				.returns(valueCollisionErrors.slice());
		});

		it('gets and returns value collision errors', function() {
			const result = problem._getKeyInUseErrors(values, 'wtf');

			expect(problem._getValueInUseErrors).to.be.calledOnce;
			expect(problem._getValueInUseErrors).to.be.calledOn(problem);
			expect(problem._getValueInUseErrors).to.be.calledWith(values);
			expect(result).to.deep.equal(valueCollisionErrors);
		});

		it('appends an ArgumentError if group key is an item key', function() {
			const result = problem._getKeyInUseErrors(values, 'qux');

			expect(result).to.have.length(3);
			expect(result.slice(0, 2)).to.deep.equal(valueCollisionErrors);
			expect(result[2]).to.be.an.instanceof(ArgumentError);
			expect(result[2].message).to.equal(
				'Group key \'qux\' is already in use as a value',
			);
			expect(result[2].info).to.deep.equal({ group: 'qux' });
		});
	});

	describe('#_getValueInUseErrors', function() {
		const values = [ 'foo', 'bar' ];
		let result;

		beforeEach(function() {
			sinon.stub(problem, '_getExistingValueErrors')
				.returns([ 'baz', 'qux' ]);
			sinon.stub(problem, '_getExistingGroupErrors')
				.returns([ 'wtf', 'omg' ]);

			result = problem._getValueInUseErrors(values);
		});

		it('gets errors for collisions with existing values', function() {
			expect(problem._getExistingValueErrors).to.be.calledOnce;
			expect(problem._getExistingValueErrors).to.be.calledOn(problem);
			expect(problem._getExistingValueErrors).to.be.calledWith(values);
		});

		it('gets errors for collisions with group keys', function() {
			expect(problem._getExistingGroupErrors).to.be.calledOnce;
			expect(problem._getExistingGroupErrors).to.be.calledOn(problem);
			expect(problem._getExistingGroupErrors).to.be.calledWith(values);
		});

		it('returns all fetched errors', function() {
			expect(result).to.deep.equal([ 'baz', 'qux', 'wtf', 'omg' ]);
		});
	});

	describe('#_getExistingValueErrors', function() {
		beforeEach(function() {
			sinon.stub(_, 'intersection').returns([]);
		});

		it('gets the intersection of values and item keys', function() {
			problem.items = { baz: {}, qux: {} };

			problem._getExistingValueErrors([ 'foo', 'bar' ]);

			expect(_.intersection).to.be.calledOnce;
			expect(_.intersection).to.be.calledWith(
				[ 'foo', 'bar' ],
				[ 'baz', 'qux' ]
			);
		});

		it('normally returns an empty array', function() {
			const result = problem._getExistingValueErrors([]);

			expect(result).to.deep.equal([]);
		});

		it('returns ArgumentErrors for each intersection result', function() {
			_.intersection.returns([ 'omg', 'wow' ]);

			const result = problem._getExistingValueErrors([]);

			expect(result).to.have.length(2);
			expect(result[0]).to.be.an.instanceof(ArgumentError);
			expect(result[0].message).to.equal(
				'Value \'omg\' has already been added'
			);
			expect(result[0].info).to.deep.equal({ value: 'omg' });
			expect(result[1]).to.be.an.instanceof(ArgumentError);
			expect(result[1].message).to.equal(
				'Value \'wow\' has already been added'
			);
			expect(result[1].info).to.deep.equal({ value: 'wow' });
		});
	});

	describe('#_getExistingGroupErrors', function() {
		beforeEach(function() {
			sinon.stub(_, 'intersection').returns([]);
		});

		it('gets the intersection of values and group keys', function() {
			problem.groups = { baz: [], qux: [] };

			problem._getExistingGroupErrors([ 'foo', 'bar' ]);

			expect(_.intersection).to.be.calledOnce;
			expect(_.intersection).to.be.calledWith(
				[ 'foo', 'bar' ],
				[ 'baz', 'qux' ]
			);
		});

		it('normally returns an empty array', function() {
			const result = problem._getExistingGroupErrors([]);

			expect(result).to.deep.equal([]);
		});

		it('returns ArgumentErrors for each intersection result', function() {
			_.intersection.returns([ 'omg', 'wtf' ]);

			const result = problem._getExistingGroupErrors([]);

			expect(result).to.have.length(2);
			expect(result[0]).to.be.an.instanceof(ArgumentError);
			expect(result[0].message).to.equal(
				'Value \'omg\' is already in use as a group key'
			);
			expect(result[0].info).to.deep.equal({ value: 'omg' });
			expect(result[1]).to.be.an.instanceof(ArgumentError);
			expect(result[1].message).to.equal(
				'Value \'wtf\' is already in use as a group key'
			);
			expect(result[1].info).to.deep.equal({ value: 'wtf' });
		});
	});

	describe('::_getDuplicateKeyErrors', function() {
		const values = [ 'foo', 'bar' ];
		const duplicateValueErrors = [ new Error('foo'), new Error('bar') ];

		beforeEach(function() {
			sinon.stub(Problem, '_getDuplicateValueErrors')
				.returns(duplicateValueErrors.slice());
		});

		it('gets and returns duplicate value errors', function() {
			const result = Problem._getDuplicateKeyErrors(values, 'baz');

			expect(Problem._getDuplicateValueErrors).to.be.calledOnce;
			expect(Problem._getDuplicateValueErrors).to.be.calledOn(Problem);
			expect(Problem._getDuplicateValueErrors).to.be.calledWith(values);
			expect(result).to.deep.equal(duplicateValueErrors);
		});

		it('appends an ArgumentError if group key appears in values', function() {
			const result = Problem._getDuplicateKeyErrors(values, 'bar');

			expect(result).to.have.length(3);
			expect(result.slice(0, 2)).to.deep.equal(duplicateValueErrors);
			expect(result[2]).to.be.an.instanceof(ArgumentError);
			expect(result[2].message).to.equal(
				'Group key \'bar\' also appears in values',
			);
			expect(result[2].info).to.deep.equal({ group: 'bar' });
		});
	});

	describe('::_getDuplicateValueErrors', function() {
		let values;

		beforeEach(function() {
			values = [ 'foo', 'bar' ];
			sinon.stub(utils, 'getDuplicates').returns([]);
		});

		it('gets duplicate values', function() {
			Problem._getDuplicateValueErrors(values);

			expect(utils.getDuplicates).to.be.calledOnce;
			expect(utils.getDuplicates).to.be.calledWith(values);
		});

		it('normally returns an empty array', function() {
			const result = Problem._getDuplicateValueErrors(values);

			expect(result).to.deep.equal([]);
		});

		it('returns ArgumentErrors for any duplicate values', function() {
			utils.getDuplicates.returns([ 'baz', 'qux' ]);

			const result = Problem._getDuplicateValueErrors(values);

			expect(result).to.have.length(2);
			expect(result[0]).to.be.an.instanceof(ArgumentError);
			expect(result[0].message).to.equal('Duplicate value \'baz\'');
			expect(result[0].info).to.deep.equal({ value: 'baz' });
			expect(result[1]).to.be.an.instanceof(ArgumentError);
			expect(result[1].message).to.equal('Duplicate value \'qux\'');
			expect(result[1].info).to.deep.equal({ value: 'qux' });
		});
	});
});
