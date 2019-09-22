import {Pixel, PIXEL_COLOURS, PixelColour} from "./pixel";
import {Behaviour} from "./behaviour";
import {Position} from "./position";
import {Direction} from "./direction";
import {LeoMap} from "./leo-map";

export class Species {

    public readonly generation: number;
    public readonly parent: Species | null;
    public readonly pixelMap: LeoMap<Position, Pixel>;
    public readonly behaviours: Record<PixelColour, Record<string, Behaviour>>;

    static fromPixel(initialPixel: Pixel) {
        return new Species(null, new LeoMap<Position, Pixel>().set(new Position(0, 0), initialPixel));
    }

    constructor(parent: Species | null, pixelMap: LeoMap<Position, Pixel>, behaviours?) {
        if (parent === null) {
            this.generation = 0;
        } else {
            this.generation = parent.generation + 1;
        }
        this.parent = parent;

        this.pixelMap = new LeoMap(pixelMap);

        if (behaviours) {
            this.behaviours = {
                "red": {},
                "green": {},
                "blue": {}
            };
            for (let colour of PIXEL_COLOURS) {
                for (let direction of Direction.DIRS) {
                    this.behaviours[colour][direction.name] = behaviours[colour][direction.name];
                }
            }
        } else {
            this.behaviours = {
                "red": {},
                "green": {},
                "blue": {}
            };
            for (let colour of PIXEL_COLOURS) {
                for (let direction of Direction.DIRS) {
                    this.behaviours[colour][direction.name] = new Behaviour();
                }
            }
        }
    }

    getMass(): number {
        return Array.from(this.pixelMap.values())
            .map(p => p.getMass())
            .reduce((acc, cur) => acc + cur, 0);
    }

    getBehaviour(pixelColour: PixelColour, direction: Direction): Behaviour {
        return this.behaviours[pixelColour][direction.name];
    }

    getVisionPositions(visionDistance: number): Position[] {
        let minX: number = 0;
        let minY: number = 0;
        let maxX: number = 0;
        let maxY: number = 0;
        this.pixelMap.forEach((pixel, position) => {
            minX = Math.min(minX, position.x);
            minY = Math.min(minY, position.y);
            maxX = Math.max(maxX, position.x);
            maxY = Math.max(maxY, position.y);
        });

        const positions: Position[] = [];
        for (let x = minX - visionDistance; x <= maxX + visionDistance; x++) {
            for (let y = minY - visionDistance; y <= maxY + visionDistance; y++) {
                const position = new Position(x, y);
                if (!this.pixelMap.has(position)) {
                    positions.push(position);
                }
            }
        }
        return positions;
    }

    render(canvasCtx: CanvasRenderingContext2D, pixelSize: number, textRgb: boolean = false) {
        this.pixelMap.forEach((pixel, position) => {
            canvasCtx.save();
            canvasCtx.translate(position.x * pixelSize, position.y * pixelSize);

            pixel.render(canvasCtx, pixelSize, textRgb);

            canvasCtx.restore();
        });
    }

    // TODO fix generation counting - currently can increase by 1 for each mutation
    mutate(): Species {
        // 5% chance to mutate
        if (Math.random() < 0.2) { // TODO change this back to 0.05
            let newSpecies: Species = this;
            if (Math.random() < 0.8) {
                newSpecies = Species.mutateBehaviour(newSpecies);
            }
            if (Math.random() < 0.4) {
                newSpecies = Species.mutateExistingPixels(newSpecies);
            }
            if (Math.random() < 0.1) {
                newSpecies = Species.mutateNumberOfPixels(newSpecies);
            }
            return newSpecies;
        } else {
            return this;
        }
    }

    static mutateBehaviour(originalSpecies: Species): Species {
        const newSpecies = new Species(originalSpecies, originalSpecies.pixelMap, originalSpecies.behaviours);
        for (let colour of PIXEL_COLOURS) {
            for (let direction of Direction.DIRS) {
                newSpecies.behaviours[colour][direction.name] = newSpecies.behaviours[colour][direction.name].mutate();
            }
        }

        return newSpecies;
    }

    static mutateExistingPixels(originalSpecies: Species): Species {
        const newSpecies = new Species(originalSpecies, originalSpecies.pixelMap, originalSpecies.behaviours);

        newSpecies.pixelMap.computeForEach(pixel => pixel.mutate());

        return newSpecies;
    }

    static mutateNumberOfPixels(originalSpecies: Species): Species {
        // TODO implement this
        return originalSpecies;
    }
}
