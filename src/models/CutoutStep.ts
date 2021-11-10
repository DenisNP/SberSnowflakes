/* eslint-disable @typescript-eslint/ban-ts-comment */
import Point from '@/models/Point';
import { getContext } from '@/engine/utils';

export default class CutoutStep {
    public points: Point[];

    // @ts-ignore
    private storedRect: ImageData;

    // @ts-ignore
    private storedRectX: number;

    // @ts-ignore
    private storedRectY: number;

    constructor(_points: Point[]) {
        this.points = _points;
    }

    public storeCanvasRect(): void {
        const ctx = getContext();
        const allX = this.points.map((p) => p.x);
        const allY = this.points.map((p) => p.y);
        const minX = Math.min(...allX);
        const minY = Math.min(...allY);
        const margin = 20;
        const w = Math.max(...allX) - minX;
        const h = Math.max(...allY) - minY;
        this.storedRectX = minX - margin;
        this.storedRectY = minY - margin;

        this.storedRect = ctx.getImageData(
            this.storedRectX,
            this.storedRectY,
            w + margin * 2,
            h + margin * 2,
        );
    }

    public restoreCanvasRect(): void {
        const ctx = getContext();
        ctx.putImageData(this.storedRect, this.storedRectX, this.storedRectY);
    }

    public draw(): void {
        const ctx = getContext();
        ctx.lineWidth = 4;
        ctx.setLineDash([15, 15]);
        ctx.strokeStyle = '#ff0000';
        ctx.beginPath();
        ctx.moveTo(this.points[0].x, this.points[0].y);
        for (let i = 1; i < this.points.length - 1; i++) {
            ctx.lineTo(this.points[i].x, this.points[i].y);
        }
        ctx.stroke();
    }

    public cut(): void {
        const ctx = getContext();
        ctx.globalCompositeOperation = 'destination-out';
        ctx.setLineDash([]);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(this.points[0].x, this.points[0].y);
        for (let i = 1; i < this.points.length; i++) {
            ctx.lineTo(this.points[i].x, this.points[i].y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.globalCompositeOperation = 'source-over';
    }
}
