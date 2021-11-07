import { toRad } from '@/engine/utils';

export default function generateFullSnowflake(): void {
    const canvasSrc = <HTMLCanvasElement>document.getElementById('canvas');
    const canvasFinal = <HTMLCanvasElement>document.getElementById('cFinal');
    const ctx = <CanvasRenderingContext2D>canvasFinal.getContext('2d');
    ctx.resetTransform();
    ctx.clearRect(0, 0, canvasFinal.width, canvasFinal.height);
    const w = canvasSrc.width;
    const h = canvasSrc.height;
    const longestSide = Math.sqrt((w / 2) ** 2 + h ** 2);
    const scale = canvasFinal.width / (longestSide * 2);

    ctx.scale(scale, scale);
    ctx.translate(canvasFinal.width / (2 * scale), canvasFinal.height / (2 * scale));

    const brightnesses: number[] = [100, 97, 93, 100, 97, 100, 97, 90, 97, 93, 97, 93];

    // clockwise parts
    ctx.rotate(-45 * toRad);
    for (let i = 0; i < 6; i++) {
        ctx.filter = `brightness(${(brightnesses[i * 2])}%)`;
        ctx.rotate(60 * toRad);
        ctx.drawImage(canvasSrc, -w / 2, -h);
    }

    // counter clockwise parts
    ctx.scale(-1, 1);
    ctx.rotate(-90 * toRad);
    for (let i = 0; i < 6; i++) {
        ctx.filter = `brightness(${(brightnesses[11 - i * 2])}%)`;
        ctx.rotate(60 * toRad);
        ctx.drawImage(canvasSrc, -w / 2, -h);
    }
}
