/* eslint-disable no-param-reassign */
import Point from '@/models/Point';
import Segment from '@/models/Segment';

export const rand = (min: number, max: number): number => Math.random() * (max - min) + min;
export const randInt = (min: number, max: number): number => {
    const r = min + Math.random() * (max + 1 - min);
    return Math.floor(r);
};

export const getPointFromTop = (segment: Segment, fraction: number): Point => {
    const { xLen, yLen } = segment;
    const xTrim = fraction * xLen;
    const yTrim = fraction * yLen;
    return new Point(segment.start.x + xTrim, segment.start.y + yTrim);
};

export const drawSegment = (
    ctx: CanvasRenderingContext2D,
    segment: Segment,
    color: string,
    width: number,
): void => {
    ctx.strokeStyle = color || '#ff0000';
    ctx.lineWidth = width || 2;
    ctx.beginPath();
    ctx.moveTo(segment.start.x, segment.start.y);
    ctx.lineTo(segment.end.x, segment.end.y);
    ctx.stroke();
};
