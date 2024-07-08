'use strict';

/**
 * @param {string} input
 * @returns {lat: number; lng: number;} | null
 */
export function extractCoordFrom(input) {
	console.log(input);
	const regex = /(-?\d+\.\d+)(?:,\s)(-?\d+\.\d+)/;
	const match = input.match(regex);
	console.log(match);

	if (match) {
		const lat = parseFloat(match[1]);
		const lng = parseFloat(match[2]);
		return {lat, lng};
	} else {
		return null; // No coordinate pair found
	}
}
