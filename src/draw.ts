/* eslint-disable no-param-reassign,no-unused-vars */

import {
    checkIntersection,
    colinearPointWithinSegment,
} from 'line-intersect';
import Point from './models/Point';
import Segment from './models/Segment';

let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;
const topMargin = 40;
const bottomMargin = 40;
const toRad = Math.PI / 180;
let h: number;
let w: number;
let mw: number;
let mh: number;
const segments: Segment[] = [];

const rand = (min: number, max: number): number => Math.random() * (max - min) + min;
const randInt = (min: number, max: number): number => {
    const r = min + Math.random() * (max + 1 - min);
    return Math.floor(r);
};

const pDistance = (p0: Point, p1: Point, p2: Point): number => {
    const A = p0.x - p1.x;
    const B = p0.y - p1.y;
    const C = p2.x - p1.x;
    const D = p2.y - p1.y;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    if (lenSq !== 0) param = dot / lenSq;

    let xx;
    let yy;

    if (param < 0) {
        xx = p1.x;
        yy = p1.y;
    } else if (param > 1) {
        xx = p2.x;
        yy = p2.y;
    } else {
        xx = p1.x + param * C;
        yy = p1.y + param * D;
    }

    const dx = p0.x - xx;
    const dy = p0.y - yy;
    return Math.sqrt(dx * dx + dy * dy);
};

const getPointFromTop = (segment: Segment, fraction: number): Point => {
    const { xLen, yLen } = segment;
    const xTrim = fraction * xLen;
    const yTrim = fraction * yLen;
    return new Point(segment.start.x + xTrim, segment.start.y + yTrim);
};

const drawSegment = (segment: Segment, color: string, width: number): void => {
    ctx.strokeStyle = color || '#ff0000';
    ctx.lineWidth = width || 2;
    ctx.beginPath();
    ctx.moveTo(segment.start.x, segment.start.y);
    ctx.lineTo(segment.end.x, segment.end.y);
    ctx.stroke();
};

export const init = (): void => {
    canvas = <HTMLCanvasElement>document.getElementById('canvas');
    ctx = <CanvasRenderingContext2D>canvas.getContext('2d');
    w = document.documentElement.clientWidth;
    h = document.documentElement.clientHeight;
};

const startTriangle = (): void => {
    mh = h - topMargin - bottomMargin;
    mw = 2 * mh * Math.tan(Math.PI * 0.08333);

    const x = (w - mw) / 2;
    const y = topMargin;

    ctx.fillStyle = '#ffffff';
    ctx.moveTo(x, y);
    ctx.lineTo(x + mw, y);
    ctx.lineTo(w / 2, y + mh);
    ctx.closePath();
    ctx.fill();

    segments.push(new Segment(new Point(w / 2, y + mh), new Point(x, y)),
        new Segment(new Point(x + mw, y), new Point(w / 2, y + mh)));
};

export const generate = (): void => {
    startTriangle();
};
