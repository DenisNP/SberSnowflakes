import { initTopCutter, generateTop } from '@/engine/topCutter';
import Point from '../models/Point';
import Segment from '../models/Segment';
import { calcSquare, drawSegment, getContext } from '@/engine/utils';

let ctx: CanvasRenderingContext2D;
const topMargin = 40;
const bottomMargin = 40;
let h: number;
let w: number;
let mw: number;
let mh: number;
let left: Segment;
let right: Segment;

const segments: Segment[] = [];
let totalSquare: number;

export const init = (): void => {
    ctx = getContext();
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

    left = new Segment(new Point(w / 2, y + mh), new Point(x, y));
    right = new Segment(new Point(x + mw, y), new Point(w / 2, y + mh));
    segments.push(left, right);
    initTopCutter(left, right);

    totalSquare = calcSquare(left.start, left.end, right.start);
};

export const generate = (): void => {
    startTriangle();
    const topSegments: Segment[] = generateTop();
    topSegments.forEach((s) => {
        const sq = calcSquare(s.start, s.end, right.start);
        totalSquare -= sq;
        drawSegment(getContext(), s);
    });
    segments.splice(1, 0, ...topSegments);
};
