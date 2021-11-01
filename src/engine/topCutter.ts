import Segment from '@/models/Segment';
import {
    fromAngAndLen, getPointFromStart, intersect, prob, rand, randomPointBetween, toRad,
} from '@/engine/utils';
import Point from '@/models/Point';

let left: Segment;
let right: Segment;
let top: Segment;
const maxAng = 45;
const minAng = 15;
const fullCutProb = 0.1;
const fullCutMinFraction = 0.25;
const fullCutMaxFraction = 0.5;
const partCutMinLen = 0.3;
const partCutMaxLen = 0.8;

export const initTopCutter = (l: Segment, r: Segment): void => {
    left = l;
    right = r;
    top = new Segment(left.end, right.start);
};

export const generateTop = (): Segment[] => {
    if (prob(fullCutProb)) {
        // full cut
        const topLastPt = getPointFromStart(right, rand(fullCutMinFraction, fullCutMaxFraction));
        return [new Segment(left.end, topLastPt)];
    }

    // part cut
    const topFirstAng = left.revAngDeg - rand(minAng, maxAng);
    const topFirstLen = top.len * rand(partCutMinLen, partCutMaxLen);
    const topFirst = fromAngAndLen(left.end, topFirstAng * toRad, topFirstLen);
    const topToIntersect = fromAngAndLen(left.end, topFirstAng * toRad, left.len);
    const intPt = intersect(right, topToIntersect) as Point;

    const next = new Segment(topFirst.end, randomPointBetween(right.start, intPt));
    return [topFirst, next];
};
