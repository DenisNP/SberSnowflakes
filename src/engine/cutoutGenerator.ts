import Segment from '@/models/Segment';
import Cutout from '@/models/Cutout';
import {
    dist,
    fromAngAndLen, getPointFromStart,
    intersect,
    rand,
    randomPointWithEdge,
    toRad,
} from '@/engine/utils';

let margin: number;
let innerMargin: number;
let minEdgeSegmentLen: number;
let maxEdgeSegmentLen: number;
let minCutoutLength: number;
let minCutoutSq: number;
let maxCutoutSq: number;
const maxCutoutStretch = 5;
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

export const initCutoutGen = (w: number, longest: number) => {
    margin = w * 0.05;
    innerMargin = margin * 2;
    minEdgeSegmentLen = w * 0.08;
    maxEdgeSegmentLen = w * 0.4;
    minCutoutSq = w * w * 0.05;
    maxCutoutSq = w * w * 0.1;
    maxProjection = longest * 2;
    minCutoutLength = minEdgeSegmentLen / 2;
};

export const generateCutout = (segments: Segment[], cutouts: Cutout[]): Cutout | null => {
    // select segment and remove
    const segmentIndex = selectSegment(segments);
    if (segmentIndex === -1) return null;
    const segment = segments[segmentIndex];

    // choose center point and sides
    const centerPoint = randomPointWithEdge(segment, margin + minEdgeSegmentLen / 2);
    const shortestSide = Math.min(dist(centerPoint, segment.start), dist(centerPoint, segment.end));
    const halfSideLen = rand(minEdgeSegmentLen / 2,
        Math.min(shortestSide - margin, maxEdgeSegmentLen / 2));

    // select angles
    const segmentAng = segment.angDeg;
    const normal = segmentAng + 90;
    const slantAng = rand(normal - maxSlantAng, normal + maxSlantAng);

    // create side segment
    const topHalf = fromAngAndLen(centerPoint, segmentAng * toRad, halfSideLen);
    const bottomHalf = fromAngAndLen(centerPoint, (segmentAng + 180) * toRad, halfSideLen);
    const sideSegment = new Segment(bottomHalf.end, topHalf.end);
    const fullLen = sideSegment.len;

    // construct segments list to check intersections
    const allSeg = segments.filter((s) => s !== segment)
        .concat(cutouts.map(((c) => [c.firstSeg, c.secondSeg])).flat());

    // maximum length of cutout
    // resolution of steps is twice higher than minimum cutout width
    const steps = Math.ceil((fullLen * 2) / minEdgeSegmentLen);
    const stepSize = fullLen / steps;
    let maxLen = Number.MAX_VALUE;

    // create projection for every step
    for (let i = 0; i < steps; i++) {
        const startProj = getPointFromStart(sideSegment, (i * stepSize) / fullLen);
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
    maxLen = Math.min(maxLen, maxCutoutSq / halfSideLen, maxCutoutStretch * halfSideLen * 2);
    const minLen = Math.max(minCutoutLength, minCutoutSq / halfSideLen);

    // edges are too close
    if (maxLen < minLen) return null;

    // generate length and segments
    const cutoutLength = fromAngAndLen(centerPoint, slantAng * toRad, rand(minLen, maxLen));
    const topSegment = new Segment(sideSegment.end, cutoutLength.end);
    const bottomSegment = new Segment(sideSegment.start, cutoutLength.end);

    // cut segment and put new segment parts if they are long enough
    segments.splice(segmentIndex, 1);
    const startSegment = new Segment(segment.start, sideSegment.start);
    const endSegment = new Segment(sideSegment.end, segment.end);
    segments.splice(segmentIndex, 0, startSegment, endSegment);

    // return
    const cutout = new Cutout(sideSegment, topSegment, bottomSegment);
    cutouts.push(cutout);
    return cutout;
};
