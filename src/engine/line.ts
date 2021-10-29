import Segment from '@/models/Segment';

let left: Segment;
let right: Segment;
let top: Segment;

export const initLines = (l: Segment, r: Segment): void => {
    left = l;
    right = r;
    top = new Segment(left.end, right.start);
};

export const generateLines = (): void => {

};
