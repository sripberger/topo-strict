import { filter, includes } from 'lodash';

export function getDuplicates(arr) {
	return filter(arr, (v, i) => includes(arr, v, i + 1));
}
