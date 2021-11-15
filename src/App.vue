<template>
    <div id="app">
        <audio loop preload="auto" ref="music">
            <source src="./assets/music.mp3" type="audio/mp3"/>
        </audio>
        <div class="menu" v-if="!foldingStarted" v-show="loaded">
            <button class="menu-button" @click="() => start(true)">
                <span>Простой узор</span>
                <span>Подходит для детей</span>
            </button>
            <button class="menu-button" @click="() => start(false)">
                <span>Сложный узор</span>
                <span>Больше мелких деталей</span>
            </button>
        </div>
        <div class="folding-container" v-show="foldingStarted && !cutStarted">
            <div v-show="currentFoldingStep === 1">
                <img src="./assets/fold-01.png" alt="folding step 1"/>
            </div>
            <div v-show="currentFoldingStep === 2">
                <img src="./assets/fold-02.png" alt="folding step 2"/>
            </div>
            <div v-show="currentFoldingStep === 3">
                <img src="./assets/fold-03.png" alt="folding step 3"/>
            </div>
            <div v-show="currentFoldingStep === 4">
                <img src="./assets/fold-04.png" alt="folding step 4"/>
            </div>
        </div>
        <canvas key="cv" v-show="!finished && cutStarted" class="centered" id="canvas"/>
        <canvas key="cf" v-show="finished" class="centered" id="cFinal"/>
        <button v-if="finished" class="restart-btn bottom-button" @click="restart">
            Ещё снежинка
        </button>
        <div class="footer"/>
        <div class="buttons bottom-button">
            <button
                v-if="showSkip"
                class="skip-btn"
                @click="skip"
            >
                Пропустить складывание
            </button>
            <button v-if="!finished && foldingStarted" class="next-btn" @click="next">&gt;</button>
        </div>
        <snowflakes v-if="!foldingStarted"/>
    </div>
</template>

<script lang="ts">
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-this-alias,@typescript-eslint/no-explicit-any,
@typescript-eslint/no-empty-function */
import Vue from 'vue';
import { createAssistant, createSmartappDebugger } from '@sberdevices/assistant-client';
import {
    init, generate, nextStep, setup,
} from './snowflake';
import Snowflakes from '@/components/Snowflakes.vue';

export default Vue.extend({
    name: 'App',
    components: { Snowflakes },
    data() {
        return {
            loaded: false,
            foldingStarted: false,
            totalFoldingSteps: 4,
            currentFoldingStep: 1,
            cutStarted: false,
            finished: false,
            easyMode: false,
            topMargin: 40,
            bottomMargin: 50,
            bottomInset: 0,
            sideMargin: 20,
            informal: false,
            firstStart: true,
            assistant: null,
        };
    },
    computed: {
        showSkip() {
            const self: any = this as any;
            return !self.finished
                && self.foldingStarted
                && !self.cutStarted
                && !self.firstStart
                && self.currentFoldingStep < self.totalFoldingSteps;
        },
    },
    mounted() {
        // assistant client
        try {
            window.alert = (t) => {
                // eslint-disable-next-line
                console.log(`Alert: ${t}`);
            };
            const token = process.env.VUE_APP_SALUTE_TOKEN;
            const initialize = (getState: any) => {
                if (process.env.NODE_ENV === 'development') {
                    return createSmartappDebugger({
                        token,
                        initPhrase: 'запусти вырежи снежинку',
                        getState,
                    });
                }

                // Только для среды production
                return createAssistant({ getState });
            };

            // @ts-ignore
            this.assistant = initialize(() => {});
            // @ts-ignore
            this.assistant.on('data', (command) => {
                // eslint-disable-next-line
                if (process.env.NODE_ENV === 'development') console.log(command);

                if (command.type === 'insets') {
                    let b = Number(command.insets && command.insets.bottom);
                    if (b && !Number.isNaN(b)) {
                        if (b > 150) b /= window.devicePixelRatio; // TODO await fix
                        document.documentElement.style.setProperty('--bottom-inset', `${b}px`);
                        this.bottomInset = b;
                    }

                    this.setSizes();
                } else if (command.type === 'smart_app_data') {
                    if (command.action === 'close') {
                        (this.assistant as any).close();
                    } else if (command.action === 'start') {
                        if (command.data === 'easy') this.start(true);
                        else this.start(false);
                    } else if (command.action === 'next') {
                        this.next();
                    } else if (command.action === 'restart') {
                        this.restart();
                    } else if (command.action === 'skip') {
                        this.skip();
                    }
                } else if (command.type === 'character') {
                    if (command.character && command.character.id) {
                        this.informal = command.character.id.toLowerCase() === 'joy';
                    }
                } else if (command.type === 'navigation' && command.navigation && command.navigation.command) {
                    if (command.navigation.command.toLowerCase() === 'forward') {
                        this.next();
                    }
                }
            });
        } catch (err) {
            // ignore
            this.setSizes();
        }
    },
    methods: {
        setSizes() {
            const finalSize = Math.min(
                document.documentElement.clientWidth - this.sideMargin * 2,
                document.documentElement.clientHeight
                - this.topMargin - this.bottomMargin - this.bottomInset,
            ) * 2;
            const cFin = document.getElementById('cFinal') as HTMLCanvasElement;
            cFin.width = finalSize;
            cFin.height = finalSize;

            init(this.topMargin, this.bottomMargin + this.bottomInset);
            this.loaded = true;
        },
        start(easyMode: boolean) {
            const audio = this.$refs.music as HTMLAudioElement;
            audio.volume = 0.75;
            audio.play();
            this.easyMode = easyMode;
            this.finished = false;
            this.cutStarted = false;
            this.foldingStarted = true;
            this.currentFoldingStep = 1;

            // generate pattern
            const cutoutsRatio = this.easyMode ? 1 : 2;
            const minCutouts = this.easyMode ? 4 : 6;
            const maxCutouts = this.easyMode ? 5 : 12;
            this.$nextTick(() => {
                setup(cutoutsRatio, minCutouts, maxCutouts);
                generate();
            });
            this.say('folding', this.firstStart ? 0 : 1);
        },
        next() {
            if (!this.foldingStarted || this.finished) return;
            if (!this.cutStarted && this.currentFoldingStep < this.totalFoldingSteps) {
                // folding next step
                this.currentFoldingStep += 1;
                this.say('folding', this.currentFoldingStep);
            } else if (!this.finished) {
                if (this.currentFoldingStep === this.totalFoldingSteps) this.cutStarted = true;
                // cut next step
                this.$nextTick(() => {
                    const cutoutsCount = nextStep(this.easyMode ? 1 : 2);
                    if (cutoutsCount === -1) {
                        // ready to unfold
                        this.say('unfold', 0);
                    } else if (cutoutsCount === -2) {
                        // show final result
                        this.finished = true;
                        this.say('finish', 0);
                    } else {
                        // just cut
                        this.say('cut', cutoutsCount);
                    }
                });
            }
        },
        skip() {
            this.currentFoldingStep = this.totalFoldingSteps;
            this.next();
        },
        restart() {
            this.finished = false;
            this.cutStarted = false;
            this.foldingStarted = false;
            this.firstStart = false;
            this.say('enter', 1);
        },
        say(action: string, param: number) {
            if (!this.assistant) return;
            (this.assistant as any).sendData(
                { action: { action_id: action, payload: { param } } },
                null,
            );
        },
    },
});
</script>

