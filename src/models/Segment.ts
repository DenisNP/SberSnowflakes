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

    public get ang(): number {
        return Math.atan2(this.end.y - this.start.y, this.end.x - this.start.x);
    }

    public get angDeg(): number {
        return this.ang * (180 / Math.PI);
    }

    public get revAng(): number {
        return Math.atan2(this.start.y - this.end.y, this.start.x - this.end.x);
    }

    public get revAngDeg(): number {
        return this.revAng * (180 / Math.PI);
    }

    public equals(s: Segment): boolean {
        return this.start.equals(s.start) && this.end.equals(s.end);
    }
}
