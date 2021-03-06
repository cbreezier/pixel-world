import {Species} from "./species";
import {LeoMap} from "./leo-map";

export class TopSpecies {
    private readonly speciesInfoMap: LeoMap<Species, SpeciesInfo>;

    constructor() {
        this.speciesInfoMap = new LeoMap();
    }

    getTopSpecies(n: number) {
        return [...this.speciesInfoMap.values()].sort((a, b) => b.count - a.count).slice(0, n);
    }

    addSpecies(species: Species) {
        const speciesInfo = this.speciesInfoMap.get(species);
        if (speciesInfo !== undefined) {
            speciesInfo.count++;
        } else {
            this.speciesInfoMap.set(species, new SpeciesInfo(species, 1));
        }
    }

    removeSpecies(species: Species) {
        const speciesInfo = this.speciesInfoMap.get(species);
        if (speciesInfo !== undefined) {
            speciesInfo.count--;
            if (speciesInfo.count === 0) {
                this.speciesInfoMap.delete(species);
            }
        } else {
            throw new Error('Trying to remove non-existent species');
        }
    }
}

export class SpeciesInfo {
    public readonly species: Species;
    public count: number;

    constructor(species: Species, count: number) {
        this.species = species;
        this.count = count;
    }
}
