import * as nani from 'nani';
import * as utils from '../../lib/utils';
import { Validatable } from '../../lib/validatable';
import { ValidationError } from '../../lib/validation-error';

describe('Validatable', function() {
	let validatable;

	beforeEach(function() {
		validatable = new Validatable();
	});

	describe('#validate', function() {
		const errors = [ new Error('foo'), new Error('bar') ];

		beforeEach(function() {
			sinon.stub(validatable, '_getErrors').returns(errors);
			sinon.stub(nani, 'fromArray').returns(null);
		});

		it('gets errors with the same args', function() {
			validatable.validate('bar', 'baz');

			expect(validatable._getErrors).to.be.calledOnce;
			expect(validatable._getErrors).to.be.calledOn(validatable);
			expect(validatable._getErrors).to.be.calledWith('bar', 'baz');
		});

		it('wraps errors using nani::fromArray', function() {
			validatable.validate();

			expect(nani.fromArray).to.be.calledOnce;
			expect(nani.fromArray).to.be.calledWith(errors);
		});

		it('throws a ValidationError if fromArray result is not null', function() {
			const errorFromArray = new Error('Error from array');
			nani.fromArray.returns(errorFromArray);

			expect(() => {
				validatable.validate();
			}).to.throw(ValidationError).that.satisfies((err) => {
				const defaultMessage = ValidationError.getDefaultMessage();
				expect(err.shortMessage).to.equal(defaultMessage);
				expect(err.cause).to.equal(errorFromArray);
				return true;
			});
		});
	});

	describe('#_getErrors', function() {
		const fooInfo = { name: 'foo' };
		const barInfo = { name: 'bar' };
		const fooErr = new Error('foo');
		const barErr = new Error('bar');
		let result;

		beforeEach(function() {
			sinon.stub(validatable, '_getErrorInfo').returns([
				fooInfo,
				barInfo,
			]);
			sinon.stub(utils, 'getErrorForInfo')
				.withArgs(fooInfo).returns(fooErr)
				.withArgs(barInfo).returns(barErr);

			result = validatable._getErrors('baz', 'qux');
		});

		it('gets error info with same args', function() {
			expect(validatable._getErrorInfo).to.be.calledOnce;
			expect(validatable._getErrorInfo).to.be.calledOn(validatable);
			expect(validatable._getErrorInfo).to.be.calledWith('baz', 'qux');
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
		it('returns an empty array', function() {
			expect(validatable._getErrorInfo()).to.deep.equal([]);
		});
	});
});
