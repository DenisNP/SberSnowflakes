/* eslint-disable no-param-reassign,@typescript-eslint/no-explicit-any */
import { checkIntersection } from 'line-intersect';
import Point from '@/models/Point';
import Segment from '@/models/Segment';

export const rand = (min: number, max: number): number => Math.random() * (max - min) + min;
export const randInt = (min: number, max: number): number => {
    const r = min + Math.random() * (max + 1 - min);
    return Math.floor(r);
};

// eslint-disable-next-line max-len
export const dist = (p1: Point, p2: Point): number => Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);

export const prob = (p: number): boolean => Math.random() < p;

export const getPointFromStart = (segment: Segment, fraction: number): Point => {
    const { xLen, yLen } = segment;
    const xTrim = fraction * xLen;
    const yTrim = fraction * yLen;
    return new Point(segment.start.x + xTrim, segment.start.y + yTrim);
};

export const getSubSegment = (segment: Segment, edge: number): Segment => {
    const l = segment.len;
    const startEdge = edge / l;
    const endEdge = 1 - startEdge;
    return new Segment(getPointFromStart(segment, startEdge), getPointFromStart(segment, endEdge));
};

export const intersect = (f: Segment, s: Segment): Point | null => {
    const i = checkIntersection(
        f.start.x,
        f.start.y,
        f.end.x,
        f.end.y,
        s.start.x,
        s.start.y,
        s.end.x,
        s.end.y,
    ) as any;

    if (i.point) {
        return new Point(i.point.x, i.point.y);
    }

    return null;
};

let canvasContext: CanvasRenderingContext2D;

export const getContext = (): CanvasRenderingContext2D => {
    if (canvasContext) return canvasContext;
    const canvas = <HTMLCanvasElement>document.getElementById('canvas');
    canvasContext = <CanvasRenderingContext2D>canvas.getContext('2d');
    return canvasContext;
};

export const calcSquare = (p1: Point, p2: Point, p3: Point): number => {
    const a = dist(p1, p2);
    const b = dist(p2, p3);
    const c = dist(p3, p1);
    const p = (a + b + c) / 2;

    return Math.sqrt(p * (p - 1) * (p - b) * (p - c));
};

export const randomPointBetween = (p1: Point, p2: Point): Point => {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const ratio = Math.random();

    return new Point(p1.x + dx * ratio, p1.y + dy * ratio);
};

export const randomPointWithEdge = (segment: Segment, edge: number) => {
    const ss = getSubSegment(segment, edge);
    return randomPointBetween(ss.start, ss.end);
};

export const fromAngAndLen = (start: Point, ang: number, len: number): Segment => {
    const end = new Point(start.x + len * Math.cos(ang), start.y + len * Math.sin(ang));
    return new Segment(start, end);
};

export const drawSegment = (
    ctx: CanvasRenderingContext2D,
    segment: Segment,
    color = '#ff0000',
    width = 2,
): void => {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(segment.start.x, segment.start.y);
    ctx.lineTo(segment.end.x, segment.end.y);
    ctx.stroke();
};

export const toRad = Math.PI / 180;
