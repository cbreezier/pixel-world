import {Pixel, PixelColour, PositionedPixel} from "./pixel";
import {Behaviour} from "./behaviour";
import {Position} from "./position";
import {Direction} from "./direction";
import {getRandomInt, weightedRandom} from "./util";

export class Species {

    public readonly generation: number;
    public readonly parent: Species | null;
    public readonly pixels: PositionedPixel[];
    public readonly behaviours: Record<PixelColour, Record<string, Behaviour>>;

    static fromPixel(initialPixel: Pixel) {
        return new Species(null, [new PositionedPixel(new Position(0, 0), initialPixel)]);
    }

    constructor(parent: Species | null, pixels: PositionedPixel[], behaviours?) {
        if (parent === null) {
            this.generation = 0;
        } else {
            this.generation = parent.generation + 1;
        }
        this.parent = parent;
        this.pixels = pixels;
        if (behaviours) {
            this.behaviours = behaviours;
        } else {
            this.behaviours = {
                "red": {
                    "up": new Behaviour(),
                    "right": new Behaviour(),
                    "down": new Behaviour(),
                    "left": new Behaviour()
                },
                "green": {
                    "up": new Behaviour(),
                    "right": new Behaviour(),
                    "down": new Behaviour(),
                    "left": new Behaviour()
                },
                "blue": {
                    "up": new Behaviour(),
                    "right": new Behaviour(),
                    "down": new Behaviour(),
                    "left": new Behaviour()
                }
            };
        }
    }

    getMass(): number {
        return this.pixels
            .map(p => p.pixel.getMass())
            .reduce((acc, cur) => acc + cur, 0);
    }

    getBehaviour(pixelColour: PixelColour, direction: Direction): Behaviour {
        return this.behaviours[pixelColour][direction.name];
    }

    mutate(): Species {
        // 5% chance to mutate
        if (Math.random() < 0.05) {
            return weightedRandom([
                [80, this.mutateBehaviour.bind(this)],
                [20, this.mutateExistingPixels.bind(this)],
                [5, this.mutateNumberOfPixels.bind(this)]
            ])();
        } else {
            return this;
        }
    }

    mutateBehaviour(): Species {
        // TODO implement this
        return this;
    }

    mutateExistingPixels(): Species {
        // TODO check deep copying of behaviours
        const newSpecies = new Species(this, [...this.pixels], this.behaviours);
        const index = getRandomInt(newSpecies.pixels.length - 1);
        const newPixel = newSpecies.pixels[index].mutate();
        newSpecies.pixels[index] = newPixel;

        return newSpecies;
    }

    mutateNumberOfPixels(): Species {
        // TODO implement this
        return this;
    }
}
