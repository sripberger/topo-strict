import {
	getDuplicates,
	getErrorForInfo,
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
		it('returns an appopriate error for an invalid value', function() {
			const result = getErrorForInfo({
				type: 'invalidKey',
				keyType: 'value',
				key: 42,
			});

			expect(result).to.be.an.instanceof(KeyError);
			expect(result.message).to.equal(
				'Value \'42\' must be a non-empty string'
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

		it('returns an appropriate error for a duplicate value', function() {
			const result = getErrorForInfo({
				type: 'duplication',
				keyType: 'value',
				key: 'foo',
			});

			expect(result).to.be.an.instanceof(KeyError);
			expect(result.message).to.equal('Duplicate value \'foo\'');
			expect(result.info).to.deep.equal({ key: 'foo' });
		});

		it('returns an appropriate error for group key duplicated in values', function() {
			const result = getErrorForInfo({
				type: 'duplication',
				keyType: 'group',
				key: 'foo',
			});

			expect(result).to.be.an.instanceof(KeyError);
			expect(result.message).to.equal(
				'Group key \'foo\' also appears in values'
			);
			expect(result.info).to.deep.equal({ key: 'foo' });
		});

		it('returns an appropriate error for collision between values', function() {
			const result = getErrorForInfo({
				type: 'valueCollision',
				keyType: 'value',
				key: 'foo',
			});

			expect(result).to.be.an.instanceof(KeyError);
			expect(result.message).to.equal(
				'Value \'foo\' has already been added'
			);
			expect(result.info).to.deep.equal({ key: 'foo' });
		});

		it('returns an appropriate error for collision with a new group key', function() {
			const result = getErrorForInfo({
				type: 'valueCollision',
				keyType: 'group',
				key: 'foo',
			});

			expect(result).to.be.an.instanceof(KeyError);
			expect(result.message).to.equal(
				'Group key \'foo\' is already in use as a value'
			);
			expect(result.info).to.deep.equal({ key: 'foo' });
		});

		it('returns an appropriate error for collision with an existing group key', function() {
			const result = getErrorForInfo({
				type: 'groupCollision',
				keyType: 'value',
				key: 'foo',
			});

			expect(result).to.be.an.instanceof(KeyError);
			expect(result.message).to.equal(
				'Value \'foo\' is already in use as a group key'
			);
			expect(result.info).to.deep.equal({ key: 'foo' });
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
