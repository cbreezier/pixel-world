import {Species} from "./species";
import {Direction} from "./direction";
import {Pixel, PIXEL_COLOURS} from "./pixel";
import {weightedRandom} from "./util";
import {Position} from "./position";
import {Uuid} from "./uuid";
import {Keyable} from "./keyable";
import {LeoMap} from "./leo-map";
import {Victim} from "./victim";

export class Organism implements Keyable {
    public readonly species: Species;
    public readonly id: Uuid;

    private position: Position;
    private food: number;
    private previousDirection: Direction;

    constructor(species: Species, position: Position, food: number) {
        this.species = species;
        this.id = new Uuid();

        this.position = position;
        this.food = food;
        this.previousDirection = Direction.NONE;
    }

    toKey(): string {
        return this.id.stringValue;
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

    getAbsoluteCellPositions(): LeoMap<Position, Pixel> {
        return this.species.pixelMap
            .map((pixel, position) => [
                    position.absoluteFrom(this.position),
                    pixel
                ]
            );
    }

    getVisionPositions(visionDistance: number): Position[] {
        return this.species.getVisionPositions(visionDistance, this.position);
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
    move(victims: Map<Position, Victim[]>): void {
        let attraction = {
            "up": 1,
            "right": 1,
            "down": 1,
            "left": 1
        };

        attraction[this.previousDirection.name] += 5;

        victims.forEach((victimList, position) => {
            for (const direction of Direction.DIRS) {
                if (position.isPositioned(direction, this.position)) {
                    for (const colour of PIXEL_COLOURS) {
                        const behaviour = this.species.getBehaviour(colour, direction);
                        for (const victim of victimList) {
                            attraction[direction.name] += behaviour.attraction(
                                victim.pixel.getIntensity(colour),
                                position.distanceFrom(this.position, direction)
                            );
                        }
                    }
                }
            }
        });

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

    render(canvasCtx: CanvasRenderingContext2D, pixelSize: number, textRgb: boolean = false) {
        this.species.render(canvasCtx, pixelSize);

        if (textRgb) {
            const fullness = this.getFullnessPercent().toFixed(0) + '%';
            canvasCtx.fillStyle = "white";
            canvasCtx.fillText(fullness, 0, 0);
        }
    }
}
