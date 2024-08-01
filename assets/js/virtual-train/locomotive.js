import locomotiveData from './locomotive-data.json' with { type: 'json' };

/**
 * Locomotive class
 *
 * @param make - The manufacturer of the locomotive
 * @param model - The model of the locomotive
 *
 * @property {string} maxSpeed - The maximum speed the locomotive can reach
 * @property {number} acceleration - How much the locomotive accelerates per tick (1 second)
 * @property {number} braking - How much the locomotive brakes per tick
 * @property {{ type: 'diesel' | 'electric' | 'hybrid'; burnRate: number }} fuel - Information about the fuel type and burn rate
 *
 * @example fuel - {type: 'diesel', burnRate: 10} - The locomotive uses diesel and burns 10 gallons of fuel per tick at maximum speed
 * @example fuel - {type: 'electric', burnRate: 5} - The locomotive uses electric and uses 5 kw/h  per tick at maximum speed
 *
 * @method accelerate - Increases the current speed of the locomotive by its acceleration rate, up to its maximum speed
 * @method brake - Decreases the current speed of the locomotive by its braking rate
 * @method getStatus - Returns a string with the current speed, maximum speed, and fuel level of the locomotive
 */
export default class Locomotive {
	constructor(make, model) {
		if (!make || !model) {
			throw new Error('Make and model are required.');
		}
		if (!locomotiveData[make][model]) {
			throw new Error(`Locomotive ${make} ${model} not found.`);
		}
		this.make = make;
		this.model = model;
		const {
			maxSpeed,
			acceleration,
			braking,
			fuel: {type, burnRate},
		} = locomotiveData[make][model];
		this.maxSpeed = maxSpeed;
		this.acceleration = acceleration;
		this.braking = braking;
		this.currentSpeed = 0;
		this.distanceTraveled = 0;
		this.fuelType = type;
		this.burnRate = burnRate;
		this.fuelConsumed = 0;
	}

	accelerate() {
		if (this.currentSpeed + this.acceleration <= this.maxSpeed) {
			this.currentSpeed += this.acceleration;
		} else {
			this.currentSpeed = this.maxSpeed;
		}
		console.log(`Accelerating. Current speed: ${this.currentSpeed} km/h`);
	}

	brake() {
		if (this.currentSpeed - this.braking >= 0) {
			this.currentSpeed -= this.braking;
		} else {
			this.currentSpeed = 0;
		}
		console.log(`Braking. Current speed: ${this.currentSpeed} km/h`);
	}

	travelDistance(distance) {
		this.distanceTraveled += distance;
		this.fuelConsumed += distance * this.burnRate;
	}

	getStatus() {
		return {
			make: this.make,
			model: this.model,
			maxSpeed: this.maxSpeed,
			currentSpeed: this.currentSpeed,
			acceleration: this.acceleration,
			braking: this.braking,
			distanceTraveled: this.distanceTraveled,
			fuelConsumed: this.fuelConsumed.toFixed(2),
		};
	}
}
