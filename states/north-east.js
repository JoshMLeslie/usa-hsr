const NE_STATES = {
	Connecticut: {
		cities: ['Hartford', 'Bridgeport', 'New Haven', 'Stamford', 'Waterbury'],
		routes: [
			['Hartford', 'Bridgeport', 'Stamford'],
			['Bridgeport', 'New Haven'],
		],
		phases: [
			['Hartford', 'Bridgeport', 'New Haven'],
			['Bridgeport', 'New Haven'],
		],
	},
	Delaware: {
		cities: ['Wilmington', 'Newark'],
		routes: [['Wilmington', 'Newark']],
		phases: [['Wilmington', 'Newark']],
	},
	Maine: {
		cities: ['Portland', 'Bangor', 'Houlton', 'Jackman'],
		routes: [
			['Portland', 'Bangor', 'Houlton'],
			['Houlton', 'Jackman'],
		],
		phases: [
			['Portland', 'Bangor', 'Houlton'],
			['Houlton', 'Jackman'],
		],
	},
	Maryland: {
		cities: ['Baltimore'],
		routes: [['Baltimore']],
		phases: [['Baltimore']],
	},
	Massachusetts: {
		cities: ['Boston', 'Worcester', 'Springfield', 'Cambridge', 'Lowell'],
		routes: [['Springfield', 'Worcester', 'Boston']],
		phases: [['Springfield', 'Worcester', 'Boston']],
	},
	'New Jersey': {
		cities: [
			'Newark',
			'Jersey City',
			'Trenton',
			'Atlantic City',
			'Camden',
			'Paterson',
		],
		routes: [['Newark', 'Trenton', 'Atlantic City']],
		phases: [
			['Newark', 'Trenton'],
			['Trenton', 'Atlantic City'],
		],
	},
	'New York': {
		cities: ['NYC', 'Buffalo', 'Albany', 'Syracuse', 'Rochester'],
		routes: [['NYC', 'Albany', 'Syracuse', 'Rochester', 'Buffalo']],
		phases: [
			['NYC', 'Albany'],
			['Albany', 'Burlington'],
			['Albany', 'Syracuse', 'Rochester', 'Buffalo'],
		],
	},
	Pennsylvania: {
		cities: ['Erie', 'Pittsburgh', 'Harrisburg', 'Philadelphia'],
		routes: [['Erie', 'Pittsburgh', 'Harrisburg', 'Philadelphia']],
		phases: [
			['Erie', 'Pittsburgh'],
			['Harrisburg', 'Philadelphia'][('Pittsburgh', 'Harrisburg')],
		],
	},
	Virginia: {
		cities: ['Richmond', 'Norfolk', 'Alexandria'],
		routes: [
			['Norfolk', 'Richmond', 'Alexandria'],
			['Richmond', 'Roanoke'],
		],
		phases: [
			['Norfolk', 'Richmond', 'Alexandria'],
			['Richmond', 'Roanoke'],
		],
	},
};
export default NE_STATES;
