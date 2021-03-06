import {Pixel} from "./pixel";
import {Organism} from "./organism";
import {Keyable} from "./keyable";

export class Victim implements Keyable {
    public readonly pixel: Pixel;
    public readonly organism?: Organism;

    constructor(pixel: Pixel, organism?: Organism) {
        this.pixel = pixel;
        this.organism = organism;
    }

    toKey(): string {
        let key = this.pixel.toKey();
        if (this.organism !== undefined) {
            key += this.organism.toKey();
        }
        return key;
    }

    isAlive() {
        return (this.organism !== undefined);
    }

    getFoodValue() {
        if (this.organism) {
            return this.organism.species.getMass();
        } else {
            return this.pixel.getMass();
        }
    }
}
