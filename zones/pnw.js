const PNW_STATES = {
	Washington: {
		cities: ['Seattle', 'Tacoma', 'Spokane'],
		routes: [
			['Seattle', 'Tacoma'],
			['Seattle', 'Spokane'],
			['Tacoma', 'Spokane'],
		],
		phases: [['Seattle', 'Tacoma', 'Spokane']],
	},
	Oregon: {
		cities: ['Portland', 'Eugene', 'Salem'],
		routes: [
			['Portland', 'Eugene'],
			['Portland', 'Salem'],
			['Eugene', 'Salem'],
		],
		phases: [['Portland', 'Eugene', 'Salem']],
	},
	// Add other relevant PNW states and their data...
	Idaho: {
		// Data for Idaho
	},
	Montana: {
		// Data for Montana
	},
	Alaska: {
		// Data for Alaska
	},
};

export default PNW_STATES;
