import {Position} from "./position";
import {enforceBetween, getRandomIntBetween, weightedRandom} from "./util";

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

    render(canvasCtx: CanvasRenderingContext2D, pixelSize: number, textRgb: boolean = false) {
        canvasCtx.fillStyle = `rgb(${this.red}, ${this.green}, ${this.blue})`;
        canvasCtx.fillRect(0, 0, pixelSize, pixelSize);
        if (textRgb) {
            canvasCtx.fillStyle = 'white';
            canvasCtx.fillText(`rgb(${this.red}, ${this.green}, ${this.blue})`, 0, 0);
        }
    }

    mutate(): Pixel {
        return weightedRandom([
            [80, this.mutateIntensity.bind(this)],
            [20, this.mutateSwapColours.bind(this)]
        ])();
    }

    private mutateIntensity(): Pixel {
        return weightedRandom([
            [1, () => new Pixel(this.mutateIntensityNumber(this.red, 20), this.green, this.blue, this.alive)],
            [1, () => new Pixel(this.red, this.mutateIntensityNumber(this.green, 20), this.blue, this.alive)],
            [1, () => new Pixel(this.red, this.green, this.mutateIntensityNumber(this.blue, 20), this.alive)]
        ])();
    }

    private mutateIntensityNumber(original: number, fluctuation: number) {
        return enforceBetween(
            original + getRandomIntBetween(-fluctuation, fluctuation),
            1, 255
        );
    }

    private mutateSwapColours(): Pixel {
        const curColours = [this.red, this.green, this.blue];
        shuffleArray(curColours);

        return new Pixel(curColours[0], curColours[1], curColours[2], this.alive);
    }
}

/**
 * Durstenfeld shuffle: https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
 *
 * Mutates input
 */
function shuffleArray<T>(array: T[]): void {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
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
