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
		let values, options, _normalizeAddArgs;

		beforeEach(function() {
			values = [];
			options = {};
			_normalizeAddArgs = sinon.stub(Problem, '_normalizeAddArgs');
			_normalizeAddArgs.returns({ values, options });
			sinon.stub(problem, '_validateKeys');
		});

		it('normalizes args into values and options', function() {
			problem.add('foo', 'bar');

			expect(_normalizeAddArgs).to.be.calledOnce;
			expect(_normalizeAddArgs).to.be.calledOn(Problem);
			expect(_normalizeAddArgs).to.be.calledWith([ 'foo', 'bar' ]);
		});

		it('adds an empty item for each value', function() {
			values.push('foo', 'bar');

			problem.add();

			expect(problem.items).to.have.keys('foo', 'bar');
			expect(problem.items.foo).to.deep.equal({});
			expect(problem.items.bar).to.deep.equal({});
		});

		it('copies before property from options onto items, if any', function() {
			values.push('foo', 'bar');
			options.before = [ 'baz', 'qux' ];

			problem.add();

			expect(problem.items).to.have.keys('foo', 'bar');
			expect(problem.items.foo).to.deep.equal({ before: options.before });
			expect(problem.items.bar).to.deep.equal({ before: options.before });
		});

		it('copies after property from options onto items, if any', function() {
			values.push('foo', 'bar');
			options.after = [ 'baz', 'qux' ];

			problem.add();

			expect(problem.items).to.have.keys('foo', 'bar');
			expect(problem.items.foo).to.deep.equal({ after: options.after });
			expect(problem.items.bar).to.deep.equal({ after: options.after });
		});

		it('adds a group with copy of values, if group is specified', function() {
			values.push('foo', 'bar', 'baz');
			options.group = 'qux';

			problem.add();

			expect(problem.groups).to.have.keys('qux');
			expect(problem.groups.qux).to.deep.equal(values);
			expect(problem.groups.qux).to.not.equal(values);
		});

		it('appends to group values, if it already exists', function() {
			values.push('foo', 'bar');
			options.group = 'baz';
			problem.groups.baz = [ 'qux' ];

			problem.add();

			expect(problem.groups).to.have.keys('baz');
			expect(problem.groups.baz).to.deep.equal([ 'qux', 'foo', 'bar' ]);
		});

		it('invokes #_validateKeys with values and group', function() {
			values.push('foo', 'bar');
			options.group = 'baz';

			problem.add();

			expect(problem._validateKeys).to.be.calledOnce;
			expect(problem._validateKeys).to.be.calledOn(problem);
			expect(problem._validateKeys).to.be.calledWith(values, 'baz');
		});

		it('does not change instance if #_validateKeys throws', function() {
			problem.items = { foo: {} };
			problem.groups = { bar: [ 'foo' ] };
			values.push('baz');
			options.group = 'qux';
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
			problem.add([ 'foo', 'bar' ], 'baz');
		});
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

		it('gets key collision errors with unique string values', function() {
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

	describe('::_normalizeAddArgs', function() {
		const args = 'args';
		const values = 'values';
		const flattenedValues = 'flattened values';
		const options = 'options';
		const normalizedOptions = 'normalized options';
		let result;

		beforeEach(function() {
			sinon.stub(Problem, '_splitAddArgs').returns({ values, options });
			sinon.stub(_, 'flatten').returns(flattenedValues);
			sinon.stub(Problem, '_normalizeOptions').returns(normalizedOptions);

			result = Problem._normalizeAddArgs(args);
		});

		it('splits provided args', function() {
			expect(Problem._splitAddArgs).to.be.calledOnce;
			expect(Problem._splitAddArgs).to.be.calledOn(Problem);
			expect(Problem._splitAddArgs).to.be.calledWith(args);
		});

		it('flattens values from split args', function() {
			expect(_.flatten).to.be.calledOnce;
			expect(_.flatten).to.be.calledWith(values);
		});

		it('normalizes options from split args', function() {
			expect(Problem._normalizeOptions).to.be.calledOnce;
			expect(Problem._normalizeOptions).to.be.calledOn(Problem);
			expect(Problem._normalizeOptions).to.be.calledWith(options);
		});

		it('returns flattened values and normalized options', function() {
			expect(result).to.deep.equal({
				values: flattenedValues,
				options: normalizedOptions,
			});
		});
	});

	describe('::_splitAddArgs', function() {
		let options;

		beforeEach(function() {
			options = { foo: 'bar' };
		});

		it('splits array into values and options', function() {
			const values = [ 'baz', [ 'qux' ], 'quux' ];

			const result = Problem._splitAddArgs([ ...values, options ]);

			expect(result).to.deep.equal({ values, options });
		});

		it('defaults to empty options object', function() {
			const values = [ [ 'baz', 'qux' ], 'quux' ];

			const result = Problem._splitAddArgs([ ...values ]);

			expect(result).to.deep.equal({ values, options: {} });
		});
	});

	describe('::_normalizeOptions', function() {
		const before = 'before value';
		const normalizedBefore = 'normalized before value';
		const after = 'after value';
		const normalizedAfter = 'normalized after value';

		beforeEach(function() {
			sinon.stub(Problem, '_normalizeConstraint')
				.withArgs(before).returns(normalizedBefore)
				.withArgs(after).returns(normalizedAfter);
		});

		it('returns a copy of options', function() {
			const options = { foo: 'bar' };

			const result = Problem._normalizeOptions(options);

			expect(result).to.deep.equal(options);
			expect(result).to.not.equal(options);
		});

		it('normalizes before constraint, if present', function() {
			const options = { foo: 'bar', before };

			const result = Problem._normalizeOptions(options);

			expect(Problem._normalizeConstraint).to.be.calledOnce;
			expect(Problem._normalizeConstraint).to.be.calledOn(Problem);
			expect(Problem._normalizeConstraint).to.be.calledWith(before);
			expect(result).to.deep.equal({
				foo: 'bar',
				before: normalizedBefore,
			});
		});

		it('normalizes after constraint, if present', function() {
			const options = { foo: 'bar', after };

			const result = Problem._normalizeOptions(options);

			expect(Problem._normalizeConstraint).to.be.calledOnce;
			expect(Problem._normalizeConstraint).to.be.calledOn(Problem);
			expect(Problem._normalizeConstraint).to.be.calledWith(after);
			expect(result).to.deep.equal({
				foo: 'bar',
				after: normalizedAfter,
			});
		});

		it('normalizes both constraints, if present', function() {
			const options = { foo: 'bar', before, after };

			const result = Problem._normalizeOptions(options);

			expect(Problem._normalizeConstraint).to.be.calledTwice;
			expect(Problem._normalizeConstraint).to.always.be.calledOn(Problem);
			expect(Problem._normalizeConstraint).to.be.calledWith(before);
			expect(Problem._normalizeConstraint).to.be.calledWith(after);
			expect(result).to.deep.equal({
				foo: 'bar',
				before: normalizedBefore,
				after: normalizedAfter,
			});
		});
	});

	describe('::_normalizeConstraint', function() {
		it('returns constraint in an array, if it is a string', function() {
			const result = Problem._normalizeConstraint('foo');

			expect(result).to.deep.equal([ 'foo' ]);
		});

		it('returns a copy of the constraint, if it is an array', function() {
			const constraint = [ 'foo', 'bar' ];

			const result = Problem._normalizeConstraint(constraint);

			expect(result).to.deep.equal(constraint);
			expect(result).to.not.equal(constraint);
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
