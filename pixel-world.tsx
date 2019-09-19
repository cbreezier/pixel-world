import {Keyable, LeoMap} from './leo-map';

class AppState {
    private organisms: LeoMap<Position, Organism[]>;
    private foods: LeoMap<Position, Pixel>;

    public readonly width: number;
    public readonly height: number;

    private readonly canvasId: string;
    private readonly canvas: HTMLCanvasElement;
    private readonly canvasCtx: CanvasRenderingContext2D;
    private readonly pixelSize: number;

    constructor(width: number, height: number, canvasId: string) {
        this.organisms = new LeoMap();
        this.foods = new LeoMap();

        this.width = width;
        this.height = height;

        this.canvasId = canvasId;
        this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        this.canvasCtx = this.canvas.getContext('2d')!;
        this.pixelSize = Math.min(
            this.canvas.width / this.width,
            this.canvas.height / this.height
        );
    }

    addOrganisms(n: number) {
        const initialSpecies = Species.fromPixel(new Pixel(180, 0, 0, true));

        for (let i = 0; i < n; i++) {
            const position = randomPosition(this.width, this.height);
            let organisms = this.organisms.putIfAbsent(position, []);
            organisms.push(new Organism(
                initialSpecies,
                randomPosition(this.width, this.height),
                Math.floor(initialSpecies.getMass() / 5)
            ));
            this.organisms.set(position, organisms); // TODO necessary?
        }

        console.log(`Added ${n} organisms`);
    }

    addFood(n: number, colour: PixelColour) {
        let red = 0;
        let green = 0;
        let blue = 0;

        if (colour === "red") {
            red = 50;
        } else if (colour === "green") {
            green = 50;
        } else if (colour === "blue") {
            blue = 50;
        }

        for (let i = 0; i < n; i++) {
            const position = randomPosition(this.width, this.height);
            this.foods.set(
                position,
                new Pixel(red, green, blue, false)
            );
        }
    }

    update() {
        const newOrganisms: Organism[] = [];

        [...this.organisms.values()].flat().forEach(organism => {
            // TODO give organisms visibility of their surroundings
            organism.move([]);
            organism.getAbsoluteCellPositions().forEach(organismPosition => {
                const food = this.foods.get(organismPosition.position);
                if (!food) {
                    return;
                }

                const foodColour = food.getPrimaryColour();
                const foodValue = food.getIntensity(foodColour);
                const predatorColour = Pixel.getPredator(food.getPrimaryColour());
                const predatorValue = organismPosition.pixel.getIntensity(predatorColour);

                if (predatorValue > foodValue) {
                    // Eat it!
                    organism.addFood(foodValue);
                    this.foods.delete(organismPosition.position);
                }
                // TODO calculate pixels eating other pixels
            });

            // Potentially reproduce
            const newOrganism = organism.tryReproduce();
            if (newOrganism) {
                newOrganisms.push(newOrganism);
            }
        });
    }

    render() {
        this.canvasCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        [...this.organisms.values()].flat().forEach(organism => {
            // const position = wrapPosition(organism.getPosition(), this.width, this.height);
            const position = organism.getPosition();

            this.canvasCtx.save();
            this.canvasCtx.translate(position.x * this.pixelSize, position.y * this.pixelSize);

            organism.render(this.canvasCtx, this.pixelSize);

            this.canvasCtx.restore();
        });

        this.foods.forEach((food, position) => {
            // const position = wrapPosition(food.position, this.width, this.height);

            this.canvasCtx.save();
            this.canvasCtx.translate(position.x * this.pixelSize, position.y * this.pixelSize);

            food.render(this.canvasCtx, this.pixelSize);

            this.canvasCtx.restore();
        });
    }
}

function wrapPosition(position: Position, width: number, height: number) {
    return new Position(position.x % width, position.y % height);
}

function randomPosition(width: number, height: number) {
    return new Position(getRandomInt(width), getRandomInt(height));
}

class Organism {
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

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

class Position implements Keyable {
    public readonly x: number;
    public readonly y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    toKey(): string {
        return `{x:${this.x},y: ${this.y}}`;
    }

    plusDirection(direction: Direction) {
        return new Position(this.x + direction.dx, this.y + direction.dy);
    }

    // Create a new position using the provided position as the new origin
    relativeTo(position: Position) {
        return new Position(this.x - position.x, this.y - position.y);
    }

    absoluteFrom(position: Position) {
        return new Position(this.x + position.x, this.y + position.y);
    }

    isPositioned(direction: Direction, position: Position) {
        const relativePosition = this.relativeTo(position);
        return relativePosition.x * direction.dx >= 0 && relativePosition.y * direction.dy >= 0;
    }

    distanceFrom(position: Position, direction: Direction) {
        return ((this.x - position.x) * direction.dx) + ((this.y - position.y) * direction.dy);
    }
}

class Species {

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

class Pixel {
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
        switch(colour) {
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

class PositionedPixel {
    public readonly position: Position;
    public readonly pixel: Pixel;

    constructor(position, pixel) {
        this.position = position;
        this.pixel = pixel;
    }
}

class Behaviour {
    public readonly baseAttraction: number;
    public readonly distanceCoefficient: number;

    constructor(baseAttraction: number = 0, distanceCoefficient: number = 1) {
        this.baseAttraction = baseAttraction;
        this.distanceCoefficient = distanceCoefficient;
    }

    attraction(colourIntensity: number, distance: number) {
        return (colourIntensity * this.baseAttraction) * (Math.pow(distance, this.distanceCoefficient));
    }
}

/*
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
type PixelColour = "red" | "green" | "blue";
const PIXEL_COLOURS: PixelColour[] = ["red", "green", "blue"];

class Direction {
    public static UP = new Direction(0, -1, "up");
    public static RIGHT = new Direction(1, 0, "right");
    public static DOWN = new Direction(0, 1, "down");
    public static LEFT = new Direction(-1, 0, "left");
    public static NONE = new Direction(0, 0, "none");

    public static DIRS = [Direction.UP, Direction.RIGHT, Direction.DOWN, Direction.LEFT];

    public readonly dx;
    public readonly dy;
    public readonly name;

    constructor(dx: number, dy: number, name: string) {
        this.dx = dx;
        this.dy = dy;
        this.name = name;
    }
}

const appState = new AppState(400, 200, 'world');
appState.addOrganisms(10);
appState.addFood(5000, "green");
console.log(appState);

setInterval(() => {
    appState.update();
    appState.render();
}, 100);
