const MIDWEST_STATES = {
    "Illinois": {
      "cities": ["Chicago", "Springfield", "Peoria"],
      "routes": [
        ["Chicago", "Springfield"],
        ["Springfield", "Peoria"],
        ["Chicago", "Peoria"]
      ],
      "phases": [
        ["Chicago", "Springfield", "Peoria"]
      ]
    },
    "Indiana": {
      "cities": ["Indianapolis", "Fort Wayne", "Evansville"],
      "routes": [
        ["Indianapolis", "Fort Wayne"],
        ["Fort Wayne", "Evansville"],
        ["Indianapolis", "Evansville"]
      ],
      "phases": [
        ["Indianapolis", "Fort Wayne", "Evansville"]
      ]
    },
    "Iowa": {
      "cities": ["Des Moines", "Cedar Rapids", "Davenport"],
      "routes": [
        ["Des Moines", "Cedar Rapids"],
        ["Cedar Rapids", "Davenport"],
        ["Des Moines", "Davenport"]
      ],
      "phases": [
        ["Des Moines", "Cedar Rapids", "Davenport"]
      ]
    },
    // Add more states as needed...
  };
  
  export default MIDWEST_STATES;
  