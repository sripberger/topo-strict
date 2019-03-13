import {
	getDuplicates,
	getErrorForInfo,
	isInvalidKey,
	normalizeArrayOption,
} from '../../lib/utils';

import { KeyError } from '../../lib/key-error';

describe('Internal utils', function() {
	describe('getDuplicates', function() {
		it('returns duplicated values in an array', function() {
			const arr = [ 'foo', 'bar', 'bar', 'foo', 'baz', 'foo' ];

			expect(getDuplicates(arr)).to.deep.equal([ 'foo', 'bar', 'foo' ]);
		});
	});

	describe('getErrorForInfo', function() {
		it('returns an appopriate error for an invalid id', function() {
			const result = getErrorForInfo({
				type: 'invalidKey',
				keyType: 'id',
				key: 42,
			});

			expect(result).to.be.an.instanceof(KeyError);
			expect(result.message).to.equal(
				'Id \'42\' must be a non-empty string'
			);
			expect(result.info).to.deep.equal({ key: 42 });
		});

		it('returns an appropriate error for an invalid before key', function() {
			const result = getErrorForInfo({
				type: 'invalidKey',
				keyType: 'before',
				key: 42,
			});

			expect(result).to.be.an.instanceof(KeyError);
			expect(result.message).to.equal(
				'Before key \'42\' must be a non-empty string'
			);
			expect(result.info).to.deep.equal({ key: 42 });
		});

		it('returns an appropriate error for an invalid after key', function() {
			const result = getErrorForInfo({
				type: 'invalidKey',
				keyType: 'after',
				key: 42,
			});

			expect(result).to.be.an.instanceof(KeyError);
			expect(result.message).to.equal(
				'After key \'42\' must be a non-empty string'
			);
			expect(result.info).to.deep.equal({ key: 42 });
		});

		it('returns an appropriate error for an invalid group key', function() {
			const result = getErrorForInfo({
				type: 'invalidKey',
				keyType: 'group',
				key: 42,
			});

			expect(result).to.be.an.instanceof(KeyError);
			expect(result.message).to.equal(
				'Group key \'42\' must be a non-empty string'
			);
			expect(result.info).to.deep.equal({ key: 42 });
		});

		it('returns an appropriate error for a duplicate id', function() {
			const result = getErrorForInfo({
				type: 'duplication',
				keyType: 'id',
				key: 'foo',
			});

			expect(result).to.be.an.instanceof(KeyError);
			expect(result.message).to.equal('Duplicate id \'foo\'');
			expect(result.info).to.deep.equal({ key: 'foo' });
		});

		it('returns an appropriate error for group key duplicated in ids', function() {
			const result = getErrorForInfo({
				type: 'duplication',
				keyType: 'group',
				key: 'foo',
			});

			expect(result).to.be.an.instanceof(KeyError);
			expect(result.message).to.equal(
				'Group key \'foo\' also appears in ids'
			);
			expect(result.info).to.deep.equal({ key: 'foo' });
		});

		it('returns an appropriate error for collision between ids', function() {
			const result = getErrorForInfo({
				type: 'idCollision',
				keyType: 'id',
				key: 'foo',
			});

			expect(result).to.be.an.instanceof(KeyError);
			expect(result.message).to.equal(
				'Id \'foo\' has already been added'
			);
			expect(result.info).to.deep.equal({ key: 'foo' });
		});

		it('returns an appropriate error for collision with a new group key', function() {
			const result = getErrorForInfo({
				type: 'idCollision',
				keyType: 'group',
				key: 'foo',
			});

			expect(result).to.be.an.instanceof(KeyError);
			expect(result.message).to.equal(
				'Group key \'foo\' is already in use as an id'
			);
			expect(result.info).to.deep.equal({ key: 'foo' });
		});

		it('returns an appropriate error for collision with an existing group key', function() {
			const result = getErrorForInfo({
				type: 'groupCollision',
				keyType: 'id',
				key: 'foo',
			});

			expect(result).to.be.an.instanceof(KeyError);
			expect(result.message).to.equal(
				'Id \'foo\' is already in use as a group key'
			);
			expect(result.info).to.deep.equal({ key: 'foo' });
		});

		it('returns an appropriate error for a before key with no target', function() {
			const result = getErrorForInfo({
				type: 'missingTarget',
				keyType: 'before',
				key: 'foo',
			});

			expect(result).to.be.an.instanceof(KeyError);
			expect(result.message).to.equal(
				'Before key \'foo\' does not exist'
			);
			expect(result.info).to.deep.equal({ key: 'foo' });
		});

		it('returns an appropriate error for an after key with no target', function() {
			const result = getErrorForInfo({
				type: 'missingTarget',
				keyType: 'after',
				key: 'foo',
			});

			expect(result).to.be.an.instanceof(KeyError);
			expect(result.message).to.equal(
				'After key \'foo\' does not exist'
			);
			expect(result.info).to.deep.equal({ key: 'foo' });
		});
	});

	describe('isInvalidKey', function() {
		it('returns false for non-empty strings', function() {
			expect(isInvalidKey('foo')).to.be.false;
			expect(isInvalidKey('bar')).to.be.false;
		});

		it('returns true for empty strings', function() {
			expect(isInvalidKey('')).to.be.true;
		});

		it('returns true for non-strings', function() {
			expect(isInvalidKey(42)).to.be.true;
			expect(isInvalidKey(true)).to.be.true;
			expect(isInvalidKey({ foo: 'bar' })).to.be.true;
		});
	});

	describe('normalizeArrayOption', function() {
		it('returns a copy of the option, if it is an array', function() {
			const option = [ 'foo', 'bar' ];

			const result = normalizeArrayOption(option);

			expect(result).to.deep.equal(option);
			expect(result).to.not.equal(option);
		});

		it('returns option in an array, if it is not an array', function() {
			expect(normalizeArrayOption('foo')).to.deep.equal([ 'foo' ]);
		});

		it('returns an empty array, if option is undefined', function() {
			expect(normalizeArrayOption(undefined)).to.deep.equal([]);
		});

		it('supports other falsy options', function() {
			expect(normalizeArrayOption('')).to.deep.equal([ '' ]);
			expect(normalizeArrayOption(0)).to.deep.equal([ 0 ]);
			expect(normalizeArrayOption(false)).to.deep.equal([ false ]);
			expect(normalizeArrayOption(null)).to.deep.equal([ null ]);
		});
	});
});
