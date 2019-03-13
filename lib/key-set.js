import { getDuplicates, isInvalidKey, normalizeArrayOption } from './utils';
import { Validatable } from './validatable';
import _ from 'lodash';

export class KeySet extends Validatable {
	constructor(...args) {
		super();

		// Normalize arguments into an options object.
		// eslint-disable-next-line no-underscore-dangle
		const options = this.constructor._normalizeArgs(args);

		// Populate the instance with options properties and defaults.
		_.defaults(this, options, { group: null });
	}

	validate(...args) {
		this._validate(...args);
	}

	_getErrorInfo(existingKeys) {
		return [
			...this._getInvalidKeyInfo(),
			...this._getDuplicationInfo(),
			...this._getCollisionInfo(existingKeys),
		];
	}

	_getInvalidKeyInfo() {
		// Map invalid ids to info objects.
		const invalidIds = this.ids.filter(isInvalidKey)
			.map((key) => ({
				type: 'invalidKey',
				keyType: 'id',
				key,
			}));

		// Map invalid before keys to info objects.
		const invalidBefores = this.before.filter(isInvalidKey)
			.map((key) => ({
				type: 'invalidKey',
				keyType: 'before',
				key,
			}));

		// Map invalid after keys to info objects.
		const invalidAfters = this.after.filter(isInvalidKey)
			.map((key) => ({
				type: 'invalidKey',
				keyType: 'after',
				key,
			}));

		// Concat all created info objects together.
		const invalidKeys = [
			...invalidIds,
			...invalidBefores,
			...invalidAfters,
		];

		// Append info for group, if it is set and not valid.
		if (this.group !== null && isInvalidKey(this.group)) {
			invalidKeys.push({
				type: 'invalidKey',
				keyType: 'group',
				key: this.group,
			});
		}

		return invalidKeys;
	}

	_getDuplicationInfo() {
		// Map duplicated ids to info objects.
		const duplicates = getDuplicates(this.ids)
			.map((key) => ({
				type: 'duplication',
				keyType: 'id',
				key,
			}));

		// Append info for group if it appears in ids.
		if (_.includes(this.ids, this.group)) {
			duplicates.push({
				type: 'duplication',
				keyType: 'group',
				key: this.group,
			});
		}

		return duplicates;
	}

	_getCollisionInfo(existingKeys) {
		// Map intersections between ids and existing ids.
		const idCollisions = _.intersection(
			this.ids,
			existingKeys.ids
		).map((key) => ({
			type: 'idCollision',
			keyType: 'id',
			key,
		}));

		// Map intersections between ids and existing groups.
		const groupCollisions = _.intersection(
			this.ids,
			existingKeys.groups
		).map((key) => ({
			type: 'groupCollision',
			keyType: 'id',
			key,
		}));

		// Concat all created info objects together.
		const collisions = [ ...idCollisions, ...groupCollisions ];

		// Append info for group if it appears in existing ids.
		if (_.includes(existingKeys.ids, this.group)) {
			collisions.push({
				type: 'idCollision',
				keyType: 'group',
				key: this.group,
			});
		}

		return collisions;
	}

	static _normalizeArgs(args) {
		const normalized = this._normalizeUnflattenedArgs(args);
		normalized.ids = _.flatten(normalized.ids);
		return normalized;
	}

	static _normalizeUnflattenedArgs(args) {
		const { ids, options } = this._splitArgs(args);
		const normalized = this._normalizeOptions(options);
		normalized.ids.unshift(...ids);
		return normalized;
	}

	static _splitArgs(args) {
		const ids = [];
		while (isIdsArg(args[0])) ids.push(args.shift());
		return { ids, options: args[0] || {} };
	}

	static _normalizeOptions(options) {
		options = _.clone(options);
		for (const key of [ 'ids', 'before', 'after' ]) {
			options[key] = normalizeArrayOption(options[key]);
		}
		return options;
	}
}


function isIdsArg(arg) {
	return _.isString(arg) || _.isArray(arg);
}
