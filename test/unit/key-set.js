import * as nani from 'nani';
import * as utils from '../../lib/utils';
import { KeySet } from '../../lib/key-set';
import { ValidationError } from '../../lib/validation-error';
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
			expect(new KeySet().group).to.be.null;
		});

		it('supports falsy groups', function() {
			options.group = false;

			const keySet = new KeySet();

			expect(keySet.group).to.be.false;
		});
	});

	describe('#validate', function() {
		const existingKeys = { items: [], groups: [] };
		const errors = [ new Error('foo'), new Error('bar') ];
		let keySet;

		beforeEach(function() {
			keySet = new KeySet();
			sinon.stub(keySet, '_getErrors').returns(errors);
			sinon.stub(nani, 'fromArray').returns(null);
		});

		it('gets errors based on existing keys', function() {
			keySet.validate(existingKeys);

			expect(keySet._getErrors).to.be.calledOnce;
			expect(keySet._getErrors).to.be.calledOn(keySet);
			expect(keySet._getErrors).to.be.calledWith(existingKeys);
		});

		it('wraps errors using nani.fromArray', function() {
			keySet.validate(existingKeys);

			expect(nani.fromArray).to.be.calledOnce;
			expect(nani.fromArray).to.be.calledWith(errors);
		});

		it('throws a ValidationError if fromArray result is not null', function() {
			const errorFromArray = new Error('Error from array');
			nani.fromArray.returns(errorFromArray);

			expect(() => {
				keySet.validate(existingKeys);
			}).to.throw(ValidationError).that.satisfies((err) => {
				const defaultMessage = ValidationError.getDefaultMessage();
				expect(err.shortMessage).to.equal(defaultMessage);
				expect(err.cause).to.equal(errorFromArray);
				return true;
			});
		});
	});

	describe('#_getErrors', function() {
		const existingKeys = { items: [], groups: [] };
		const fooInfo = { name: 'foo' };
		const barInfo = { name: 'bar' };
		const fooErr = new Error('foo');
		const barErr = new Error('bar');
		let keySet, result;

		beforeEach(function() {
			keySet = new KeySet();
			sinon.stub(keySet, '_getErrorInfo').returns([ fooInfo, barInfo ]);
			sinon.stub(utils, 'getErrorForInfo')
				.withArgs(fooInfo).returns(fooErr)
				.withArgs(barInfo).returns(barErr);

			result = keySet._getErrors(existingKeys);
		});

		it('gets error info', function() {
			expect(keySet._getErrorInfo).to.be.calledOnce;
			expect(keySet._getErrorInfo).to.be.calledOn(keySet);
			expect(keySet._getErrorInfo).to.be.calledWith(existingKeys);
		});

		it('gets error for each info', function() {
			expect(utils.getErrorForInfo).to.be.calledTwice;
			expect(utils.getErrorForInfo).to.be.calledWith(fooInfo);
			expect(utils.getErrorForInfo).to.be.calledWith(barInfo);
		});

		it('returns fetched errors', function() {
			expect(result).to.deep.equal([ fooErr, barErr ]);
		});
	});

	describe('#_getErrorInfo', function() {
		const existingKeys = { items: [], groups: [] };
		let keySet, result;

		beforeEach(function() {
			keySet = new KeySet();
			sinon.stub(keySet, '_getInvalidKeyInfo').returns([ 'foo', 'bar' ]);
			sinon.stub(keySet, '_getDuplicationInfo').returns([ 'baz' ]);
			sinon.stub(keySet, '_getCollisionInfo').returns([ 'qux' ]);

			result = keySet._getErrorInfo(existingKeys);
		});

		it('gets info for invalid keys', function() {
			expect(keySet._getInvalidKeyInfo).to.be.calledOnce;
			expect(keySet._getInvalidKeyInfo).to.be.calledOn(keySet);
		});

		it('gets info for duplicate keys', function() {
			expect(keySet._getDuplicationInfo).to.be.calledOnce;
			expect(keySet._getDuplicationInfo).to.be.calledOn(keySet);
		});

		it('gets info for colliding keys', function() {
			expect(keySet._getCollisionInfo).to.be.calledOnce;
			expect(keySet._getCollisionInfo).to.be.calledOn(keySet);
			expect(keySet._getCollisionInfo).to.be.calledWith(existingKeys);
		});

		it('returns all fetched info', function() {
			expect(result).to.deep.equal([ 'foo', 'bar', 'baz', 'qux' ]);
		});
	});

	describe('#_getInvalidKeyInfo', function() {
		it('returns info objects for empty or non-string keys', function() {
			const keySet = new KeySet({
				values: [ 'value1', 42, { foo: 'bar' }, 'value2', '' ],
				before: [ '', 'before1', 0, 'before2' ],
				after: [ 'after1', 'after2', '', false ],
				group: 'group key',
			});

			expect(keySet._getInvalidKeyInfo()).to.deep.equal([
				{ type: 'invalidKey', keyType: 'value', key: 42 },
				{ type: 'invalidKey', keyType: 'value', key: { foo: 'bar' } },
				{ type: 'invalidKey', keyType: 'value', key: '' },
				{ type: 'invalidKey', keyType: 'before', key: '' },
				{ type: 'invalidKey', keyType: 'before', key: 0 },
				{ type: 'invalidKey', keyType: 'after', key: '' },
				{ type: 'invalidKey', keyType: 'after', key: false },
			]);
		});

		it('appends info for group key, it it is not a string', function() {
			const keySet = new KeySet({
				values: true,
				before: 42,
				after: 0,
				group: false,
			});

			expect(keySet._getInvalidKeyInfo()).to.deep.equal([
				{ type: 'invalidKey', keyType: 'value', key: true },
				{ type: 'invalidKey', keyType: 'before', key: 42 },
				{ type: 'invalidKey', keyType: 'after', key: 0 },
				{ type: 'invalidKey', keyType: 'group', key: false },
			]);
		});

		it('appends info for group key, it it is an empty string', function() {
			const keySet = new KeySet({ group: '' });

			expect(keySet._getInvalidKeyInfo()).to.deep.equal([
				{ type: 'invalidKey', keyType: 'group', key: '' },
			]);
		});

		it('ignores null group key', function() {
			const keySet = new KeySet();

			expect(keySet._getInvalidKeyInfo()).to.deep.equal([]);
		});
	});

	describe('#_getDuplicationInfo', function() {
		let keySet;

		beforeEach(function() {
			keySet = new KeySet('foo', 'bar', { group: 'baz' });
			sinon.stub(utils, 'getDuplicates').returns([ 'dup1', 'dup2' ]);
		});

		it('gets duplicate values', function() {
			keySet._getDuplicationInfo();

			expect(utils.getDuplicates).to.be.calledOnce;
			expect(utils.getDuplicates).to.be.calledWith(keySet.values);
		});

		it('maps duplicate values to objects with necessary info', function() {
			expect(keySet._getDuplicationInfo()).to.deep.equal([
				{ type: 'duplication', keyType: 'value', key: 'dup1' },
				{ type: 'duplication', keyType: 'value', key: 'dup2' },
			]);
		});

		it('appends object for group key being duplicated in values', function() {
			keySet.group = 'bar';

			expect(keySet._getDuplicationInfo()).to.deep.equal([
				{ type: 'duplication', keyType: 'value', key: 'dup1' },
				{ type: 'duplication', keyType: 'value', key: 'dup2' },
				{ type: 'duplication', keyType: 'group', key: 'bar' },
			]);
		});
	});

	describe('#_getCollisionInfo', function() {
		let keySet, existingKeys;

		beforeEach(function() {
			keySet = new KeySet('foo', 'bar', { group: 'baz' });
			existingKeys = {
				items: [ 'existingValue1', 'existingValue2' ],
				groups: [ 'existingGroup1', 'existingGroup2' ],
			};

			sinon.stub(_, 'intersection')
				.withArgs(keySet.values, existingKeys.items)
				.returns([ 'wtf', 'omg' ])
				.withArgs(keySet.values, existingKeys.groups)
				.returns([ 'wow', 'ffs' ]);
		});

		it('gets intersections of values with existing keys', function() {
			keySet._getCollisionInfo(existingKeys);

			expect(_.intersection).to.be.calledTwice;
			expect(_.intersection).to.be.calledWithExactly(
				keySet.values,
				existingKeys.items
			);
			expect(_.intersection).to.be.calledWithExactly(
				keySet.values,
				existingKeys.groups
			);
		});

		it('maps intersection results to info objects', function() {
			expect(keySet._getCollisionInfo(existingKeys)).to.deep.equal([
				{ type: 'valueCollision', key: 'wtf', keyType: 'value' },
				{ type: 'valueCollision', key: 'omg', keyType: 'value' },
				{ type: 'groupCollision', key: 'wow', keyType: 'value' },
				{ type: 'groupCollision', key: 'ffs', keyType: 'value' },
			]);
		});

		it('appends info for group key colliding with existing values', function() {
			keySet.group = 'existingValue1';

			expect(keySet._getCollisionInfo(existingKeys)).to.deep.equal([
				{ type: 'valueCollision', key: 'wtf', keyType: 'value' },
				{ type: 'valueCollision', key: 'omg', keyType: 'value' },
				{ type: 'groupCollision', key: 'wow', keyType: 'value' },
				{ type: 'groupCollision', key: 'ffs', keyType: 'value' },
				{
					type: 'valueCollision',
					key: 'existingValue1',
					keyType: 'group',
				},
			]);
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
