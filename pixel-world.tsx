import {Position} from "./src/position";
import {Pixel, PIXEL_COLOURS, PixelColour} from "./src/pixel";
import {Species} from "./src/species";
import {Organism} from "./src/organism";
import {getRandomInt} from "./src/util";
import {TopSpecies} from "./src/top-species";
import {Direction} from "./src/direction";
import {Victim} from "./src/victim";
import {VictimMap} from "./src/victim-map";

class AppState {
    private organisms: Set<Organism>;
    private victimMap: VictimMap;
    private topSpecies: TopSpecies;
    private time: number;

    public readonly width: number;
    public readonly height: number;
    public readonly config: {tickIntervalMs: number, paused: boolean, renderFullnessPercent: boolean, renderWorld: boolean, renderTopSpecies: boolean};

    private readonly canvasId: string;
    private readonly canvas: HTMLCanvasElement;
    private readonly canvasCtx: CanvasRenderingContext2D;
    private readonly pixelSize: number;

    constructor(width: number, height: number, canvasId: string) {
        this.organisms = new Set();
        this.victimMap = new VictimMap();
        this.topSpecies = new TopSpecies();
        this.time = 0;

        this.width = width;
        this.height = height;
        this.config = {
            tickIntervalMs: 50,
            paused: false,
            renderFullnessPercent: false,
            renderWorld: true,
            renderTopSpecies: true
        };

        this.canvasId = canvasId;
        this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        this.canvasCtx = this.canvas.getContext('2d')!;
        this.pixelSize = Math.min(
            this.canvas.width / this.width,
            this.canvas.height / this.height
        );
    }

    getTopSpecies(n: number) {
        return this.topSpecies.getTopSpecies(n);
    }

    getTime() {
        return this.time;
    }

    // TODO testing method only
    addOrganisms(n: number, colour: PixelColour) {
        let red = 0;
        let green = 0;
        let blue = 0;

        if (colour === "red") {
            red = 100;
        } else if (colour === "green") {
            green = 100;
        } else if (colour === "blue") {
            blue = 100;
        }
        const initialSpecies = Species.fromPixel(new Pixel(red, green, blue, true));

        for (let i = 0; i < n; i++) {
            const newOrganism = new Organism(
                initialSpecies,
                randomPosition(this.width, this.height),
                Math.floor(initialSpecies.getMass() / 5)
            );

            this.addOrganism(newOrganism);
            this.topSpecies.addSpecies(initialSpecies);
        }

        console.log(`Added ${n} organisms`);
    }

    addFood(n: number, colour: PixelColour) {
        let red = 0;
        let green = 0;
        let blue = 0;

        if (colour === "red") {
            red = 30;
        } else if (colour === "green") {
            green = 30;
        } else if (colour === "blue") {
            blue = 30;
        }

        for (let i = 0; i < n; i++) {
            const position = randomPosition(this.width, this.height);
            const victim = new Victim(
                new Pixel(red, green, blue, false)
            );
            this.victimMap.addVictim(position, victim);
        }
    }

    update() {
        [...this.organisms.values()].forEach(organism => {
            // Check that we haven't already been removed - damn you global state mutation!!!
            if (!this.organisms.has(organism)) {
                return;
            }

            if (organism.getFood() < 0) {
                // Dead, so turn it into food
                this.removeOrganism(organism);
                this.victimMap.turnIntoFood(organism);
                this.topSpecies.removeSpecies(organism.species);
                return;
            }

            // TODO give organisms visibility of their surroundings
            // TODO make this less error prone
            this.removeOrganism(organism);
            organism.move([]);
            organism.setPosition(wrapPosition(organism.getPosition(), this.width, this.height));
            this.addOrganism(organism);

            organism.getAbsoluteCellPositions().forEach((organismPixel, organismPosition) => {
                const victims = this.victimMap.getVictim(organismPosition);
                if (!victims) {
                    return;
                }

                victims.forEach((victimNumber, victim) => {
                    const victimColour = victim.pixel.getPrimaryColour();
                    const victimValue = victim.pixel.getIntensity(victimColour);
                    const predatorColour = Pixel.getPredator(victim.pixel.getPrimaryColour());
                    const predatorValue = organismPixel.getIntensity(predatorColour);

                    if (predatorValue > victimValue) {
                        // Eat it!
                        for (let i = 0; i < victimNumber; i++) {
                            organism.addFood(victim.getFoodValue());

                            // Remove the victim
                            if (victim.organism) {
                                this.removeOrganism(victim.organism);
                                this.topSpecies.removeSpecies(organism.species);
                            } else {
                                this.victimMap.removeVictim(organismPosition, victim);
                            }
                        }
                    }
                });
            });

            // Potentially reproduce
            const newOrganism = organism.tryReproduce();
            if (newOrganism) {
                this.addOrganism(newOrganism);
                this.topSpecies.addSpecies(newOrganism.species);
            }
        });

        // Periodically sow more food
        if (this.time % 40 === 0) {
            this.addFood(50, "red");
            this.addFood(50, "green");
            this.addFood(50, "blue");
        }

        /* TODO fix this
        // Periodically decay food
        if (this.time % 100 === 0) {
            this.foods.computeForEach(pixel => pixel.decay(1))
        }
        */

        this.time++;
    }

