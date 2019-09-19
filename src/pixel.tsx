import {Position} from "./position";
import {getRandomIntBetween, weightedRandom} from "./util";

export class Pixel {
    public readonly red: number;
    public readonly green: number;
    public readonly blue: number;

    public readonly alive: boolean;

    constructor(red, green, blue, alive) {
        this.red = red;
        this.green = green;
        this.blue = blue;
        this.alive = alive;
    }

    getMass() {
        return this.red + this.green + this.blue;
    }

    getIntensity(colour: PixelColour) {
        switch (colour) {
            case "red":
                return this.red;
            case "green":
                return this.green;
            case "blue":
                return this.blue;
        }
    }

    static getPredator(colour: PixelColour): PixelColour {
        switch (colour) {
            case "red":
                return "blue";
            case "green":
                return "red";
            case "blue":
                return "green";
        }
    }

    getPrimaryColour(): PixelColour {
        return [
            ["red", this.red] as [PixelColour, number],
            ["green", this.green] as [PixelColour, number],
            ["blue", this.blue] as [PixelColour, number]
        ].sort((a, b) => a[1] - b[1]).reverse()[0][0]
    }

    render(canvasCtx: CanvasRenderingContext2D, pixelSize: number) {
        canvasCtx.fillStyle = `rgb(${this.red}, ${this.green}, ${this.blue})`;
        canvasCtx.fillRect(0, 0, pixelSize, pixelSize);
    }

    mutate(): Pixel {
        return weightedRandom([
            [80, this.mutateIntensity.bind(this)],
            [20, this.mutateSwapColours.bind(this)]
        ])();
    }

    private mutateIntensity(): Pixel {
        return weightedRandom([
            [1, () => new Pixel(this.red + getRandomIntBetween(-50, 50), this.green, this.blue, this.alive)],
            [1, () => new Pixel(this.red, this.green + getRandomIntBetween(-50, 50), this.blue, this.alive)],
            [1, () => new Pixel(this.red, this.green, this.blue + getRandomIntBetween(-50, 50), this.alive)]
        ])();
    }

    private mutateSwapColours(): Pixel {
        // TODO implement this
        return this;
    }
}

export class PositionedPixel {
    public readonly position: Position;
    public readonly pixel: Pixel;

    constructor(position, pixel) {
        this.position = position;
        this.pixel = pixel;
    }

    mutate(): PositionedPixel {
        return new PositionedPixel(this.position, this.pixel.mutate());
    }
}

export type PixelColour = "red" | "green" | "blue";
export const PIXEL_COLOURS: PixelColour[] = ["red", "green", "blue"];
