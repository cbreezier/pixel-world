import {getRandomNumberBetween} from "./util";

export class Behaviour {
    public readonly baseAttraction: number;
    public readonly distanceCoefficient: number;

    constructor(baseAttraction: number = 0, distanceCoefficient: number = 1) {
        this.baseAttraction = baseAttraction;
        this.distanceCoefficient = distanceCoefficient;
    }

    attraction(colourIntensity: number, distance: number) {
        return (colourIntensity * this.baseAttraction) * (Math.pow(distance, this.distanceCoefficient));
    }

    mutate(): Behaviour {
        return new Behaviour(
            this.baseAttraction + getRandomNumberBetween(-0.5, 0.5),
        this.distanceCoefficient + getRandomNumberBetween(-0.01, 0.01)
        )
    }
}
