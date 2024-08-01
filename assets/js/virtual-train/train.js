import Locomotive from './locomotive';

export default class Train {
	constructor(passengerCapacity) {
		this.passengerCapacity = passengerCapacity;
		this.passengerCount = 0; // Assuming the train starts with no passengers
	}

	boardPassengers(count) {
		if (this.passengerCount + count <= this.passengerCapacity) {
			this.passengerCount += count;
			console.log(
				`${count} passengers boarded. Total passengers: ${this.passengerCount}`
			);
		} else {
			console.log(`Not enough capacity to board ${count} passengers.`);
		}
	}

	alightPassengers(count) {
		if (this.passengerCount - count >= 0) {
			this.passengerCount -= count;
			console.log(
				`${count} passengers alighted. Total passengers: ${this.passengerCount}`
			);
		} else {
			console.log(`Not enough passengers to alight ${count}.`);
		}
	}

	getStatus() {
		return {
			locomotive: this.locomotive.getStatus(),
			passengerCapacity: this.passengerCapacity,
			passengerCount: this.passengerCount,
		};
	}

	// _accelerate() {
	// 	const interval = setInterval(() => {
	// 		if (this.locomotive.currentSpeed < this.locomotive.maxSpeed) {
	// 			this.locomotive.accelerate();
	// 		} else {
	// 			clearInterval(interval);
	// 		}
	// 	}, 1000);
	// }

	// _brake() {
	// 	const interval = setInterval(() => {
	// 		if (this.locomotive.currentSpeed > 0) {
	// 			this.locomotive.brake();
	// 		} else {
	// 			this.isMoving = false;
	// 			clearInterval(interval);
	// 		}
	// 	}, 1000);
	// }
}

// Example usage:
const locomotive = new Locomotive('Acme Trains', 'X2000', 200, 20, 20);
const stops = [
	{city: 'New York', state: 'NY', country: 'USA'},
	{city: 'Trenton', state: 'NJ', country: 'USA'},
	{city: 'Philadelphia', state: 'PA', country: 'USA'},
];
const train = new Train(locomotive, stops, 500, 10, 30);

console.log(train.getStatus());
train.start();
setTimeout(() => {
	train.boardPassengers(100);
}, 5000);
setTimeout(() => {
	train.alightPassengers(50);
	train.moveToNextStop();
}, 10000);
setTimeout(() => {
	train.moveToNextStop();
}, 15000);
setTimeout(() => {
	train.stop();
	console.log(train.getStatus());
}, 20000);
