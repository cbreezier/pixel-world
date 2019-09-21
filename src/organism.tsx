import {Species} from "./species";
import {Direction} from "./direction";
import {PIXEL_COLOURS, PositionedPixel} from "./pixel";
import {getRandomInt, weightedRandom} from "./util";
import {Position} from "./position";

export class Organism {
    public readonly species: Species;

    private position: Position;
    private food: number;
    private previousDirection: Direction;

    constructor(species: Species, position: Position, food: number) {
        this.species = species;
        this.position = position;
        this.food = food;
        this.previousDirection = Direction.NONE;
    }

    getPosition(): Position {
        return this.position;
    }

    setPosition(position: Position) {
        this.position = position;
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

            return new Organism(
                this.species.mutate(),
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

        attraction[this.previousDirection.name] += 15;

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
        this.food -= this.species.getMass() * 0.005;
    }

    render(canvasCtx: CanvasRenderingContext2D, pixelSize: number) {
        this.species.render(canvasCtx, pixelSize);

        const fullness = this.getFullnessPercent().toFixed(0) + '%';
        canvasCtx.fillStyle = "white";
        canvasCtx.fillText(fullness, 0, 0);
    }
}
