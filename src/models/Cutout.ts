import Segment from '@/models/Segment';
import { calcSquare } from '@/engine/utils';

export default class Cutout {
    public sideSeg: Segment;

    public firstSeg: Segment;

    public secondSeg: Segment;

    constructor(sideSeg: Segment, firstSeg: Segment, secondSeg: Segment) {
        this.sideSeg = sideSeg;
        this.firstSeg = firstSeg;
        this.secondSeg = secondSeg;
    }

    public get square(): number {
        return calcSquare(this.sideSeg.start, this.sideSeg.end, this.firstSeg.end);
    }
}
