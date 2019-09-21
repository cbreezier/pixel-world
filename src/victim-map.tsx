import {LeoMap} from "./leo-map";
import {Victim} from "./victim";
import {Position} from "./position";
import {Pixel} from "./pixel";
import {Organism} from "./organism";

export class VictimMap {
    private victims: LeoMap<Position, LeoMap<Victim, number>>;

    constructor() {
        this.victims = new LeoMap();
    }

    getVictim(position: Position) {
        return this.victims.get(position);
    }

    forEach(callback: (victimSet: Map<Victim, number>, position: Position, map: Map<Position, Map<Victim, number>>) => void) {
        this.victims.forEach(callback);
    }

    removeVictim(position: Position, victim: Victim) {
        this.victims.compute(
            position,
            victimMap => {
                victimMap.compute(
                    victim,
                    curNum => {
                        curNum--;
                        if (curNum === 0) {
                            return undefined;
                        } else {
                            return curNum;
                        }
                    },
                    () => {
                        throw new Error('Trying to remove non-existent victim: ' + victim.pixel.toKey());
                    }
                );

                if (victimMap.size == 0) {
                    return undefined;
                } else {
                    return victimMap;
                }
            },
            () => {
                throw new Error('Trying to remove non-existent victim: ' + victim.pixel.toKey());
            }
        );
    }

    removeVictimByPixel(position: Position, pixel: Pixel) {
        this.removeVictim(position, new Victim(pixel));
    }

    addVictim(position: Position, victim: Victim) {
        this.victims.compute(
            position,
            victimMap => {
                victimMap.compute(
                    victim,
                    curNum => curNum + 1,
                    () => 1
                );

                return victimMap;
            },
            () => {
                return new LeoMap<Victim, number>().set(victim, 1);
            }
        );
    }

    removeOrganism(organism: Organism): void {
        organism.getAbsoluteCellPositions().forEach(cell => {
            this.removeVictimByPixel(cell.position, cell.pixel);
        });
    }

    addOrganism(organism: Organism): void {
        organism.getAbsoluteCellPositions().forEach(cell => {
            this.addVictim(cell.position, new Victim(cell.pixel, organism));
        });
    }

    turnIntoFood(organism: Organism): void {
        organism.getAbsoluteCellPositions().forEach(pp => {
            this.addVictim(pp.position, new Victim(pp.pixel));
        });
    }
}
