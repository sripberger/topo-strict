import { ValidationError } from './validation-error';
import { fromArray } from 'nani';
import { getErrorForInfo } from './utils';

/**
 * Internal class containing common logic for performing complex validation.
 * @private
 */
export class Validatable {
	/**
	 * Fetches all errors from the instance and throws a ValidationError if any
	 * are found. Errors will appear in the ValidationError's cause chain.
	 * @private
	 * @param {...any} args - Arguments that might be necessary to perform
	 *   validation. Passed through unchanged to `#_getErrors`.
	 */
	_validate(...args) {
		const err = fromArray(this._getErrors(...args));
		if (err) throw new ValidationError(err);
	}

	/**
	 * Fetches all errors info from the instance and converts it to actual
	 * error instances using the `getErrorForInfo` util.
	 * @private
	 * @param {...any} args - Arguments that might be necessary to fetch error
	 *   info. Passed through unchanged to #_getErrorInfo.
	 * @returns {Array<Error>} - Converted error instances.
	 */
	_getErrors(...args) {
		return this._getErrorInfo(...args).map(getErrorForInfo);
	}

	/**
	 * Fetches all information about errors from the instance. Should be
	 * overridden by subclasses.
	 * @private
	 * @param {...any} args - Arguments that might be necessary to fetch error
	 *   info. Will be the same arguments as those passed to `#_validate`.
	 * @returns {Array<Object>} - Array of error info objects. By default an
	 *   empty array.
	 */
	// eslint-disable-next-line class-methods-use-this
	_getErrorInfo() {
		return [];
	}
}
