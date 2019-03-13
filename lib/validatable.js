import { ValidationError } from './validation-error';
import { fromArray } from 'nani';
import { getErrorForInfo } from './utils';

export class Validatable {
	_validate(...args) {
		const err = fromArray(this._getErrors(...args));
		if (err) throw new ValidationError(err);
	}

	_getErrors(...args) {
		return this._getErrorInfo(...args).map(getErrorForInfo);
	}

	// eslint-disable-next-line class-methods-use-this
	_getErrorInfo() {
		return [];
	}
}
