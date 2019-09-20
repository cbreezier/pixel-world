import {LeoMap} from './src/leo-map';
import {Position} from "./src/position";
import {Pixel, PixelColour} from "./src/pixel";
import {Species} from "./src/species";
import {Organism} from "./src/organism";
import {getRandomInt} from "./src/util";

class AppState {
    private organisms: LeoMap<Position, Organism[]>;
    private foods: LeoMap<Position, Pixel>;
    private species: {species: Species, count: number}[];
    private time: number;

    public readonly width: number;
    public readonly height: number;

    private readonly canvasId: string;
    private readonly canvas: HTMLCanvasElement;
    private readonly canvasCtx: CanvasRenderingContext2D;
    private readonly pixelSize: number;

    constructor(width: number, height: number, canvasId: string) {
        this.organisms = new LeoMap();
        this.foods = new LeoMap();
        this.species = [];
        this.time = 0;

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

    // TODO testing method only
    addOrganisms(n: number) {
        const initialSpecies = Species.fromPixel(new Pixel(180, 0, 0, true));

        for (let i = 0; i < n; i++) {
            const newOrganism = new Organism(
                initialSpecies,
                randomPosition(this.width, this.height),
                Math.floor(initialSpecies.getMass() / 5)
            );

            this.addOrganism(newOrganism);
        }

        this.species.push({
            species: initialSpecies,
            count: n
        });

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
        [...this.organisms.values()].flat().forEach(organism => {
            if (organism.getFood() < 0) {
                // Dead, so turn it into food
                this.removeOrganism(organism);
                this.turnIntoFood(organism);
                this.removeSpecies(organism.species);
                return;
            }

            // TODO give organisms visibility of their surroundings
            // TODO make this less error prone
            this.removeOrganism(organism);
            organism.move([]);
            this.addOrganism(organism);

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
                this.addOrganism(newOrganism);
                this.addSpecies(newOrganism.species);
            }
        });

        // Periodically sow more food
        if (this.time % 600 === 0) {
            this.addFood(500, "green");
        }

        this.time++;
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

    private removeOrganism(organism: Organism): void {
        this.organisms.compute(
            organism.getPosition(),
            cur => cur.filter(o => o !== organism),
            () => {
                throw new Error('Cannot find organism at its position');
            }
        );
    }

    private addOrganism(organism: Organism): void {
        this.organisms.compute(
            organism.getPosition(),
            cur => [...cur, organism],
            () => [organism]
        );
    }

    private turnIntoFood(organism: Organism): void {
        organism.getAbsoluteCellPositions().forEach(pp => {
            this.foods.set(pp.position, pp.pixel);
        });
    }

    private addSpecies(species: Species): void {
        const existingSpecies = this.species.find(cur => cur.species === species);
        if (existingSpecies === undefined) {
            this.species.push({
                species: species,
                count: 1
            });
        } else {
            existingSpecies.count++;
        }
        this.species.sort((a, b) => b.count - a.count);
    }

    private removeSpecies(species: Species): void {
        const existingSpecies = this.species.find(cur => cur.species === species);
        if (existingSpecies === undefined) {
            throw new Error('No species left to remove!');
        } else {
            existingSpecies.count--;
        }
        this.species.sort((a, b) => b.count - a.count);
    }
}

function wrapPosition(position: Position, width: number, height: number) {
    return new Position(position.x % width, position.y % height);
}

function randomPosition(width: number, height: number) {
    return new Position(getRandomInt(width), getRandomInt(height));
}

const appState = new AppState(400, 200, 'world');
appState.addOrganisms(10);
appState.addFood(5000, "green");
console.log(appState);

setInterval(() => {
    appState.update();
    appState.render();
}, 50);
