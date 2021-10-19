<template>
    <div id="app">
        <canvas ref="canvas" id="canvas"/>
    </div>
</template>

<script>
import { init, generate } from './draw';

export default {
    name: 'App',
    mounted() {
        this.$refs.canvas.width = document.documentElement.clientWidth;
        this.$refs.canvas.height = document.documentElement.clientHeight;

        init();
        generate();
    },
};
</script>

<style>
html, body {
    margin: 0;
    padding: 0;
}

#app {
    font-family: Avenir, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;
    margin: 0;
    padding: 0;
    width: 100vw;
    height: 100vh;
    position: fixed;
    background-color: #4d9ed9;
}
</style>
