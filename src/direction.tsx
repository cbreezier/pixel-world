export class Direction {
    public static UP = new Direction(0, -1, "up");
    public static RIGHT = new Direction(1, 0, "right");
    public static DOWN = new Direction(0, 1, "down");
    public static LEFT = new Direction(-1, 0, "left");
    public static NONE = new Direction(0, 0, "none");

    public static DIRS = [Direction.UP, Direction.RIGHT, Direction.DOWN, Direction.LEFT];

    public readonly dx: number;
    public readonly dy: number;
    public readonly name: string;

    constructor(dx: number, dy: number, name: string) {
        this.dx = dx;
        this.dy = dy;
        this.name = name;
    }
}
