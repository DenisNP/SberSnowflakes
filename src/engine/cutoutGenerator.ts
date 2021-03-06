import Segment from '@/models/Segment';
import Cutout from '@/models/Cutout';
import {
    dist,
    fromAngAndLen, getPointFromStart,
    intersect,
    rand,
    randomPointWithMargin,
    toRad,
} from '@/engine/utils';
import Point from '@/models/Point';

let margin: number;
let innerMargin: number;
let pointToSegmentMargin: number;
let minEdgeSegmentLen: number;
let maxEdgeSegmentLen: number;
let minCutoutLength: number;
let minCutoutSq: number;
let maxCutoutSq: number;
let maxCutoutStretch: number;
const maxSlantAng = 60;
let maxProjection: number;

const selectSegment = (segments: Segment[]) => {
    const suitableSegments = segments.filter((s) => s.len >= margin * 2 + minEdgeSegmentLen);
    if (suitableSegments.length === 0) return -1;

    // select segments based on its length
    const sumLength = suitableSegments.reduce((sum, { len }) => sum + len, 0);
    const r = rand(0, sumLength);
    let currentLength = 0;
    for (let i = 0; i < suitableSegments.length; i++) {
        currentLength += suitableSegments[i].len;
        if (r <= currentLength) return segments.indexOf(suitableSegments[i]);
    }

    return -1;
};

const shortestDist = (segments: Segment[], proj: Segment) => {
    let minDist = Number.MAX_VALUE;
    segments.forEach((s) => {
        const i = intersect(s, proj);
        if (i !== null) {
            const d = dist(i, proj.start);
            if (d < minDist) {
                minDist = d;
            }
        }
    });

    return minDist;
};

const shortestDistBetweenPointAndSegments = (segments: Segment[], p: Point) => Math.min(
    ...segments.map((s) => s.distanceToPoint(p)),
);

const shortestDistBetweenPointsAndSegment = (s: Segment, points: Point[]) => Math.min(
    ...points.map((p) => s.distanceToPoint(p)),
);

export const initCutoutGen = (cutoutsRatio: number, w: number, longest: number): void => {
    const sqRatio = cutoutsRatio ** 0.5;
    const quarterRatio = cutoutsRatio ** 0.25;
    margin = (w * 0.08) / sqRatio;
    innerMargin = (margin * 2) / quarterRatio;
    pointToSegmentMargin = margin / quarterRatio;
    minEdgeSegmentLen = (w * 0.1) / cutoutsRatio;
    maxEdgeSegmentLen = (w * 0.5) / Math.max(1, quarterRatio);
    minCutoutSq = (w * w * 0.04) / cutoutsRatio;
    maxCutoutSq = (w * w * 0.10) / Math.max(1, quarterRatio);
    maxProjection = longest * 2;
    minCutoutLength = minEdgeSegmentLen / 2;
    maxCutoutStretch = 5 * Math.max(1, cutoutsRatio);
};

