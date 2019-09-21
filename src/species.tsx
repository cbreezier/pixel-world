import {Pixel, PIXEL_COLOURS, PixelColour, PositionedPixel} from "./pixel";
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
            this.behaviours = {
                "red": {},
                "green": {},
                "blue": {}
            };
            for (let colour of PIXEL_COLOURS) {
                for (let direction of Direction.DIRS) {
                    this.behaviours[colour][direction.name] = behaviours[colour][direction.name];
                }
            }
        } else {
            this.behaviours = {
                "red": {},
                "green": {},
                "blue": {}
            };
            for (let colour of PIXEL_COLOURS) {
                for (let direction of Direction.DIRS) {
                    this.behaviours[colour][direction.name] = new Behaviour();
                }
            }
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

    render(canvasCtx: CanvasRenderingContext2D, pixelSize: number) {
        this.pixels.forEach(pixel => {
            canvasCtx.save();
            canvasCtx.translate(pixel.position.x * pixelSize, pixel.position.y * pixelSize);

            pixel.pixel.render(canvasCtx, pixelSize);

            canvasCtx.restore();
        });
    }

    mutate(): Species {
        // 5% chance to mutate
        if (Math.random() < 0.1) { // TODO change this back to 0.05
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
        const newSpecies = new Species(this, [...this.pixels], this.behaviours);
        for (let colour of PIXEL_COLOURS) {
            for (let direction of Direction.DIRS) {
                newSpecies.behaviours[colour][direction.name] = newSpecies.behaviours[colour][direction.name].mutate();
            }
        }

        return newSpecies;
    }

    mutateExistingPixels(): Species {
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
