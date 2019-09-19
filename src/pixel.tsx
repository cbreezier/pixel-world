import {Position} from "./position";

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
}

export class PositionedPixel {
    public readonly position: Position;
    public readonly pixel: Pixel;

    constructor(position, pixel) {
        this.position = position;
        this.pixel = pixel;
    }
}/*
class PixelColour {
    public static RED = new PixelColour("red");
    public static GREEN = new PixelColour("red");
    public static BLUE = new PixelColour("red");

    public readonly colourName: string;

    constructor(colourName: string) {
        this.colourName = colourName;
    }
}
*/
export type PixelColour = "red" | "green" | "blue";
export const PIXEL_COLOURS: PixelColour[] = ["red", "green", "blue"];
