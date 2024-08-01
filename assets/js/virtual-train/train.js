import Locomotive from './locomotive';
/**
 * Represents a Train with a Locomotive and multiple cars.
 * @class Train
 * @param {Locomotive} locomotive - The locomotive of the train.
 * @param {Array} stops - An array of stop objects, each containing a city.
 * @param {number} passengerCapacity - The total passenger capacity of the train.
 * @param {number} carCount - The number of cars in the train.
 * @param {number} carLength - The length of each car.
 * @param {number} currentStopIndex - The index of the current stop.
 * @param {number} passengerCount - The current number of passengers on the train.
 * @param {boolean} isMoving - Whether the train is moving or not.
 *
 * @method start - Starts the train if it's not already moving.
 * @method stop - Stops the train if it's moving.
 * @method moveToNextStop - Moves the train to the next stop in its route.
 * @method boardPassenger - Attempts to board a passenger if there's space available.
 * @method disembarkPassengers - Disembarks passengers at the current stop.
 * @method addCar - Adds a car to the train if there's space available.
 * @method removeCar - Removes a car from the train if it's not necessary for operation.
 * @method getStatus - Checks and prints the current status of the train, including its speed, location, and number of passengers.
 */
class Train {
	constructor(locomotive, stops, passengerCapacity, carCount, carLength) {
		this.locomotive = locomotive;
		this.stops = stops;
		this.route = {start: stops[0], end: stops[stops.length - 1]};
		this.passengerCapacity = passengerCapacity;
		this.carCount = carCount;
		this.carLength = carLength;
		this.currentStopIndex = 0;
		this.passengerCount = 0;
		this.isMoving = false;
		this.direction = 1; // or -1
	}

	start() {
		if (!this.isMoving) {
			console.log(`The train is starting from ${this.route.start.city}`);
			this.isMoving = true;
			this._accelerate();
		} else {
			console.log('The train is already moving.');
		}
	}

	stop() {
		if (this.isMoving) {
			console.log(`The train is stopping.`);
			this._brake();
		} else {
			console.log('The train is already stopped.');
		}
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

	moveToNextStop() {
		if (this.isMoving) {
			if (
				this.direction === 1 &&
				this.currentStopIndex < this.stops.length - 1
			) {
				// Move forward
				this.currentStopIndex += 1;
				console.log(
					`Moving to next stop: ${this.stops[this.currentStopIndex].city}`
				);
			} else if (this.direction === -1 && this.currentStopIndex > 0) {
				// Move backward
				this.currentStopIndex -= 1;
				console.log(
					`Moving to previous stop: ${this.stops[this.currentStopIndex].city}`
				);
			} else {
				console.log('The train has reached the end of the line.');
				this.stop();
				if (this.direction === 1) {
					// Reverse direction and start over
					this.direction = -1;
					this.currentStopIndex -= 1; // Adjust for reversal
					console.log('The train is now reversing direction.');
				} else {
					// Reset to forward traversal
					this.currentStopIndex = 0;
					this.start(); // Restart the journey
					this.direction = 1; // Reset direction to forward
					console.log(
						'The train has completed a full route and is starting again.'
					);
				}
			}
		} else {
			console.log('The train must be moving to change location.');
		}
	}

	getStatus() {
		return {
			locomotive: this.locomotive.getStatus(),
			route: this.route,
			currentStop: this.stops[this.currentStopIndex],
			passengerCapacity: this.passengerCapacity,
			passengerCount: this.passengerCount,
			carCount: this.carCount,
			carLength: this.carLength,
			currentStopIndex: this.currentStopIndex,
			isMoving: this.isMoving,
		};
	}

	_accelerate() {
		const interval = setInterval(() => {
			if (this.locomotive.currentSpeed < this.locomotive.maxSpeed) {
				this.locomotive.accelerate();
			} else {
				clearInterval(interval);
			}
		}, 1000);
	}

	_brake() {
		const interval = setInterval(() => {
			if (this.locomotive.currentSpeed > 0) {
				this.locomotive.brake();
			} else {
				this.isMoving = false;
				clearInterval(interval);
			}
		}, 1000);
	}
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
