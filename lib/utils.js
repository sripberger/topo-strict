import { KeyError } from './key-error';
import _ from 'lodash';

/**
 * Internal utility function for identifying duplicate values in an array.
 * @private
 * @param {Array<any>} arr - Array to search for duplicates.
 * @returns {Array<any>} - Array containing any values that appear more than
 *   once in `arr`.
 */
export function getDuplicates(arr) {
	return _.filter(arr, (v, i) => _.includes(arr, v, i + 1));
}

/**
 * Internal utiltiy function for converting error info objects from validation
 * into actual KeyError instances. The resulting KeyError will have a message
 * that clearly explains the circumstances of the error.
 * @private
 * @param {Object} info - Error info object.
 *   @param {string} info.type - Identifies the type of situation that caused
 *     the error.
 *   @param {string} info.keyType - Identifies the type of the offending key.
 *   @param {any} info.key - The value of the offending key.
 * @returns {KeyError} - Created KeyError instance.
 */
export function getErrorForInfo(info) {
	const { type, keyType, key } = info;
	const subject = `${getFullKeyType(keyType)} '${key}'`;

	let message;
	switch (type) {
		case 'invalidKey':
			message = `${subject} must be a non-empty string`;
			break;
		case 'duplication':
			if (keyType === 'id') {
				message = `Duplicate id '${key}'`;
			} else if (keyType === 'group') {
				message = `${subject} also appears in ids`;
			}
			break;
		case 'idCollision':
			if (keyType === 'id') {
				message = `${subject} has already been added`;
			} else if (keyType === 'group') {
				message = `${subject} is already in use as an id`;
			}
			break;
		case 'groupCollision':
			message = `${subject} is already in use as a group key`;
			break;
		case 'missingTarget':
			message = `${subject} does not exist`;
			break;
		default:
			break;
	}

	return new KeyError(message, { info: { key } });
}

/**
 * Internal utility function for use in key validation. Identifies any keys that
 * are not non-empty strings.
 * @private
 * @param {any} key - Key value
 * @returns {boolean} - `true` if `key` is not a valud key value. `false`
 *   otherwise.
 */
export function isInvalidKey(key) {
	return !_.isString(key) || _.isEmpty(key);
}

/**
 * Internal utilty function for normalizing array options provided to
 * `Problem#add`. Returns an empty array for `undefined`, a copy for any array,
 * and the item wrapped in an array for all others.
 * @private
 * @param {any} option - Option value to normalize.
 * @returns {Array<any>} - Normalized array option.
 */
export function normalizeArrayOption(option) {
	if (option === undefined) return [];
	return _.isArray(option) ? _.clone(option) : [ option ];
}

/**
 * Helper function for utils::getErrorForInfo. Converts a keyType from an error
 * info object into a display string to be used in the error message.
 * @private
 * @param {string} keyType - keyType string to convert.
 * @returns {string} - Full keyType display string.
 */
function getFullKeyType(keyType) {
	const result = keyType === 'id' ? keyType : `${keyType} key`;
	return _.capitalize(result);
}
