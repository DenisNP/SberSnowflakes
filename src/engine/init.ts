import { initLines, generateLines } from '@/engine/line';
import Point from '../models/Point';
import Segment from '../models/Segment';

let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;
const topMargin = 40;
const bottomMargin = 40;
const toRad = Math.PI / 180;
let h: number;
let w: number;
let mw: number;
let mh: number;

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

    const left = new Segment(new Point(w / 2, y + mh), new Point(x, y));
    const right = new Segment(new Point(x + mw, y), new Point(w / 2, y + mh));
    initLines(left, right);
};

export const generate = (): void => {
    startTriangle();
    generateLines();
};
