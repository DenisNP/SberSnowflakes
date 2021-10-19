/* eslint-disable no-param-reassign,no-unused-vars */

import {
    checkIntersection,
    colinearPointWithinSegment,
} from 'line-intersect';

let canvas;
let ctx;
const topMargin = 40;
const bottomMargin = 40;
const toRad = Math.PI / 180;
let edgeMargin;
let minDropletSq;
let maxDropletSq;
let minDropletLen;
let x;
let y;
let h;
let w;
let mw;
let mh;
const segments = [];
const droplets = [];

const rand = (min, max) => Math.random() * (max - min) + min;
const randInt = (min, max) => {
    const r = min + Math.random() * (max + 1 - min);
    return Math.floor(r);
};

const pDistance = (x0, y0, x1, y1, x2, y2) => {
    const A = x0 - x1;
    const B = y0 - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    if (lenSq !== 0) param = dot / lenSq;

    let xx;
    let yy;

    if (param < 0) {
        xx = x1;
        yy = y1;
    } else if (param > 1) {
        xx = x2;
        yy = y2;
    } else {
        xx = x1 + param * C;
        yy = y1 + param * D;
    }

    const dx = x0 - xx;
    const dy = y0 - yy;
    return Math.sqrt(dx * dx + dy * dy);
};

const getPointFromTop = (segment, fraction) => {
    const xLen = segment[1][0] - segment[0][0];
    const yLen = segment[1][1] - segment[0][1];
    const xTrim = fraction * xLen;
    const yTrim = fraction * yLen;
    return [segment[0][0] + xTrim, segment[0][1] + yTrim];
};

const trimTopAtPoint = (segment, point) => {
    segment[0] = point;
};

const dist = (s) => Math.sqrt((s[0][0] - s[1][0]) ** 2 + (s[0][1] - s[1][1]) ** 2);

const samePoint = (p1, p2) => p1[0] === p2[0] && p1[1] === p2[1];

const findMutualPoint = (seg1, seg2) => {
    const allPoints = [...seg1, ...seg2];
    for (let i = 0; i < allPoints.length; i++) {
        for (let k = 0; k < allPoints.length; k++) {
            if (i !== k && samePoint(allPoints[i], allPoints[k])) return allPoints[i];
        }
    }

    return null;
};

const circlesAlong = (seg, sz) => {
    const circles = [];
    const len = dist(seg);
    const num = Math.max(0, Math.floor((len - sz * 2) / (sz)));
    const step = num === 0 ? sz : ((len - sz * 2) / num);
    const ang = Math.atan2(seg[1][1] - seg[0][1], seg[1][0] - seg[0][0]);

    for (let i = 0; i <= num; i++) {
        const pt = [
            seg[0][0] + (sz + i * step) * Math.cos(ang),
            seg[0][1] + (sz + i * step) * Math.sin(ang),
        ];
        circles.push([pt[0], pt[1], sz]);
    }

    const lastPt = [
        seg[0][0] + (len - sz) * Math.cos(ang),
        seg[0][1] + (len - sz) * Math.sin(ang),
    ];
    const lastDist = dist([circles[circles.length - 1], lastPt]);
    if (lastDist > 0.1) circles.push([lastPt[0], lastPt[1], sz]);

    return circles;
};

const addDropletCircles = (d) => {
    if (d[3]) return;

    const mid = [(d[1][0] + d[0][0]) / 2, (d[1][1] + d[0][1]) / 2];
    const ang = Math.atan2(d[1][1] - d[0][1], d[1][0] - d[0][0]) + Math.PI / 2;
    const s = d[2];
    const mainAxis = [d[0], d[1]];
    const secondAxis = [[
        mid[0] + s * Math.cos(ang),
        mid[1] + s * Math.sin(ang),
    ], [
        mid[0] - s * Math.cos(ang),
        mid[1] - s * Math.sin(ang),
    ]];

    const mainDist = dist(mainAxis);
    const secondDist = dist(secondAxis);

    d[3] = mainDist >= secondDist
        ? circlesAlong(mainAxis, s)
        : circlesAlong(secondAxis, mainDist / 2);
};

const drawSegment = (segment, color, width) => {
    ctx.strokeStyle = color || '#ff0000';
    ctx.strokeWidth = width || 2;
    ctx.beginPath();
    ctx.moveTo(...segment[0]);
    ctx.lineTo(...segment[1]);
    ctx.stroke();
};

const drawCircle = (c) => {
    ctx.strokeStyle = 'green';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(c[0], c[1], c[2], 0, 2 * Math.PI);
    ctx.stroke();
};

const drawDroplet = (droplet) => {
    addDropletCircles(droplet);
    droplet[3].forEach((c) => drawCircle(c));
    drawSegment(droplet, '#00ff00', 4);
};

const intersects = (droplet, s, margin) => {
    addDropletCircles(droplet);
    for (let i = 0; i < droplet[3].length; i++) {
        const c = droplet[3][i];
        const d = pDistance(c[0], c[1], s[0][0], s[0][1], s[1][0], s[1][1]);
        if (d <= c[2] + margin) return true;
    }

    return false;
};

const includesPoint = (droplet, point) => {
    addDropletCircles(droplet);
    for (let i = 0; i < droplet[3].length; i++) {
        const c = droplet[3][i];
        const d = dist([c, point]);
        if (d < c[2]) return true;
    }

    return false;
};

