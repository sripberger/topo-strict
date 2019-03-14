import { getDuplicates, isInvalidKey, normalizeArrayOption } from './utils';
import { Validatable } from './validatable';
import _ from 'lodash';

/**
 * Internal class that represents keys to be added to a Problem by a single cal
 * to Problem#add. Responsible for normalizing arguments to Problem#add, as well
 * as any validation logic that happens when calling Problem#add.
 * @private
 * @param {...any} args - Same arguments as documented in Problem#add.
 */
export class KeySet extends Validatable {
	constructor(...args) {
		super();

		// Normalize arguments into an options object.
		// eslint-disable-next-line no-underscore-dangle
		const options = this.constructor._normalizeArgs(args);

		// Populate the instance with options properties and defaults.
		_.defaults(this, options, { group: null });
	}

	/**
	 * Validates the key set. In this case we're simply passing through to
	 * the private Validatable#_validate method.
	 * @param {...any} args - Arguments passed through to Validatable#_validate.
	 */
	validate(...args) {
		this._validate(...args);
	}

	/**
	 * Compiles all error info for the key set. See the Validatable class for
	 * more information.
	 * @private
	 * @param {Object} existingKeys - Existing keys in the target Problem,
	 *   categorized by type.
	 * @returns {Array<Object>} - Array of error info objects.
	 */
	_getErrorInfo(existingKeys) {
		return [
			...this._getInvalidKeyInfo(),
			...this._getDuplicationInfo(),
			...this._getCollisionInfo(existingKeys),
		];
	}

	/**
	 * Returns error info objects for any keys that are not non-empty strings.
	 * @private
	 * @returns {Array<Object>} - Array of error info objects.
	 */
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

	/**
	 * Returns error info objects for any keys that are duplicated in the key
	 * set itself.
	 * @private
	 * @returns {Array<Object>} - Array of error info objects.
	 */
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

	/**
	 * Returns error info objects for any keys that collide with keys that
	 * already exist in the target Problem.
	 * @private
	 * @param {Object} existingKeys - Existing keys in the target Problem,
	 *   categorized by type.
	 * @returns {Array<Object>} - Array of error info objects.
	 */
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

	/**
	 * Normalizes constructor arguments into a canonical options object.
	 * @private
	 * @param {Array<any>} args - Array of constructor arguments.
	 * @returns {Object} - The canonical options object.
	 */
	static _normalizeArgs(args) {
		const normalized = this._normalizeUnflattenedArgs(args);
		normalized.ids = _.flatten(normalized.ids);
		return normalized;
	}

	/**
	 * Performs constructor argument normalization up to, but not including,
	 * flattening of the `ids` property.
	 * @private
	 * @param {Array<any>} args - Array of constructor arguments.
	 * @returns {Object} - The canonical options object, except with an ids
	 *   property that may need to be flattened.
	 */
	static _normalizeUnflattenedArgs(args) {
		const { ids, options } = this._splitArgs(args);
		const normalized = this._normalizeOptions(options);
		normalized.ids.unshift(...ids);
		return normalized;
	}

	/**
	 * Divides constructor arguments into ids provided by shorthand and an
	 * options object.
	 * @private
	 * @param {Array<any>} args - Array of constructor arguments.
	 * @returns {Object} - An object with two properties: `ids` which contains
	 *   an array of ids provided as shorthand, and `options`, which contains
	 *   the argument immediately following the shorthand ids, or an empty
	 *   object if there is none.
	 */
	static _splitArgs(args) {
		const ids = [];
		while (isIdsArg(args[0])) ids.push(args.shift());
		return { ids, options: args[0] || {} };
	}

	/**
	 * Normalizes arguments provided in an options object. Ensures that any
	 * options that can be arrays *are* arrays.
	 * @private
	 * @param {Object} options - Options object from arguments.
	 * @returns {Object} - A copy of `options` with normalized properties.-
	 */
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
