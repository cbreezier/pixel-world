import {Pixel, PixelColour, PositionedPixel} from "./pixel";
import {Behaviour} from "./behaviour";
import {Position} from "./position";
import {Direction} from "./direction";

export class Species {

    public readonly parent: Species | null;
    public readonly pixels: PositionedPixel[];
    //public readonly behaviours: {PixelColour: {string: Behaviour}};
    public readonly behaviours: Record<PixelColour, Record<string, Behaviour>>;

    static fromPixel(initialPixel: Pixel) {
        return new Species(null, [new PositionedPixel(new Position(0, 0), initialPixel)]);
    }

    constructor(parent: Species | null, pixels: PositionedPixel[], behaviours?) {
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

    getMass() {
        return this.pixels
            .map(p => p.pixel.getMass())
            .reduce((acc, cur) => acc + cur, 0);
    }

    getBehaviour(pixelColour: PixelColour, direction: Direction): Behaviour {
        return this.behaviours[pixelColour][direction.name];
    }
}
