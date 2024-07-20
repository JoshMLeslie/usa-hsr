import { ZOOM_LEVEL } from "./const/const.js";
import COORDS from "./coords.js";
import { drawZone } from "./mapping/draw.js";
import CENTERS from "./zones/centers.js";

/**
 * @type {{
 * 	[center: string]: {zoneData: any; shown: boolean}
 * }}
 */
const hasDrawn = {};

/**
 * @param {keyof CENTERS} center
 * @param {{zone: Zone, zoom: number}}
 */
export const drawRegion = (map, elID, center, {zone, zoom = ZOOM_LEVEL.country} = {}) => {
	if (!elID || !center || !zone) {
		throw ReferenceError('missing required argument(s)');
	}

	// if (document.querySelector('#show-soft-regions').checked) {
	// 	if (softRegions[elID]) {
	// 		map.addLayer(softRegions[elID]);
	// 	} else {
	// 		console.warn('soft-region DNE');
	// 		alert('Missing soft-region data');
	// 	}
	// }

	if (!hasDrawn[elID]) {
		const zoneData = drawZone(map, zone, COORDS);
		hasDrawn[elID] = {zoneData, shown: false};
	}

	const useCenter = typeof center === 'string' ?  CENTERS[center] : center;
	const isCentered = map.getCenter().equals(useCenter, 2);
	const flyTo = () => map.flyTo(useCenter, zoom, {duration: 0.5});
	if (hasDrawn[elID].shown && isCentered) {
		map.removeLayer(hasDrawn[elID].zoneData);
		// if (softRegions[elID]) {
		// 	map.removeLayer(softRegions[elID]);
		// }
		hasDrawn[elID].shown = false;
	} else if (hasDrawn[elID].shown && !isCentered) {
		flyTo();
	} else {
		map.addLayer(hasDrawn[elID].zoneData);
		flyTo();
		hasDrawn[elID].shown = true;
	}
};
