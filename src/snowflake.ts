import { initTopCutter, generateTop } from '@/engine/topCutter';
import Point from './models/Point';
import Segment from './models/Segment';
import { getContext } from '@/engine/utils';
import { generateCutout, initCutoutGen } from '@/engine/cutoutGenerator';
import Cutout from '@/models/Cutout';
import CutoutStep from '@/models/CutoutStep';
import generateFullSnowflake from '@/engine/finalGenerator';

let ctx: CanvasRenderingContext2D;
let tm: number;
let bm: number;
let h: number;
let w: number;
let mw: number;
let mh: number;
let left: Segment;
let right: Segment;
let minCutoutsCount: number;

const segments: Segment[] = [];
const cutouts: Cutout[] = [];
const cutoutSteps: CutoutStep[] = [];
let lastCutoutStep = 0;
let cRatio: number;

export const init = (
    cutoutsRatio = 1.0,
    minCutouts = 4,
    topMargin = 40,
    bottomMargin = 50,
): void => {
    tm = topMargin;
    bm = bottomMargin;

    const canvas = <HTMLCanvasElement>document.getElementById('canvas');
    w = document.documentElement.clientWidth * 2;
    h = document.documentElement.clientHeight * 2;
    mh = h - tm * 2 - bm * 2;
    mw = 2 * mh * Math.tan(Math.PI * 0.08333);
    canvas.width = mw;
    canvas.height = mh;

    ctx = getContext();
    cRatio = cutoutsRatio;
    minCutoutsCount = minCutouts;
};

const startTriangle = (): void => {
    const x = 0;
    const y = 0;

    ctx.fillStyle = '#ffffff';
    ctx.moveTo(x, y);
    ctx.lineTo(x + mw, y);
    ctx.lineTo(mw / 2, y + mh);
    ctx.closePath();
    ctx.fill();

    left = new Segment(new Point(mw / 2, y + mh), new Point(x, y));
    right = new Segment(new Point(x + mw, y), new Point(mw / 2, y + mh));
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
        cutoutSteps.splice(0, cutoutSteps.length);
        lastCutoutStep = 0;

        // generate base and top
        startTriangle();
        const topSegments: Segment[] = generateTop();

        // save top points as first cutout step
        const topPoints: Point[] = topSegments.map((ts) => ts.start);
        topPoints.push(topSegments[topSegments.length - 1].end, right.start);
        cutoutSteps.push(new CutoutStep(topPoints));

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
                cutoutSteps.push(cutout.toCutoutStep());
            }
        }
    }
};

export const numberOfSteps = () => cutoutSteps.length;

export const nextStep = (): boolean => {
    if (lastCutoutStep > 0 && lastCutoutStep <= cutoutSteps.length) {
        const prevStep = cutoutSteps[lastCutoutStep - 1];
        prevStep.cut();
    }
    if (lastCutoutStep === cutoutSteps.length) {
        // just show final result
        lastCutoutStep++;
        return true;
    }
    if (lastCutoutStep > cutoutSteps.length) {
        generateFullSnowflake();
        return false;
    }
    const step = cutoutSteps[lastCutoutStep];
    step.draw();
    lastCutoutStep++;
    return true;
};
