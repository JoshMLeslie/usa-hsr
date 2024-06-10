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
