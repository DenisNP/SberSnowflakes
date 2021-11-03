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

    public distanceToPoint(p: Point): number {
        const A = p.x - this.start.x;
        const B = p.y - this.start.y;
        const C = this.xLen;
        const D = this.yLen;

        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;
        if (lenSq !== 0) param = dot / lenSq;

        let xx;
        let yy;

        if (param < 0) {
            xx = this.start.x;
            yy = this.start.y;
        } else if (param > 1) {
            xx = this.end.x;
            yy = this.end.y;
        } else {
            xx = this.start.x + param * C;
            yy = this.start.y + param * D;
        }

        const dx = p.x - xx;
        const dy = p.y - yy;
        return Math.sqrt(dx * dx + dy * dy);
    }
}
