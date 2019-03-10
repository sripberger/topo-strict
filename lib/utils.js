import { KeyError } from './key-error';
import _ from 'lodash';

export function getDuplicates(arr) {
	return _.filter(arr, (v, i) => _.includes(arr, v, i + 1));
}

export function getErrorForInfo(info) {
	const { type, keyType, key } = info;
	const subject = `${getFullKeyType(keyType)} '${key}'`;

	let message;
	switch (type) {
		case 'invalidKey':
			message = `${subject} must be a non-empty string`;
			break;
		case 'duplication':
			if (keyType === 'value') {
				message = `Duplicate value '${key}'`;
			} else if (keyType === 'group') {
				message = `${subject} also appears in values`;
			}
			break;
		case 'valueCollision':
			if (keyType === 'value') {
				message = `${subject} has already been added`;
			} else if (keyType === 'group') {
				message = `${subject} is already in use as a value`;
			}
			break;
		case 'groupCollision':
			message = `${subject} is already in use as a group key`;
			break;
		default:
			break;
	}

	return new KeyError(message, { info: { key } });
}

export function isInvalidKey(key) {
	return !_.isString(key) || _.isEmpty(key);
}

export function normalizeArrayOption(option) {
	if (option === undefined) return [];
	return _.isArray(option) ? _.clone(option) : [ option ];
}


function getFullKeyType(keyType) {
	const result = keyType === 'value' ? keyType : `${keyType} key`;
	return _.capitalize(result);
}
