import { toRad } from '@/engine/utils';

// just dont ask...
const createCanvasFiltered = (ctx: CanvasRenderingContext2D, amount: number): HTMLCanvasElement => {
    // get source data
    const { height, width } = ctx.canvas;
    const imageData = ctx.getImageData(0, 0, width, height);
    const { data } = imageData;

    // assume source color is white
    for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.floor(data[i] * amount);
        data[i + 1] = Math.floor(data[i + 1] * amount);
        data[i + 2] = Math.floor(data[i + 2] * amount);
    }

    // create fake canvas
    const canvas = document.createElement('canvas');
    document.body.appendChild(canvas);
    canvas.style.display = 'none';
    canvas.width = width;
    canvas.height = height;

    // fill context
    const context = <CanvasRenderingContext2D>canvas.getContext('2d');
    context.putImageData(imageData, 0, 0);
    return canvas;
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

    // Okay, there is a workaround for fucking Safari, again. Safari cannot use ctx.filter
    // and also it updates context for only last operation, so we should create a new
    // canvas element for each desired brightness, draw, and then delete them all.
    // Yes, it is awful, but people for some reason still use iPhones and other Apple devices.
    const brightnesses: string[] = ['100', '97', '93', '100', '97', '100', '97', '90', '97', '93', '97', '93'];
    const canvases: { [key: string]: HTMLCanvasElement; } = {};
    brightnesses.forEach((b) => {
        if (!canvases[b]) {
            canvases[b] = createCanvasFiltered(ctxSrc, Number.parseInt(b, 10) / 100);
        }
    });

    // clockwise parts
    ctx.rotate(-45 * toRad);
    for (let i = 0; i < 6; i++) {
        // ctx.filter = `brightness(${(brightnesses[i * 2])}%)`; // doesnt work in Safari
        const filteredCanvas = canvases[brightnesses[i * 2]];
        ctx.rotate(60 * toRad);
        ctx.drawImage(filteredCanvas, -w / 2, -h);
    }

    // counter clockwise parts
    ctx.scale(-1, 1);
    ctx.rotate(-90 * toRad);
    for (let i = 0; i < 6; i++) {
        // ctx.filter = `brightness(${(brightnesses[11 - i * 2])}%)`; // doesnt work in Safari
        const filteredCanvas = canvases[brightnesses[11 - i * 2]];
        ctx.rotate(60 * toRad);
        ctx.drawImage(filteredCanvas, -w / 2, -h);
    }

    // remove all canvases
    Object.values(canvases).forEach((c) => document.body.removeChild(c));
}
