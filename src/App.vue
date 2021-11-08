<template>
    <div id="app">
        <div class="menu" v-if="!foldingStarted">
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
            <div v-if="currentFoldingStep === 1">Ступень 1</div>
            <div v-if="currentFoldingStep === 2">Ступень 2</div>
            <div v-if="currentFoldingStep === 3">Ступень 3</div>
        </div>
        <canvas key="cv" v-show="!finished && cutStarted" class="centered" id="canvas"/>
        <canvas key="cf" v-show="finished" class="centered" id="cFinal"/>
        <button v-if="finished" class="restart-btn" @click="restart">Ещё снежинка</button>
        <div class="footer"/>
        <button v-if="!finished && foldingStarted && !cutStarted" class="skip-btn" @click="skip">
            Пропустить складывание
        </button>
        <button v-if="!finished && foldingStarted" class="next-btn" @click="next">&gt;</button>
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

export default Vue.extend({
    name: 'App',
    data() {
        return {
            foldingStarted: false,
            totalFoldingSteps: 3,
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
    mounted() {
        // assistant client
        try {
            window.alert = (t) => {
                console.log(`Alert: ${t}`);
            };
            const token = process.env.VUE_APP_SALUTE_TOKEN;
            if (token) {
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
                    if (process.env.NODE_ENV === 'development') console.log(command);

                    if (command.type === 'insets') {
                        let b = command.insets && command.insets.bottom;
                        if (b) {
                            const root = document.documentElement;
                            if (b > 200) b = 144; // TODO await fix
                            root.style.setProperty('--bottom-inset', `${b}px`);
                            this.bottomInset = b;
                        }

                        this.setSizes();
                    } else if (command.type === 'smart_app_data') {
                        if (command.action === 'close') {
                            (this.assistant as any).close();
                        } else if (command.action === 'start') {
                            if (command.data === 'easy') this.start(true, true);
                            else this.start(false, true);
                        } else if (command.action === 'next') {
                            this.next(true);
                        } else if (command.action === 'restart') {
                            this.restart(true);
                        } else if (command.action === 'skip') {
                            this.skip(true);
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
            } else {
                this.setSizes();
            }
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
        },
        start(easyMode: boolean, silent = false) {
            this.easyMode = easyMode;
            this.finished = false;
            this.cutStarted = false;
            this.foldingStarted = true;
            this.currentFoldingStep = 1;

            // generate pattern
            const cutoutsRatio = this.easyMode ? 0.7 : 1.5;
            const minCutouts = this.easyMode ? 3 : 6;
            this.$nextTick(() => {
                setup(cutoutsRatio, minCutouts);
                generate();
            });
            if (!silent) this.say('start', 0);
        },
        next(silent = false) {
            if (!this.foldingStarted || this.finished) return;
            if (!this.cutStarted && this.currentFoldingStep < this.totalFoldingSteps) {
                // folding next step
                if (!silent) this.say('folding', this.currentFoldingStep);
                this.currentFoldingStep += 1;
            } else if (!this.finished) {
                if (this.currentFoldingStep === this.totalFoldingSteps) this.cutStarted = true;
                // cut next step
                this.$nextTick(() => {
                    const cutoutsCount = nextStep();
                    if (cutoutsCount === -1 && !silent) {
                        // ready to unfold
                        this.say('unfold', 0);
                    } else if (cutoutsCount === -2) {
                        // show final result
                        this.finished = true;
                        if (!silent) this.say('finish', 0);
                    } else if (!silent) {
                        // just cut
                        this.say('cut', cutoutsCount);
                    }
                });
            }
        },
        skip(silent = false) {
            this.currentFoldingStep = this.totalFoldingSteps;
            this.next(silent);
        },
        restart(silent = false) {
            this.finished = false;
            this.cutStarted = false;
            this.foldingStarted = false;
            this.firstStart = false;
            if (!silent) this.say('enter', 1);
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
    url('./fonts/pangolin-v6-latin_cyrillic-regular.woff2') format('woff2'),
    url('./fonts/pangolin-v6-latin_cyrillic-regular.woff') format('woff');
}

body, html {
    margin: 0;
    padding: 0;
}

#app {
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

#cFinal {
    transform: scale(0.5);
    filter: drop-shadow(8px 8px 10px rgba(0, 0, 0, 0.4));
}

.skip-btn {
    position: fixed;
    height: 70px;
    max-width: calc(100vw - 115px);
    font-size: 18px;
    right: 100px;
    bottom: calc(15px + var(--bottom-inset) * 1px);
    border-radius: 35px;
    text-align: center;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    word-wrap: break-word;
    padding: 0 20px 4px 20px;
}

.next-btn {
    position: fixed;
    width: 70px;
    height: 70px;
    font-size: 40px;
    right: 15px;
    bottom: calc(15px + var(--bottom-inset) * 1px);
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    text-align: center;
    padding-left: 3px;
    padding-bottom: 7px;
}

.restart-btn {
    display: flex;
    justify-content: center;
    align-items: center;
    text-align: center;
    padding: 10px 20px;
    border-radius: 20px;
    font-size: 20px;
    font-weight: bold;
    position: fixed;
    bottom: calc(15px + var(--bottom-inset) * 1px);
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
    --bottom-inset: 0;
}

.footer {
    width: 1px;
    min-height: var(--bottom-inset);
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
}

button:focus {
    outline: none;
    box-shadow: 0 0 10px #2ec018 !important;
    opacity: 1.0!important;
}

.folding-container {
    height: calc(100vh - var(--bottom-inset) * 1px - 100px);
    margin-bottom: 100px;
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
</style>
