export default class Point {
    public x: number;

    public y: number;

    constructor(_x: number, _y: number) {
        this.x = _x;
        this.y = _y;
    }

    public equals(p: Point) {
        return this.x === p.x && this.y === p.y;
    }
}
