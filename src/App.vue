<template>
    <div id="app">
        <canvas ref="canvas" id="canvas"/>
    </div>
</template>

<script lang="ts">
/* eslint-disable @typescript-eslint/no-this-alias */
import Vue from 'vue';
import { init, generate } from './draw';

export default Vue.extend({
    name: 'App',
    mounted() {
        const self: any = this;
        self.$refs.canvas.width = document.documentElement.clientWidth;
        self.$refs.canvas.height = document.documentElement.clientHeight;

        init();
        generate();
    },
});
</script>

<style>
body {
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
    position: fixed;
    background-color: #4d9ed9;
}
</style>
