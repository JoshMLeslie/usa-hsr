/* global require:readonly */
const fs = require('fs');
const XLSX = require('xlsx');

async function writeResultsToJson(data, type) {
	const jsonData = JSON.stringify(data, null, 2); // Pretty-print JSON with 2-space indentation
	const name = 'data-csv/parsed_' + type + '.json';
	return fs.writeFile(name, jsonData, 'utf8', err => {
		if (err) {
			console.error('Error writing to JSON file:', err);
		} else {
			console.log('Results successfully written to ' + name);
		}
	});
}

function parseXLS(filePath) {
	// Load workbook
	const workbook = XLSX.readFile(filePath);

	// Get the first worksheet
	const sheetName = workbook.SheetNames[0];
	const worksheet = workbook.Sheets[sheetName];

	// Convert worksheet to array of objects
	const data = XLSX.utils.sheet_to_json(worksheet);

	// Iterate over each row, skipping the description text rows and final citations
	const popData = {};
	let min = 0;
	let max = 0;
	for (let i = 4; i < data.length - 6; i++) {
		const row = data[i];
		// Get values from the first and last columns
		const rowKeys = Object.keys(row);
		const population = row[rowKeys[rowKeys.length - 1]];
		const countyState = row[rowKeys[0]].substr(1); // has a leading . ugh
		const stateSepIndex = countyState.lastIndexOf(',');
		const county = countyState.substr(0, stateSepIndex);
		const state = countyState.substr(stateSepIndex + 2);

		if (min === 0 || population < min) {
			min = population;
		} else if (population > max) {
			max = population;
		}

		if (popData[state]) {
			popData[state][county] = population;
		} else {
			popData[state] = {
				[county]: population,
			};
		}
	}
	console.log('popData created');
	console.log('min value: ' + min + ' max value: ' + max);
	return popData;
}

// Example usage
try {
	const filePath = './data-csv/co-est2023-pop.xlsx';
	const popData = parseXLS(filePath);
	writeResultsToJson(popData, 'county-pop-data')
} catch (e) {
	console.err('Error encountered', e)
}
