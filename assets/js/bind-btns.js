'use strict';

import {ZOOM_LEVEL} from './const.js';
import COORDS from './coords.js';
import {drawZone} from './draw.js';
import CENTERS from './zones/centers.js';
import ZONE_CENTRAL from './zones/central.js';
import ZONE_G_LAKES from './zones/great-lakes.js';
import ZONE_NE from './zones/north-east.js';
import ZONE_SE from './zones/south-east.js';
import ZONE_WEST from './zones/west.js';

/**
 * @type {{
 * 	[center: string]: {zoneData: any; shown: boolean}
 * }}
 */
const hasDrawn = {};

export const bindRegionButtonsToMap = map => {
	/**
	 * @param {string} elID - raw id, no '#' etc. e.g. `<div id="west"></div>` => 'west'
	 * @param {keyof CENTERS} center
	 * @param {{zone: Zone, zoom: number}}
	 */
	const bindRegionBtn = (
		elID,
		center,
		{zone, zoom = ZOOM_LEVEL.country} = {}
	) => {
		if (!elID || !center) {
			throw ReferenceError('missing required argument(s)');
		}

		try {
			document.querySelector('.region-btn#' + elID).onclick = () => {
				if (!zone) {
					throw ReferenceError('no zoneData given for center: ' + center);
				}

				map.setView(CENTERS[center], zoom);
				if (hasDrawn[center]) {
					if (hasDrawn[center].shown) {
						map.removeLayer(hasDrawn[center].zoneData);
					} else {
						map.addLayer(hasDrawn[center].zoneData);
					}
					hasDrawn[center].shown = !hasDrawn[center].shown;
				} else if (!hasDrawn[center]) {
					const zoneData = drawZone(map, zone, COORDS);
					hasDrawn[center] = {zoneData, shown: true}
					map.addLayer(zoneData);
				}
			};
		} catch (e) {
			console.error('Error while binding region button', e);
		}
	};

	bindRegionBtn('namr', 'NA', {zoom: ZOOM_LEVEL.continent});
	bindRegionBtn('usa', 'USA');
	bindRegionBtn('canada', 'CANADA');
	bindRegionBtn('mexico', 'MEXICO');
	bindRegionBtn('west', 'NA_WEST', {zone: ZONE_WEST, zoom: ZOOM_LEVEL.region});
	bindRegionBtn('central', 'NA_CENTRAL', {
		zone: ZONE_CENTRAL,
		zoom: ZOOM_LEVEL.region,
	});
	bindRegionBtn('great-lakes', 'NA_G_LAKES', {
		zone: ZONE_G_LAKES,
		zoom: ZOOM_LEVEL.tristate,
	});
	bindRegionBtn('north-east', 'NA_NE', {
		zone: ZONE_NE,
		zoom: ZOOM_LEVEL.tristate,
	});
	bindRegionBtn('south-east', 'NA_SE', {
		zone: ZONE_SE,
		zoom: ZOOM_LEVEL.tristate,
	});
};