<style>
/* pangolin-regular - latin_cyrillic */
@font-face {
    font-family: 'Pangolin';
    font-style: normal;
    font-weight: 400;
    src: url('./fonts/pangolin-v6-latin_cyrillic-regular.woff2') format('woff2');
}

body, html {
    margin: 0;
    padding: 0;
    width: 100vw;
    min-height: 100vh;
    background: linear-gradient(135deg, rgba(77,158,217,1) 0%, rgba(83,124,218,1) 100%);
    touch-action: manipulation;
    overflow: hidden;
}

#app {
    text-align: center;
    margin: 0;
    padding: 0;
    width: 100vw;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    flex-direction: column;
    position: fixed;
    align-items: center;
    justify-content: center;
    background: transparent;
}

#canvas {
    transform: scale(0.5);
    filter: drop-shadow(8px 8px 10px rgba(0, 0, 0, 0.4));
}

#cFinal {
    transform: scale(0.5);
    filter: drop-shadow(8px 8px 10px rgba(0, 0, 0, 0.4));
}

.buttons {
    position: fixed;
    right: 15px;
    display: flex;
}

.skip-btn {
    height: 70px;
    max-width: calc(100vw - 115px);
    font-size: 18px;
    border-radius: 999px;
    text-align: center;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    word-wrap: break-word;
    padding: 0 20px 0 20px;
    margin-right: 15px;
}

.next-btn {
    width: 70px;
    height: 70px;
    font-size: 40px;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    text-align: center;
    padding-left: 3px;
    padding-bottom: 3px;
}

.restart-btn {
    display: flex;
    justify-content: center;
    align-items: center;
    text-align: center;
    padding: 0 20px 0 20px;
    height: 70px;
    border-radius: 999px;
    font-size: 18px;
    position: fixed;
}

.bottom-button {
    bottom: calc(15px + var(--bottom-inset));
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
    --bottom-inset: 0px;
}

.footer {
    width: 1px;
    min-height: var(--bottom-inset);
    background: transparent;
}

button {
    padding: 0;
    border: none;
    outline: none;
    background-color: white;
    color: #2e78a2;
    font-family: 'Pangolin', cursive;
    box-shadow: 0 0 10px #024c82;
    opacity: 0.8;
    touch-action: manipulation;
}

button:focus {
    outline: none;
    box-shadow: 0 0 10px #2ec018 !important;
    opacity: 1.0!important;
}

.folding-container {
    height: calc(100vh - var(--bottom-inset) - 100px);
    margin-bottom: 100px;
    display: flex;
    justify-content: center;
    align-items: center;
}

.folding-container > div {
    display: flex;
    height: 100%;
    align-items: flex-start;
}

.folding-container img {
    max-height: 100%;
    max-width: 100%;
    width: auto;
    object-fit: contain;
}

.menu {
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
}

.menu-button {
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 18px 24px;
    border-radius: 999px;
    width: calc(100vw - 30px);
    max-width: 350px;
}

.menu-button:first-child {
    margin-bottom: 20px;
}

.menu-button span:first-child {
    font-size: 22px;
    margin-bottom: 8px;
    font-weight: bold;
}

.menu-button span:last-child {
    font-size: 16px;
    color: #4a92c6;
    margin-bottom: 6px;
}

@media (min-aspect-ratio: 1/1) {
    .restart-btn {
        right: 15px;
    }
}

@media (min-width: 767px) {
    .menu {
        transform: scale(1.5);
    }

    .restart-btn, .buttons {
        transform: scale(1.5);
        transform-origin: bottom right;
        right: 30px;
    }

    .bottom-button {
        bottom: calc(30px + var(--bottom-inset));
    }
}

@media (min-width: 1281px) {
    .menu {
        transform: scale(2.0);
    }

    .restart-btn, .buttons {
        transform: scale(2.0);
        transform-origin: bottom right;
    }
}
</style>
