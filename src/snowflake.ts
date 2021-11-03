import { initTopCutter, generateTop } from '@/engine/topCutter';
import Point from './models/Point';
import Segment from './models/Segment';
import { calcSquare, drawSegment, getContext } from '@/engine/utils';
import { generateCutout, initCutoutGen } from '@/engine/cutoutGenerator';
import Cutout from '@/models/Cutout';

let ctx: CanvasRenderingContext2D;
const topMargin = 40;
const bottomMargin = 40;
let h: number;
let w: number;
let mw: number;
let mh: number;
let left: Segment;
let right: Segment;
let minCutoutsCount: number;

const segments: Segment[] = [];
const cutouts: Cutout[] = [];
let cRatio: number;

export const init = (cutoutsRatio = 1.0, minCutouts = 4): void => {
    ctx = getContext();
    w = document.documentElement.clientWidth;
    h = document.documentElement.clientHeight;
    cRatio = cutoutsRatio;
    minCutoutsCount = minCutouts;
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
    initCutoutGen(cRatio, mw, Math.max(mw, mh));
};

export const generate = (): void => {
    let globalIterations = 10;
    while (cutouts.length < minCutoutsCount && globalIterations-- > 0) {
        // reset
        segments.splice(0, segments.length);
        cutouts.splice(0, cutouts.length);

        // generate base and top
        startTriangle();
        const topSegments: Segment[] = generateTop();

        // cut right segment
        right.start = topSegments[topSegments.length - 1].end;

        // add new segments
        segments.splice(1, 0, ...topSegments);

        // generate cutouts
        let iters = 5000;
        while (iters-- > 0 && segments.length > 0) {
            const cutout = generateCutout(segments, cutouts);
            if (cutout !== null) {
                iters = 5000;
            }
        }
    }

    segments.forEach((s) => {
        drawSegment(getContext(), s);
    });
    cutouts.forEach((c) => {
        drawSegment(ctx, c.firstSeg, '#00FF00');
        drawSegment(ctx, c.secondSeg, '#00FF00');
    });
};
