<template>
    <div id="app">
        <canvas v-show="!finished" class="centered" id="canvas"/>
        <canvas v-show="finished" class="centered" ref="canvasFinal" id="canvasFinal"/>
        <div class="footer"/>
        <button v-if="!finished" class="next-btn" @click="next">»</button>
    </div>
</template>

<script lang="ts">
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-this-alias,@typescript-eslint/no-explicit-any,
@typescript-eslint/no-empty-function */
import Vue from 'vue';
import { createAssistant, createSmartappDebugger } from '@sberdevices/assistant-client';
import {
    init, generate, nextStep,
} from './snowflake';

export default Vue.extend({
    name: 'App',
    data() {
        return {
            finished: false,
            assistant: null,
        };
    },
    mounted() {
        const self: any = this as any;
        const topMargin = 40;
        const bottomMargin = 50;
        let bottomInset = 144;
        const sideMargin = 20;
        const finalSize = Math.min(
            document.documentElement.clientWidth - sideMargin * 2,
            document.documentElement.clientHeight - topMargin - bottomMargin,
        ) * 2;
        self.$refs.canvasFinal.width = finalSize;
        self.$refs.canvasFinal.height = finalSize;

        // assistant client
        try {
            window.alert = function (t) {
                console.log(`Alert: ${t}`);
            };
            const initialize = (getState: any) => {
                if (process.env.NODE_ENV === 'development') {
                    return createSmartappDebugger({
                        token: process.env.VUE_APP_SALUTE_TOKEN,
                        initPhrase: 'запусти вырежи снежинку',
                        getState,
                    });
                }

                // Только для среды production
                return createAssistant({ getState });
            };

            // @ts-ignore
            this.assistant = initialize(() => {
            });
            // @ts-ignore
            this.assistant.on('data', (command) => {
                if (command.type === 'insets') {
                    let b = command.insets && command.insets.bottom;
                    if (b) {
                        const root = document.documentElement;
                        if (b > 200) b = 144; // TODO await fix
                        root.style.setProperty('--bottom-inset', `${b}px`);
                        bottomInset = b;
                    }

                    this.run(topMargin, bottomMargin + bottomInset);
                }
            });
        } catch (err) {
            // ignore
            this.run(topMargin, bottomMargin + bottomInset);
        }
    },
    methods: {
        next() {
            if (!nextStep()) {
                this.finished = true;
            }
        },
        run(topMargin: number, bottomMargin: number) {
            // init main engine
            init(1.5, 5, topMargin, bottomMargin);
            generate();
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
    width: 100px;
    height: 100px;
    background-color: rgba(0, 0, 0, 0.76);
    color: white;
    font-size: 50px;
    /*font-weight: bold;*/
    right: 50px;
    bottom: calc(20px + var(--bottom-inset));
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    text-align: center;
    padding-left: 3px;
    padding-bottom: 8px;
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
    --bottom-inset: 144px;
}

.footer {
    width: 1px;
    min-height: var(--bottom-inset);
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
