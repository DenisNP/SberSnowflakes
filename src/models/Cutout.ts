import Segment from '@/models/Segment';
import Point from '@/models/Point';
import CutoutStep from '@/models/CutoutStep';

export default class Cutout {
    public sideSeg: Segment;

    public firstSeg: Segment;

    public secondSeg: Segment;

    constructor(sideSeg: Segment, firstSeg: Segment, secondSeg: Segment) {
        this.sideSeg = sideSeg;
        this.firstSeg = firstSeg;
        this.secondSeg = secondSeg;
    }

    public get points(): Point[] {
        return [this.sideSeg.start, this.firstSeg.end, this.sideSeg.end, this.sideSeg.start];
    }

    public toCutoutStep(): CutoutStep {
        return new CutoutStep(this.points);
    }
}
