import Point from './Point';

export default class Segment {
    public start: Point;

    public end: Point;

    constructor(_start: Point, _end: Point) {
        this.start = _start;
        this.end = _end;
    }

    public get xLen(): number {
        return this.end.x - this.start.x;
    }

    public get yLen(): number {
        return this.end.y - this.start.y;
    }

    public get len(): number {
        return Math.sqrt(this.xLen ** 2 + this.yLen ** 2);
    }
}
