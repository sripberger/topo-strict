import * as utils from '../../lib/utils';
import { ArgumentError } from '../../lib/argument-error';
import { KeySet } from '../../lib/key-set';
import _ from 'lodash';

describe('KeySet', function() {
	describe('constructor', function() {
		let options;

		beforeEach(function() {
			options = {};
			sinon.stub(KeySet, '_normalizeArgs').returns(options);
		});

		it('normalizes args', function() {
			// eslint-disable-next-line no-new
			new KeySet('foo', 'bar');

			expect(KeySet._normalizeArgs).to.be.calledOnce;
			expect(KeySet._normalizeArgs).to.be.calledOn(KeySet);
			expect(KeySet._normalizeArgs).to.be.calledWith([ 'foo', 'bar' ]);
		});

		it('stores values from normalized args', function() {
			const values = options.values = [ 'value1', 'value2' ];

			const keySet = new KeySet();

			expect(keySet.values).to.equal(values);
		});

		it('stores before from normalized args', function() {
			const before = options.before = [ 'before1', 'before2' ];

			const keySet = new KeySet();

			expect(keySet.before).to.equal(before);
		});

		it('stores after from normalized args', function() {
			const after = options.after = [ 'after1', 'after2' ];

			const keySet = new KeySet();

			expect(keySet.after).to.equal(after);
		});

		it('stores group from normalized args', function() {
			const group = options.group = 'group key';

			const keySet = new KeySet();

			expect(keySet.group).to.equal(group);
		});

		it('defaults to null group', function() {
			const keySet = new KeySet();

			expect(keySet.group).to.be.null;
		});
	});

	describe('#_getDuplicateKeyErrors', function() {
		const duplicateValueErrors = [ new Error('foo'), new Error('bar') ];
		let keySet;

		beforeEach(function() {
			keySet = new KeySet('foo', 'bar', { group: 'baz' });
			sinon.stub(keySet, '_getDuplicateValueErrors')
				.returns(duplicateValueErrors.slice());
		});

		it('gets and returns duplicate value errors', function() {
			const result = keySet._getDuplicateKeyErrors();

			expect(keySet._getDuplicateValueErrors).to.be.calledOnce;
			expect(keySet._getDuplicateValueErrors).to.be.calledOn(keySet);
			expect(result).to.deep.equal(duplicateValueErrors);
		});

		it('appends an ArgumentError if group key appears in values', function() {
			keySet.group = 'bar';

			const result = keySet._getDuplicateKeyErrors();

			expect(result).to.have.length(3);
			expect(result.slice(0, 2)).to.deep.equal(duplicateValueErrors);
			expect(result[2]).to.be.an.instanceof(ArgumentError);
			expect(result[2].message).to.equal(
				'Group key \'bar\' also appears in values',
			);
			expect(result[2].info).to.deep.equal({ group: 'bar' });
		});
	});

	describe('#_getDuplicateValueErrors', function() {
		let keySet;

		beforeEach(function() {
			keySet = new KeySet('foo', 'bar');
			sinon.stub(utils, 'getDuplicates').returns([]);
		});

		it('gets duplicate values', function() {
			keySet._getDuplicateValueErrors();

			expect(utils.getDuplicates).to.be.calledOnce;
			expect(utils.getDuplicates).to.be.calledWith(keySet.values);
		});

		it('normally returns an empty array', function() {
			expect(keySet._getDuplicateValueErrors()).to.deep.equal([]);
		});

		it('returns ArgumentErrors for any duplicate values', function() {
			utils.getDuplicates.returns([ 'baz', 'qux' ]);

			const result = keySet._getDuplicateValueErrors();

			expect(result).to.have.length(2);
			expect(result[0]).to.be.an.instanceof(ArgumentError);
			expect(result[0].message).to.equal('Duplicate value \'baz\'');
			expect(result[0].info).to.deep.equal({ value: 'baz' });
			expect(result[1]).to.be.an.instanceof(ArgumentError);
			expect(result[1].message).to.equal('Duplicate value \'qux\'');
			expect(result[1].info).to.deep.equal({ value: 'qux' });
		});
	});

	describe('::_normalizeArgs', function() {
		const args = [ 'arg1', 'arg2' ];
		const normalizedValues = [ 'normalized1', 'normalized2' ];
		const flattenedValues = [ 'flattened1', 'flattened2' ];
		let normalizedArgs, result;

		beforeEach(function() {
			normalizedArgs = { foo: 'bar', values: normalizedValues };

			sinon.stub(KeySet, '_normalizeUnflattenedArgs')
				.returns(normalizedArgs);

			sinon.stub(_, 'flatten').returns(flattenedValues);

			result = KeySet._normalizeArgs(args);
		});

		it('normalizes args', function() {
			expect(KeySet._normalizeUnflattenedArgs).to.be.calledOnce;
			expect(KeySet._normalizeUnflattenedArgs).to.be.calledOn(KeySet);
			expect(KeySet._normalizeUnflattenedArgs).to.be.calledWith(args);
		});

		it('returns normalized args', function() {
			expect(result).to.equal(normalizedArgs);
		});

		it('flattens normalized values', function() {
			expect(_.flatten).to.be.calledOnce;
			expect(_.flatten).to.be.calledWith(normalizedValues);
		});

		it('overwites values with flattened values in result', function() {
			expect(result).to.deep.equal({
				foo: 'bar',
				values: flattenedValues,
			});
		});
	});

	describe('::_normalizeUnflattenedArgs', function() {
		const args = [ 'arg1', 'arg2' ];
		const values = [ 'value1', 'value2' ];
		const options = { foo: 'bar' };
		let normalizedOptions, result;

		beforeEach(function() {
			normalizedOptions = {
				baz: 'qux',
				values: [ 'value3', 'value4' ],
			};

			sinon.stub(KeySet, '_splitArgs').returns({ values, options });
			sinon.stub(KeySet, '_normalizeOptions').returns(normalizedOptions);

			result = KeySet._normalizeUnflattenedArgs(args);
		});

		it('splits provided args', function() {
			expect(KeySet._splitArgs).to.be.calledOnce;
			expect(KeySet._splitArgs).to.be.calledOn(KeySet);
			expect(KeySet._splitArgs).to.be.calledWith(args);
		});

		it('normalizes options from split args', function() {
			expect(KeySet._normalizeOptions).to.be.calledOnce;
			expect(KeySet._normalizeOptions).to.be.calledOn(KeySet);
			expect(KeySet._normalizeOptions).to.be.calledWith(options);
		});

		it('returns normalized options', function() {
			expect(result).to.equal(normalizedOptions);
		});

		it('prepends arg values to options values', function() {
			expect(result).to.deep.equal({
				baz: 'qux',
				values: [ 'value1', 'value2', 'value3', 'value4' ],
			});
		});
	});

	describe('::_splitArgs', function() {
		let options;

		beforeEach(function() {
			options = { foo: 'bar' };
		});

		it('splits array into values and options', function() {
			const values = [ 'baz', [ 'qux' ], 'quux' ];

			const result = KeySet._splitArgs([ ...values, options ]);

			expect(result).to.deep.equal({ values, options });
		});

		it('defaults to empty options object', function() {
			const values = [ [ 'baz', 'qux' ], 'quux' ];

			const result = KeySet._splitArgs([ ...values ]);

			expect(result).to.deep.equal({ values, options: {} });
		});
	});

	describe('::_normalizeOptions', function() {
		const values = 'values value';
		const normalizedValues = 'normalized values value';
		const before = 'before value';
		const normalizedBefore = 'normalized before value';
		const after = 'after value';
		const normalizedAfter = 'normalized after value';
		const originalOptions = { foo: 'bar', values, before, after };
		let options;

		beforeEach(function() {
			options = _.clone(originalOptions);

			sinon.stub(KeySet, '_normalizeArrayOption')
				.withArgs(values).returns(normalizedValues)
				.withArgs(before).returns(normalizedBefore)
				.withArgs(after).returns(normalizedAfter);
		});

		it('normalizes all three array options', function() {
			KeySet._normalizeOptions(options);

			expect(KeySet._normalizeArrayOption).to.be.calledThrice;
			expect(KeySet._normalizeArrayOption).to.always.be.calledOn(KeySet);
			expect(KeySet._normalizeArrayOption).to.be.calledWith(values);
			expect(KeySet._normalizeArrayOption).to.be.calledWith(before);
			expect(KeySet._normalizeArrayOption).to.be.calledWith(after);
		});

		it('returns copy with normalized array options', function() {
			const result = KeySet._normalizeOptions(options);

			expect(result).to.deep.equal({
				foo: 'bar',
				values: normalizedValues,
				before: normalizedBefore,
				after: normalizedAfter,
			});
		});

		it('sets empty arrays for non-existent array options', function() {
			delete options.values;
			delete options.before;
			delete options.after;

			const result = KeySet._normalizeOptions(options);

			expect(KeySet._normalizeArrayOption).to.not.be.called;
			expect(result).to.deep.equal({
				foo: 'bar',
				values: [],
				before: [],
				after: [],
			});
		});

		it('does not change original options', function() {
			KeySet._normalizeOptions(options);

			expect(options).to.deep.equal(originalOptions);
		});
	});

	describe('::_normalizeArrayOption', function() {
		it('returns a copy of the option, if it is an array', function() {
			const constraint = [ 'foo', 'bar' ];

			const result = KeySet._normalizeArrayOption(constraint);

			expect(result).to.deep.equal(constraint);
			expect(result).to.not.equal(constraint);
		});

		it('returns option in an array, if it is not an array', function() {
			const result = KeySet._normalizeArrayOption('foo');

			expect(result).to.deep.equal([ 'foo' ]);
		});
	});
});
