const fs = require('fs');
const csv = require('csv-parser');

const pattern =
	/([a-zA-Z\s\[\]]+)\t([A-Z]{2})\t([\d,]+)\t([\d,]+)\t([+-]?\d+\.\d+%)\t([\d,]+\.\d+)\t([\d,]+\.\d+)\t([\d,]+)\t([\d,]+)\t(\d+\.\d+°[NS])\s+(\d+\.\d+°[EW])/;

const results = [];
const errors = [];

function writeResultsToJson(data, type) {
	if (!data.length) return;
	
	const jsonData = JSON.stringify(data, null, 2); // Pretty-print JSON with 2-space indentation
	const name = 'data-csv/parsed_' + type + '.json';
	fs.writeFile(name, jsonData, 'utf8', (err) => {
		if (err) {
			console.error('Error writing to JSON file:', err);
		} else {
			console.log('Results successfully written to ' + name);
		}
	});
}

fs.createReadStream('data-csv/cities-by-pop.csv')
	.pipe(csv({separator: '\t'})) // Assuming tab-separated values
	.on('data', (row) => {
		const example = Object.values(row).join('\t'); // Convert the row object to a tab-separated string
		const match = example.match(pattern);
		if (match) {
			const groups = match.slice(1);

			const lat = groups[groups.length - 2];
			const lon = groups[groups.length - 1];

			const latValue = parseFloat(lat.slice(0, -1));
			const lonValue = parseFloat(lon.slice(0, -1));

			groups[groups.length - 2] = latValue;
			groups[groups.length - 1] = lonValue;

			results.push({
				city: groups[0],
				state: groups[1],
				cens_2023: groups[2],
				cens_2020: groups[3],
				pop_change: groups[4],
				mi_land_2020: groups[5],
				km_land_2020: groups[6],
				mi_dens_2020: groups[7],
				km_dens_2020: groups[8],
				lat: groups[9],
				lon: groups[10]
			});
		} else {
			errors.push('No match found for row: ' + example)
		}
	})
	.on('end', () => {
		writeResultsToJson(results, 'results');
		writeResultsToJson(errors, 'errors');
	});
