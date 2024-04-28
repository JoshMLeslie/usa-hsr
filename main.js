import COORDS from './coords.js';
import BW_NE from './zones/between-ne.js';
import NE_ZONE from './zones/north-east.js';

const USA_CENTER = [39.833, -98.583];
const NE_CENTER = [40.261354, -74.518535];

// INIT
// var map = L.map('map').setView(USA_CENTER, 4);
var map = L.map('map').setView(NE_CENTER, 6);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
	maxZoom: 10,
	attribution:
		'&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(map);
// INIT END

const draw = (args, opts = {}) => {
	if (args.length > 1) {
		L.polyline(args, {color: 'blue', ...opts}).addTo(map);
	}
	args.forEach((arg) => {
		L.circleMarker(arg, {radius: 2, color: '#333333'}).addTo(map);
	});
};

const drawZone = (zone, coords) => {
	for (const route of zone) {
		const path = route.map((loc) => coords[loc.country][loc.state][loc.city]);

		for (let i = 0, j = 1; j < route.length; i++, j++) {
			const a = route[i];
			const b = route[j];

			const aCoord = coords[a.country][a.state][a.city];
			const bCoord = coords[b.country][b.state][b.city];

			const isInterNational = a.country !== b.country;
			const isInterState = a.state !== b.state;

			let opts = {};
			if (isInterNational) {
				opts = {
					color: 'orange',
					dashArray: 16,
				};
			} else if (isInterState) {
				 opts = {
					color: 'green',
					dashArray: 4,
				};
			}

			draw([aCoord, bCoord], opts);
		}
	}
};

// btn binding
document.querySelector('#usa-region-btn').onclick = () => {
	map.setView(USA_CENTER, 4);
};
document.querySelector('#north-east-region-btn').onclick = () => {
	map.setView(NE_CENTER, 6);
	drawZone(NE_ZONE, COORDS);
	drawZone(BW_NE, COORDS);
};
