<template>
    <div id="app">
        <canvas v-show="!finished" class="centered" id="canvas"/>
        <canvas v-show="finished" class="centered" ref="canvasFinal" id="canvasFinal"/>
        <button class="next-btn" @click="next">»</button>
    </div>
</template>

<script lang="ts">
/* eslint-disable @typescript-eslint/no-this-alias,@typescript-eslint/no-explicit-any */
import Vue from 'vue';
import { init, generate, nextStep } from './snowflake';

export default Vue.extend({
    name: 'App',
    data() {
        return {
            finished: false,
        };
    },
    mounted() {
        const self: any = this as any;
        const topMargin = 40;
        const bottomMargin = 50;
        const sideMargin = 20;
        const finalSize = Math.min(
            document.documentElement.clientWidth - sideMargin * 2,
            document.documentElement.clientHeight - topMargin - bottomMargin,
        ) * 2;
        self.$refs.canvasFinal.width = finalSize;
        self.$refs.canvasFinal.height = finalSize;

        init(0.7, 3, topMargin, bottomMargin);
        generate();
    },
    methods: {
        next() {
            if (!nextStep()) {
                this.finished = true;
            }
        },
    },
});
</script>

<style>
body, html {
    margin: 0;
    padding: 0;
}

#app {
    font-family: Avenir, Helvetica, Arial, sans-serif;
    text-align: center;
    margin: 0;
    padding: 0;
    width: 100vw;
    height: 100vh;
    display: flex;
    flex-direction: column;
    position: fixed;
    background-color: #4d9ed9;
    align-items: center;
    justify-content: center;
}

#canvas {
    transform: scale(0.5);
    filter: drop-shadow(8px 8px 10px rgba(0, 0, 0, 0.4));
}

#canvasFinal {
    transform: scale(0.5);
    filter: drop-shadow(8px 8px 10px rgba(0, 0, 0, 0.4));
}

.next-btn {
    position: fixed;
    width: 50px;
    height: 50px;
    background-color: rgba(0, 0, 0, 0.76);
    color: white;
    font-size: 30px;
    /*font-weight: bold;*/
    right: 10px;
    bottom: 10px;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    text-align: center;
    padding-left: 2px;
    padding-bottom: 6px;
}

* {
    box-sizing: border-box;
    user-select: none;
    -webkit-tap-highlight-color: rgba(255, 255, 255, 0);
    -webkit-tap-highlight-color: transparent;
    -webkit-touch-callout: none;
    -webkit-user-select: none;
}

:root {
    --bottom-inset: 150px;
}

button {
    padding: 0;
    border: none;
    outline: none;
}

button:focus {
    outline: none;
    /*box-shadow: 0 0 10px 3px #02b119c7*/
}
</style>
