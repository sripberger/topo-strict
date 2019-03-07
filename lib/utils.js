import { filter, includes, uniq } from 'lodash';

export function getDuplicates(arr) {
	return uniq(filter(arr, (v, i) => includes(arr, v, i + 1)));
}
