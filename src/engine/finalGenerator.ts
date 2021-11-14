import { toRad } from '@/engine/utils';

// fucking Safari again, there is polyfill for ctx.filter
const applyBrightness = (ctx: CanvasRenderingContext2D, amount: number): void => {
    if (amount === 1) return;
    const { height, width } = ctx.canvas;
    const imageData = ctx.getImageData(0, 0, width, height);
    const { data } = imageData;
    const { length } = data;

    // assume source color is white
    for (let i = 0; i < length; i += 4) {
        data[i] = 255 * amount;
        data[i + 1] = 255 * amount;
        data[i + 2] = 255 * amount;
    }

    // set back image data to context
    ctx.putImageData(imageData, 0, 0);
};

export default function generateFullSnowflake(): void {
    const canvasSrc = <HTMLCanvasElement>document.getElementById('canvas');
    const canvasFinal = <HTMLCanvasElement>document.getElementById('cFinal');
    const ctxSrc = <CanvasRenderingContext2D>canvasSrc.getContext('2d');
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
        // ctx.filter = `brightness(${(brightnesses[i * 2])}%)`; // doesnt work in Safari
        applyBrightness(ctxSrc, brightnesses[i * 2] / 100);
        ctx.rotate(60 * toRad);
        ctx.drawImage(canvasSrc, -w / 2, -h);
    }

    // counter clockwise parts
    ctx.scale(-1, 1);
    ctx.rotate(-90 * toRad);
    for (let i = 0; i < 6; i++) {
        // ctx.filter = `brightness(${(brightnesses[11 - i * 2])}%)`; // doesnt work in Safari
        applyBrightness(ctxSrc, brightnesses[11 - i * 2] / 100);
        ctx.rotate(60 * toRad);
        ctx.drawImage(canvasSrc, -w / 2, -h);
    }

    // revert to white
    applyBrightness(ctxSrc, 1);
}
