/**
 * @typedef {Object} Bounds
 * @property {Function} getNorthWest
 * @property {Function} getNorthEast
 * @property {Function} getSouthEast
 * @property {Function} getSouthWest
 */

/**
 * @type {{ getBounds: Bounds }} el
 */
export const getBoundsForBox = el => [
	el.getBounds().getNorthWest(),
	el.getBounds().getNorthEast(),
	el.getBounds().getSouthEast(),
	el.getBounds().getSouthWest(),
];

/**
 * @param {RequestInfo | URL} url
 * @param {RequestInit} [opts]
 * @see fetch
 * @returns {Promise<Object>}
 */
export const fetchJSON = async (url, opts = {}) =>
	fetch(url, opts).then(r => r.json());