    render() {
        this.canvasCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        [...this.organisms.values()].flat().forEach(organism => {
            // const position = wrapPosition(organism.getPosition(), this.width, this.height);
            const position = organism.getPosition();

            this.canvasCtx.save();
            this.canvasCtx.translate(position.x * this.pixelSize, position.y * this.pixelSize);

            organism.render(this.canvasCtx, this.pixelSize, this.config.renderFullnessPercent);

            this.canvasCtx.restore();
        });

        this.victimMap.forEach((victimSet, position) => {
            this.canvasCtx.save();
            this.canvasCtx.translate(position.x * this.pixelSize, position.y * this.pixelSize);

            // Assume set not empty
            victimSet.keys().next().value.pixel.render(this.canvasCtx, this.pixelSize);

            this.canvasCtx.restore();
        });
    }

    private removeOrganism(organism: Organism): void {
        this.organisms.delete(organism);
        this.victimMap.removeOrganism(organism);
    }

    private addOrganism(organism: Organism): void {
        this.organisms.add(organism);
        this.victimMap.addOrganism(organism);
    }
}

function wrapPosition(position: Position, width: number, height: number) {
    if (position.x < 0 || position.x > width || position.y < 0 || position.y > height) {
        return new Position((position.x + width) % width, (position.y + height) % height);
    } else {
        return position;
    }
}

function randomPosition(width: number, height: number) {
    return new Position(getRandomInt(width), getRandomInt(height));
}

function renderTopSpecie(speciesInfo: {species: Species, count: number}, order: number): string {
    let result: string = '';
    result += `<div id="species${order}" style="border: 1px solid blue; margin: 5px;">`;
    result += `<canvas id="species-canvas${order}" width="100" height="100" style="background-color: black; display: inline-block"></canvas>`;

    result += `<div style="display: inline-block; margin: 5px;">`;
    result += `Generation: ${speciesInfo.species.generation}<br>`;
    result += `Count: ${speciesInfo.count}<br>`;
    result += `Mass: ${speciesInfo.species.getMass()}<br>`;
    result += `</div>`;

    result += `<div style="display: inline-block; margin: 5px; font-size: 8px;">`;
    for (let colour of PIXEL_COLOURS) {
        for (let direction of Direction.DIRS) {
            const behaviour = speciesInfo.species.getBehaviour(colour, direction);
            const baseAttraction = behaviour.baseAttraction;
            const distanceCoefficient = behaviour.distanceCoefficient;
            result += `${colour} ${direction.name}: ${baseAttraction.toFixed(2)} ${distanceCoefficient.toFixed(2)}<br>`;
        }
    }
    result += `</div>`;

    result += `</div>`;

    return result;
}

function renderTopSpecies(divId: string, appState: AppState) {
    const topSpeciesDiv = document.getElementById(divId)!;

    topSpeciesDiv.innerHTML = '';
    const topSpecies = appState.getTopSpecies(5);
    for (let i = 0; i < topSpecies.length; i++) {
        const speciesInfo = topSpecies[i];
        topSpeciesDiv.innerHTML += renderTopSpecie(speciesInfo, i);
    }
    for (let i = 0; i < topSpecies.length; i++) {
        const speciesInfo = topSpecies[i];

        // TODO hardcoded 5x5, make it different
        const canvas = document.getElementById(`species-canvas${i}`)! as HTMLCanvasElement;
        const canvasCtx = canvas.getContext('2d')!;
        const pixelSize = canvas.width / 5;

        canvasCtx.save();
        canvasCtx.translate(2 * pixelSize, 2 * pixelSize);
        speciesInfo.species.render(canvasCtx, pixelSize, true);
        canvasCtx.restore();
    }
}

const appState = new AppState(400, 200, 'world');
appState.addOrganisms(10, "red");
appState.addOrganisms(10, "green");
appState.addOrganisms(10, "blue");
appState.addFood(1500, "red");
appState.addFood(1500, "green");
appState.addFood(1500, "blue");
console.log(appState);

function setTickIntervalMs() {
    const intervalControlInputElement = document.getElementById('interval-control')! as HTMLInputElement;
    const newInterval = parseInt(intervalControlInputElement.value);
    console.log('newInterval', newInterval);
    appState.config.tickIntervalMs = newInterval;
}

function togglePause() {
    appState.config.paused = !appState.config.paused;
}

function toggleRenderFullnessPercent() {
    appState.config.renderFullnessPercent = !appState.config.renderFullnessPercent;
}

function toggleRenderWorld() {
    appState.config.renderWorld = !appState.config.renderWorld;
}

function toggleRenderTopSpecies() {
    appState.config.renderTopSpecies = !appState.config.renderTopSpecies;
}

document.getElementById ("toggle-pause")!.addEventListener("click", togglePause, false);
document.getElementById ("toggle-render-fullness-percent")!.addEventListener("click", toggleRenderFullnessPercent, false);
document.getElementById ("toggle-render-world")!.addEventListener("click", toggleRenderWorld, false);
document.getElementById ("toggle-render-top-species")!.addEventListener("click", toggleRenderTopSpecies, false);
document.getElementById ("interval-control")!.addEventListener("change", setTickIntervalMs, false);

function updateLoop() {
    if (!appState.config.paused) {
        appState.update();
        if (appState.config.renderWorld) {
            appState.render();
        }
        if (appState.config.renderTopSpecies) {
            renderTopSpecies('top-species', appState);
        }
        document.getElementById('time')!.innerText = appState.getTime().toLocaleString();
    }

    setTimeout(updateLoop, appState.config.tickIntervalMs);
}

updateLoop();
