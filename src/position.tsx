import {Keyable} from "./leo-map";
import {Direction} from "./direction";

export class Position implements Keyable {
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
