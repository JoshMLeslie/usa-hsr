'use strict';

import fs from 'fs';
import ANSIStateToName from '../assets/js/ansi-state-to-name.mjs';
import countyData from '../assets/js/geojson/us_county_data.mjs';
import population from './parsed_county-pop-data.json' with {type: 'json'};

async function addPopulationToGeoJSONFile(inputFilePath, outputFilePath) {
	try {
		// Iterate until your eyes bleed
		const feature = countyData.features.forEach(feature => {
		const stateName = ANSIStateToName[Number(feature.properties.STATE)];
		const stateData = population[stateName];
		if (!stateData) return;
		const countyData = Object.entries(stateData).find(([county, _]) => 
			return county.toLowerCase().includes(feature.properties.NAME.toLowerCase())
		);
		if (countyData?.[1]) {
			feature.properties.population = countyData[1];
		}
	})

		// Convert the updated GeoJSON object back to a string
		const updatedGeoJSON = JSON.stringify(countyData, null, 2);

		// Write the updated GeoJSON data to the output file
		fs.writeFile(outputFilePath, updatedGeoJSON, 'utf8', err => {
			if (err) {
				console.error('Error writing the file:', err);
			} else {
				console.log('File has been updated and saved to', outputFilePath);
			}
		});
	} catch (err) {
		console.error('Error parsing the GeoJSON data:', err);
	}
}

// Example usage
const inputFilePath = 'assets/js/geojson/us_county_data.js';
const outputFilePath = 'assets/js/geojson/us_county_data_pop.js';

addPopulationToGeoJSONFile(inputFilePath, outputFilePath);
