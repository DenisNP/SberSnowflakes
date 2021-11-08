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
let mw: number;
let mh: number;
let left: Segment;
let right: Segment;
let minCutoutsCount: number;

const segments: Segment[] = [];
const cutouts: Cutout[] = [];
const cutoutSteps: CutoutStep[] = [];
const uncutSteps: CutoutStep[] = [];
let totalCutoutsSteps: number;
let finished = false;
let cRatio: number;

export const init = (
    topMargin = 40,
    bottomMargin = 50,
): void => {
    tm = topMargin;
    bm = bottomMargin;

    const canvas = <HTMLCanvasElement>document.getElementById('canvas');
    const h = document.documentElement.clientHeight * 2;
    mh = h - tm * 2 - bm * 2;
    mw = 2 * mh * Math.tan(Math.PI * 0.08333);
    canvas.width = mw;
    canvas.height = mh;
};

const startTriangle = (): void => {
    const x = 0;
    const y = 0;

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + mw, y);
    ctx.lineTo(mw / 2, y + mh);
    ctx.closePath();
    ctx.fill();

    left = new Segment(new Point(mw / 2, y + mh), new Point(x, y));
    right = new Segment(new Point(x + mw, y), new Point(mw / 2, y + mh));
    initTopCutter(left, right);
    initCutoutGen(cRatio, mw, Math.max(mw, mh));
};

const reset = ():void => {
    segments.splice(0);
    cutouts.splice(0);
    cutoutSteps.splice(0);
    uncutSteps.splice(0);
};

export const setup = (
    cutoutsRatio = 1.0,
    minCutouts = 4,
): void => {
    ctx = getContext(true);
    ctx.resetTransform();
    ctx.clearRect(0, 0, mw, mh);
    cRatio = cutoutsRatio;
    minCutoutsCount = minCutouts;
    finished = false;

    reset();
    startTriangle();
};

export const generate = (): void => {
    let globalIterations = 10;
    while (cutouts.length < minCutoutsCount && globalIterations-- > 0) {
        // reset
        reset();

        // generate base and top
        segments.push(new Segment(left.start, left.end), new Segment(right.start, right.end));
        const topSegments: Segment[] = generateTop();

        // save top points as first cutout step
        const topPoints: Point[] = topSegments.map((ts) => ts.start);
        topPoints.push(topSegments[topSegments.length - 1].end, right.start);
        cutoutSteps.push(new CutoutStep(topPoints));

        // cut right segment
        segments[segments.length - 1].start = topSegments[topSegments.length - 1].end;

        // add new segments
        segments.splice(1, 0, ...topSegments);

        // generate cutouts
        let iterations = 5000;
        while (iterations-- > 0 && segments.length > 0) {
            const cutout = generateCutout(segments, cutouts);
            if (cutout !== null) {
                iterations = 5000;
                cutoutSteps.push(cutout.toCutoutStep());
            }
        }
        totalCutoutsSteps = cutoutSteps.length;
    }
};

export const nextStep = (): number => {
    uncutSteps.forEach((us) => us.restoreCanvasRect());
    while (uncutSteps.length > 0) {
        (uncutSteps.shift() as CutoutStep).cut();
    }
    // just snow final snowflake
    if (cutoutSteps.length === 0) {
        if (!finished) {
            generateFullSnowflake();
            finished = true;
            return -1;
        }
        return -2;
    }
    // first step always single
    if (totalCutoutsSteps === cutoutSteps.length) {
        const step = cutoutSteps.shift() as CutoutStep;
        step.storeCanvasRect();
        step.draw();
        uncutSteps.push(step);
        return 0;
    }
    // other steps single or in groups
    const stepsToShowCount = totalCutoutsSteps <= 5 ? 1 : 2;
    const steps = cutoutSteps.splice(0, stepsToShowCount);
    steps.forEach((s) => s.storeCanvasRect());
    steps.forEach((s) => s.draw());
    uncutSteps.push(...steps);
    return steps.length;
};
