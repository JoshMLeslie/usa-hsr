import {fetchJSON} from './util/index.js';

/* global L:readonly */
let USA_CountyData;
const steps = [
	40008.2, // First range end
	80008.4,
	120008.6,
	160008.8,
	200000, // Middle point
	2332669.0, // Second range start
	4665338.0,
	6998007.0,
	9330676.0,
	9663345, // End point
];
const colorRange = [
	'#c0392b',
	'#e74c3c',
	'#9b59b6',
	'#8e44ad',
	'#2980b9',
	'#3498db',
	'#1abc9c',
	'#16a085',
	'#27ae60',
	'#2ecc71',
];
const getColor = number => {
	const min = 43; // max = 9663345
	if (number >= min && number <= steps[0]) {
		return colorRange[0];
	} else if (number > steps[0] && number <= steps[1]) {
		return colorRange[1];
	} else if (number > steps[1] && number <= steps[2]) {
		return colorRange[2];
	} else if (number > steps[2] && number <= steps[3]) {
		return colorRange[3];
	} else if (number > steps[3] && number <= steps[4]) {
		return colorRange[4];
	} else if (number > steps[4] && number <= steps[5]) {
		return colorRange[5];
	} else if (number > steps[5] && number <= steps[6]) {
		return colorRange[6];
	} else if (number > steps[6] && number <= steps[7]) {
		return colorRange[7];
	} else if (number > steps[7] && number <= steps[8]) {
		return colorRange[8];
	} else if (number > steps[8] && number <= steps[9]) {
		return colorRange[9];
	} else {
		console.warn('Number is out of range');
		return '#000000';
	}
};

const genCountyHeatmap = async () => {
	// 	range: [43, 9663345]

	if (!USA_CountyData) {
		USA_CountyData = await fetchJSON(
			'./assets/js/geojson/us_county_data_pop.json'
		);
	}

	return new Promise((res, rej) => {
		try {
			res(
				L.geoJson(USA_CountyData, {
					style: ({properties}) => {
						if (properties.population) {
							const color = getColor(properties.population);
							return {color};
						}
						return {
							color: '#000000',
						};
					},
					onEachFeature: (feature, layer) => {
						layer.bindPopup(`${feature.properties.population}`);
					},
				})
			);
		} catch (e) {
			console.error(e);
			rej(e);
		}
	});
};

export default genCountyHeatmap;
