<template>
    <div id="app">
        <div class="buttons-block">
            <input type="range" min="0.5" max="9" step="0.1" v-model="cutoutsRatio"/>
            <span>{{cutoutsRatio}}</span>
            <button @click="() => generate()">Generate</button>
            <button @click="() => generateImage()">Get PDF</button>
        </div>
        <div class="canvas-block">
            <canvas key="cv" id="canvas"/>
            <canvas key="cf" id="cFinal"/>
        </div>
        <canvas key="ci" id="imageCanvas" width="2100" height="2970"/>
    </div>
</template>

<script lang="ts">
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-this-alias,@typescript-eslint/no-explicit-any,
@typescript-eslint/no-empty-function */
import Vue from 'vue';
import { jsPDF } from 'jspdf';
import {
    init, generate, nextStep, setup,
} from './snowflake';

export default Vue.extend({
    name: 'App',
    data() {
        return {
            topMargin: 40,
            bottomMargin: 50,
            sideMargin: 20,
            cutoutsRatio: 1.7,
            triangleData: null,
        };
    },
    mounted() {
        this.setSizes();
        this.$nextTick(() => {
            this.generate();
        });
    },
    methods: {
        setSizes() {
            const finalSize = Math.min(
                document.documentElement.clientWidth - this.sideMargin * 2,
                document.documentElement.clientHeight
                - this.topMargin - this.bottomMargin,
            ) * 2;
            const cFin = document.getElementById('cFinal') as HTMLCanvasElement;
            cFin.width = finalSize;
            cFin.height = finalSize;

            const canvas = document.getElementById('canvas') as HTMLCanvasElement;
            init(this.topMargin, this.bottomMargin);

            const root = document.documentElement;
            root.style.setProperty('--main-canvas-width', `${canvas.width}px`);
            root.style.setProperty('--main-canvas-height', `${canvas.height}px`);
            root.style.setProperty('--final-canvas-size', `${finalSize}px`);
        },
        generate() {
            // generate pattern
            setup(Number(this.cutoutsRatio));
            generate();

            let result = 0;
            while (result !== -2) {
                result = nextStep(1);
            }
        },
        generateImage() {
            const canvas = document.getElementById('canvas') as HTMLCanvasElement;
            const ci = document.getElementById('imageCanvas') as HTMLCanvasElement;
            const ctx = ci.getContext('2d') as CanvasRenderingContext2D;
            ctx.resetTransform();

            // fill with white
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, ci.width, ci.height);

            // prepare
            const scale = ci.width / (canvas.height * 2);
            ctx.scale(scale, scale);
            const startX = (ci.width / scale) / 2 - canvas.width / 2;
            const nextX = startX + canvas.width;

            // draw triangle
            ctx.lineWidth = 2;
            ctx.fillStyle = '#dedede';
            ctx.strokeStyle = '#eeeeee';
            ctx.beginPath();
            ctx.moveTo(startX, 0);
            ctx.lineTo(nextX, 0);
            ctx.lineTo(startX + canvas.width / 2, canvas.height);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // cut out
            ctx.drawImage(canvas, startX, 0);

            // draw line for help
            ctx.strokeStyle = '#000000';
            ctx.setLineDash([10, 10]);
            ctx.beginPath();
            ctx.moveTo(0, ci.width / scale);
            ctx.lineTo(ci.width / scale, ci.width / scale);
            ctx.stroke();

            // create pdf
            // eslint-disable-next-line new-cap
            const doc = new jsPDF();
            doc.addImage(ci.toDataURL('image/jpeg'), 0, 0, 210, 297);
            doc.save('snowflake.pdf');
        },
    },
});
</script>

<style>
body, html {
    margin: 0;
    padding: 0;
}

root {
    --main-canvas-width: 100px;
    --main-canvas-height: 100px;
    --final-canvas-size: 100px;
}

#app {
    text-align: center;
    margin: 0;
    padding: 0;
    width: 100vw;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background: linear-gradient(135deg, rgba(77,158,217,1) 0%, rgba(83,124,218,1) 100%);
    align-items: center;
    justify-content: center;
}

#canvas {
    transform: scale(0.5);
    filter: drop-shadow(8px 8px 10px rgba(0, 0, 0, 0.4));
    margin: calc(var(--main-canvas-height) * -0.25) calc(var(--main-canvas-width) * -0.25);
}

#cFinal {
    transform: scale(0.5);
    filter: drop-shadow(8px 8px 10px rgba(0, 0, 0, 0.4));
    margin: calc(var(--final-canvas-size) * -0.25);
}

#imageCanvas {
    position: fixed;
    display: none;
}

.canvas-block {
    max-width: 100vw;
    max-height: 100vh;
    overflow: hidden;
}

.buttons-block {
    padding: 5px;
    background: #ffffff52;
    border-radius: 0 5px 5px 0;
    display: flex;
    position: fixed;
    align-items: center;
    top: 5px;
    left: 0;
    z-index: 1;
}

.buttons-block button {
    background-color: #2b5b89;
    outline: none;
    border: none;
    color: white;
    padding: 5px 10px;
    border-radius: 3px;
}

.buttons-block button:last-child {
    margin-left: 5px;
}

.buttons-block span {
    font-family: sans-serif;
    color: #2b5b89;
    width: 35px;
    padding-left: 10px;
    text-align: left;
    font-weight: bold;
}

@media (max-aspect-ratio: 1089/800) {
    .canvas-block {
        margin: 60px 0;
        max-height: unset;
    }

    canvas:last-child {
        padding-top: 50px;
    }
}
</style>