const circlesIntersect = (c1, c2, margin) => {
    const dst = dist([c1, c2]);
    return dst < c1[2] + c2[2] + margin;
};

export const init = () => {
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');
    w = document.documentElement.clientWidth;
    h = document.documentElement.clientHeight;
};

const startTriangle = () => {
    mh = h - topMargin - bottomMargin;
    mw = 2 * mh * Math.tan(Math.PI * 0.08333);

    x = (w - mw) / 2;
    y = topMargin;

    ctx.fillStyle = '#ffffff';
    ctx.moveTo(x, y);
    ctx.lineTo(x + mw, y);
    ctx.lineTo(w / 2, y + mh);
    ctx.closePath();
    ctx.fill();

    segments.push([[w / 2, y + mh], [x, y]], [[x + mw, y], [w / 2, y + mh]]);

    minDropletSq = 0.01 * (mw ** 2);
    maxDropletSq = 0.08 * (mw ** 2);
    edgeMargin = 0.1 * mw;
    minDropletLen = 0.1 * mw;
};

const generateBottom = () => {
    // first line
    const angle = rand(40, 65) * toRad;
    const len = rand(mw * 0.3, mw * 0.8);
    const points = [[x, y], [x + len * Math.cos(angle), y + len * Math.sin(angle)]];
    segments.push([...points]);
    drawSegment(points);

    // next line
    const frac = Math.round(rand(0, 10)) / 20;
    const rightPoint = getPointFromTop(segments[1], frac);
    points.push(rightPoint);
    trimTopAtPoint(segments[1], rightPoint);
    segments.push([points[1], points[2]]);

    // sort segments
    const second = segments[1];
    segments.splice(1, 1);
    segments.push(second);

    segments.forEach((s) => drawSegment(s));
};

const generateDroplet = (segmentIdx) => {
    const seg = segments[segmentIdx];
    const pointStart = getPointFromTop(seg, rand(0, 1));
    const ang = Math.atan2(seg[1][1] - seg[0][1], seg[1][0] - seg[0][0])
        + Math.PI / 2 + rand(-30, 30) * toRad;
    const pointNext = [
        pointStart[0] + mh * 2 * Math.cos(ang),
        pointStart[1] + mh * 2 * Math.sin(ang),
    ];

    let minDistToIntersect = Number.MAX_VALUE;
    let lastIntersectionPoint;
    for (let i = 0; i < segments.length; i++) {
        if (i !== segmentIdx) {
            const cSeg = segments[i];
            const intersection = checkIntersection(
                pointStart[0],
                pointStart[1],
                pointNext[0],
                pointNext[1],
                cSeg[0][0],
                cSeg[0][1],
                cSeg[1][0],
                cSeg[1][1],
            );

            if (intersection.type === 'intersecting') {
                const intPt = [intersection.point.x, intersection.point.y];
                const dToInt = dist([pointStart, intPt]);
                if (dToInt < minDistToIntersect) {
                    minDistToIntersect = dToInt;
                    lastIntersectionPoint = intPt;
                }
            }
        }
    }

    if (!lastIntersectionPoint || minDistToIntersect < minDropletLen) {
        // some error, no intersection
        return null;
    }

    const len = rand(minDropletLen, minDistToIntersect);
    let size = rand(minDropletSq / len, maxDropletSq / len) / 2;
    if (size > len * 2) size = len * 2;
    if (size < minDropletLen) size = minDropletLen;
    pointNext[0] = pointStart[0] + len * Math.cos(ang);
    pointNext[1] = pointStart[1] + len * Math.sin(ang);

    const droplet = [pointStart, pointNext, size];

    const prevSeg = segmentIdx === 0 ? segments[segments.length - 1] : segments[segmentIdx - 1];
    const nextSeg = segmentIdx === segments.length - 1 ? segments[0] : segments[segmentIdx + 1];

    const intPrev = intersects(droplet, prevSeg, edgeMargin);
    const intNext = intersects(droplet, nextSeg, edgeMargin);

    if (intPrev && intNext) return null;
    // check if intersects with no neighbour
    if (segments.some((sg, sgi) => sg !== prevSeg
        && sg !== nextSeg
        && sg !== seg
        && intersects(droplet, sg, edgeMargin))) return null;

    let mutualPoint;
    if (intPrev) {
        mutualPoint = findMutualPoint(seg, prevSeg);
    } else if (intNext) {
        mutualPoint = findMutualPoint(seg, nextSeg);
    }

    if (mutualPoint && !includesPoint(droplet, mutualPoint)) return null;

    // check other droplets
    const circles = droplets.map((d) => d[3]).flat();
    addDropletCircles(droplet);

    for (let j = 0; j < circles.length; j++) {
        const cc = circles[j];
        // eslint-disable-next-line no-loop-func
        if (droplet[3].some((dc) => circlesIntersect(cc, dc, edgeMargin * 0.5))) return null;
    }

    return droplet;
};

const generateAllDroplets = () => {
    let lastDroplet = null;
    let attempts = 5000;
    let total = 0;
    while (attempts-- > 0) {
        lastDroplet = generateDroplet(randInt(0, 3));
        total++;
        if (lastDroplet !== null) {
            droplets.push(lastDroplet);
            lastDroplet = null;
            attempts = 5000;
            if (droplets.length >= 10) break;
        }
    }

    console.log(total);
    droplets.forEach((d) => drawDroplet(d));
};

export const generate = () => {
    startTriangle();
    generateBottom();
    generateAllDroplets();
};
