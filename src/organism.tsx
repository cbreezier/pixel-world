import {Species} from "./species";
import {Direction} from "./direction";
import {PIXEL_COLOURS, PositionedPixel} from "./pixel";
import {getRandomInt} from "./util";
import {Position} from "./position";

export class Organism {
    public readonly species: Species;
    public readonly id: string;

    private position: Position;
    private food: number;
    private previousDirection: Direction;

    constructor(species: Species, position: Position, food: number) {
        this.species = species;
        this.id = uuidv4();
        this.position = position;
        this.food = food;
        this.previousDirection = Direction.NONE;
    }

    getPosition(): Position {
        return this.position;
    }

    getFood(): number {
        return this.food;
    }

    getAbsoluteCellPositions(): PositionedPixel[] {
        return this.species.pixels
            .map(positionedPixel => new PositionedPixel(
                positionedPixel.position.absoluteFrom(this.position),
                positionedPixel.pixel
            ));
    }

    getFullnessPercent(): number {
        return 100 * (this.food / this.species.getMass());
    }

    addFood(food: number) {
        this.food += food;
    }

    tryReproduce(): Organism | null {
        if (this.food > this.species.getMass()) {
            this.food /= 2;

            // TODO handle mutations
            return new Organism(
                this.species,
                this.position,
                this.food
            );
        } else {
            return null;
        }
    }

    // Pixels here are relatively positioned
    move(pixels: PositionedPixel[]): void {
        let attraction = {
            "up": 10,
            "right": 10,
            "down": 10,
            "left": 10
        };

        attraction[this.previousDirection.name] += 5;

        for (const pixel of pixels) {
            for (const direction of Direction.DIRS) {
                if (pixel.position.isPositioned(direction, this.position)) {
                    for (const colour of PIXEL_COLOURS) {
                        const behaviour = this.species.getBehaviour(colour, direction);
                        attraction[direction.name] += behaviour.attraction(
                            pixel.pixel.getIntensity(colour),
                            pixel.position.distanceFrom(this.position, direction)
                        );
                    }
                }
            }
        }

        const finalDirection = weightedRandom([
            [attraction["up"], Direction.UP],
            [attraction["right"], Direction.RIGHT],
            [attraction["down"], Direction.DOWN],
            [attraction["left"], Direction.LEFT]
        ]);

        // Modify state!
        this.previousDirection = finalDirection;
        this.position = this.position.plusDirection(finalDirection);
        this.food -= this.species.getMass() * 0.0001;
    }

    render(canvasCtx: CanvasRenderingContext2D, pixelSize: number) {
        this.species.pixels.forEach(pixel => {
            canvasCtx.save();
            canvasCtx.translate(pixel.position.x * pixelSize, pixel.position.y * pixelSize);

            pixel.pixel.render(canvasCtx, pixelSize);

            canvasCtx.restore();
        });

        const fullness = this.getFullnessPercent().toFixed(0) + '%';
        canvasCtx.fillStyle = "white";
        canvasCtx.fillText(fullness, 0, 0);
    }
}

function weightedRandom<T>(inputs: [number, T][]): T {
    inputs = inputs.map(input => [Math.max(input[0], 0), input[1]]);

    const total = inputs.reduce((acc, cur) => acc + cur[0], 0);

    let randomInt = getRandomInt(total);
    for (const input of inputs) {
        if (randomInt <= input[0]) {
            return input[1];
        }

        randomInt -= input[0];
    }

    console.error("Should never reach here");
    return inputs[0][1];
}

function uuidv4(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