export const generateCutout = (segments: Segment[], cutouts: Cutout[]): Cutout | null => {
    // select segment and remove
    const segmentIndex = selectSegment(segments);
    if (segmentIndex === -1) return null;
    const segment = segments[segmentIndex];

    // choose center point and sides
    const centerPoint = randomPointWithMargin(segment, margin + minEdgeSegmentLen / 2);
    const shortestSide = Math.min(dist(centerPoint, segment.start), dist(centerPoint, segment.end));
    const halfEdgeSegmentLen = rand(minEdgeSegmentLen / 2,
        Math.min(shortestSide - margin, maxEdgeSegmentLen / 2));

    // select angles
    const segmentAng = segment.angDeg;
    const normal = segmentAng + 90;
    const slantAng = rand(normal - maxSlantAng, normal + maxSlantAng);

    // create side segment
    const topHalf = fromAngAndLen(centerPoint, segmentAng * toRad, halfEdgeSegmentLen);
    const bottomHalf = fromAngAndLen(centerPoint, (segmentAng + 180) * toRad, halfEdgeSegmentLen);
    const edgeSegment = new Segment(bottomHalf.end, topHalf.end);
    const fullEdgeSegLen = edgeSegment.len;

    // construct segments list to check intersections
    const allSeg = segments.filter((s) => s !== segment)
        .concat(cutouts.map(((c) => [c.firstSeg, c.secondSeg])).flat());

    // maximum length of cutout
    // resolution of steps is twice higher than minimum cutout width
    const steps = Math.ceil((fullEdgeSegLen * 2) / minEdgeSegmentLen);
    const stepSize = fullEdgeSegLen / steps;
    let maxLen = Number.MAX_VALUE;

    // create projection for every step
    for (let i = 0; i <= steps; i++) {
        const startProj = getPointFromStart(edgeSegment, (i * stepSize) / fullEdgeSegLen);
        const proj = fromAngAndLen(startProj, slantAng * toRad, maxProjection);
        const minDist = shortestDist(allSeg, proj);
        if (minDist < maxLen) {
            maxLen = minDist;
        }
    }

    // if there are no normal intersections skip creating current cutout
    if (maxLen > maxProjection) return null;
    maxLen -= innerMargin;

    // truncate length based on maximum square and maximum stretch
    maxLen = Math.min(
        maxLen,
        maxCutoutSq / halfEdgeSegmentLen,
        maxCutoutStretch * fullEdgeSegLen,
    );
    const minLen = Math.max(minCutoutLength, minCutoutSq / halfEdgeSegmentLen);

    // edges are too close
    if (maxLen < minLen) return null;

    // generate length and segments
    let pointDistanceCheck = false;
    let cutoutLength: number = rand(minLen, maxLen);
    let cutoutMain: Segment = fromAngAndLen(centerPoint, slantAng * toRad, cutoutLength);
    let topSegment: Segment | null = null;
    let bottomSegment: Segment | null = null;

    while (!pointDistanceCheck) {
        if (cutoutLength < minLen) return null;

        // check new point for distance with segments
        const mainPoint = cutoutMain.end;
        const minDistPS = shortestDistBetweenPointAndSegments(allSeg, mainPoint);
        if (minDistPS < pointToSegmentMargin) {
            cutoutLength -= pointToSegmentMargin;
            cutoutMain = fromAngAndLen(centerPoint, slantAng * toRad, cutoutLength);
        } else {
            // check new segments for distance with points
            const allPoints = segments
                .filter((s) => s !== segment)
                .map((s) => [s.start, s.end])
                .flat()
                .concat(cutouts.map((c) => c.firstSeg.end));

            // create segments to check
            topSegment = new Segment(edgeSegment.end, cutoutMain.end);
            bottomSegment = new Segment(edgeSegment.start, cutoutMain.end);
            const minDistSP = Math.min(
                shortestDistBetweenPointsAndSegment(topSegment, allPoints),
                shortestDistBetweenPointsAndSegment(bottomSegment, allPoints),
            );

            if (minDistSP < pointToSegmentMargin) {
                cutoutLength -= pointToSegmentMargin;
                cutoutMain = fromAngAndLen(centerPoint, slantAng * toRad, cutoutLength);
            } else {
                pointDistanceCheck = true;
            }
        }
    }

    topSegment = topSegment || new Segment(edgeSegment.end, cutoutMain.end);
    bottomSegment = bottomSegment || new Segment(edgeSegment.start, cutoutMain.end);

    // cut segment and put new segment parts back
    const startSegment = new Segment(segment.start, edgeSegment.start);
    const endSegment = new Segment(edgeSegment.end, segment.end);
    segments.splice(segmentIndex, 1, startSegment, endSegment);

    // return
    const cutout = new Cutout(edgeSegment, topSegment, bottomSegment);
    cutouts.push(cutout);
    return cutout;
};
