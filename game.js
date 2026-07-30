/** @typedef {"green" | "red" | "yellow" | "blue"} ButtonColor */
/** @type {ButtonColor[]} */
const buttonColors = ["green", "red", "yellow", "blue"]

class GameController {
    /** @typedef { "idle" | "playing" | "gameOver" } GamePhase */

    /** @typedef {function() : void } OnStartCallback */
    /** @typedef {function(number, readonly ButtonColor[]): void } OnProceedCallback */
    /** @typedef {function() : void } OnGameOverCallback */

    /**
     * 
     * @param {{onStart: OnStartCallback, onProceed: OnProceedCallback, onGameOver: OnGameOverCallback}} callback
     */
    constructor(callback) {

        /** @type {ButtonColor[]} */
        this.gamePattern = [];
        /** @type {ButtonColor[]} */
        this.clickedColorHistory = []

        /** @type {GamePhase} */
        this.gamePhase = 'idle';

        // Callbacks

        /** @type {OnStartCallback}  */
        this.onStart = callback.onStart;
        /** @type {OnProceedCallback}  */
        this.onProceed = callback.onProceed;
        /** @type {OnGameOverCallback} */
        this.onGameOver = callback.onGameOver;

        this.start = this.start.bind(this);
    }

    start() {

        if (this.#isInGame()) return;

        this.gamePhase = 'playing';
        this.#increaseLevel();
        this.onStart();
    }

    /** 
     * 
     * @param {ButtonColor} color
     * @returns {Boolean}
     */
    selectMove(color) {
        this.clickedColorHistory.push(color);

        if (!this.#checkLastMove()) {
            this.#gameOver();
            return false;
        }

        // Proceed next sequence if current level cleared
        if (this.clickedColorHistory.length == this.gamePattern.length) {
            this.#increaseLevel();
        }

        return true;
    }


    #increaseLevel() {
        this.clickedColorHistory = [];

        const randomIdx = Math.floor(Math.random() * buttonColors.length);
        const nextColor = buttonColors[randomIdx];
        this.gamePattern.push(nextColor);

        const frozen = Object.freeze([...this.gamePattern]);
        this.onProceed(this.gamePattern.length, frozen);
    }

    #gameOver() {
        this.gamePhase = 'gameOver'

        this.clickedColorHistory = [];
        this.gamePattern = [];

        this.onGameOver();
    }

    /** Utilities **/

    #isInGame() {
        return this.gamePhase == "playing";
    }

    #checkLastMove() {
        const lastIndex = this.clickedColorHistory.length - 1;
        if (lastIndex < 0 || lastIndex >= this.gamePattern.length) {
            return false;
        }

        const userLastMove = this.clickedColorHistory[lastIndex];
        return userLastMove === this.gamePattern[lastIndex];
    }

}

class AnimationTracker {
    /**
     * @type {Set<Promise<any>>}
     */
    #running = new Set();

    /**
     * @template T
     * @param {Promise<T>} promise
     * @returns {Promise<T>}
     */
    track(promise) {
        this.#running.add(promise);
        promise.finally(() => this.#running.delete(promise));
        return promise;
    }

    get isAnimating() {
        return this.#running.size > 0;
    }
}

const game = new GameController(
    {
        onStart: () => {
            document.removeEventListener('click', game.start);
        },
        onProceed: (level, patterns) => {
            updateTitle(`Level ${level}`)

            animations.track((async () => {
                if (level > 1) await sleep(1000);
                await playColorInSequence(patterns);
            })());

        },
        onGameOver: () => {
            playAudio('wrong');
            updateTitle('Game Over, Click Anywhere to Restart');
            playGameOverEffect();

            setTimeout(() => {
                document.addEventListener('click', game.start);
            }, 100);
        }
    }
);

const animations = new AnimationTracker();

function setup() {

    // Button Setup
    const allButtons = document.querySelectorAll('div.btn');
    for (var i = 0; i < allButtons.length; i++) {
        const button = allButtons[i];
        button.addEventListener('click', () => {
            if (!isInteractable()) return;

            if (!isButtonColor(button.id)) {
                console.warn(`Invalid button id ${button.id}`);
                return;
            }

            playPressEffect(/** @type {HTMLElement} */(button));
            selectColor(button.id);
        });
    }

    // Keybord Setup
    document.addEventListener('click', game.start);
}

/**
 * @param {string} id
 * @returns {id is ButtonColor}
 */
function isButtonColor(id) {
    return buttonColors.includes(/** @type {ButtonColor} */(id));
}

/**
 * 
 * @param {ButtonColor} color 
 */
function selectColor(color) {
    const correct = game.selectMove(color);

    if (correct) {
        playAudio(color);
    }
}

/**
 * 
 * @param {readonly ButtonColor[]} colors
 * @returns {Promise<void>}
 */
async function playColorInSequence(colors) {

    for (var i = 0; i < colors.length; i++) {

        const nextColor = colors[i];

        playAudio(nextColor);

        const targetButton = document.querySelector(`.btn#${nextColor}`);
        if (targetButton)
            playFlashEffect(/** @type {HTMLElement} */(targetButton));

        await sleep(600);
    }
}


/** Utility **/

/**
 *
 * @param {number} ms
 * @returns {Promise<void>}
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function isInteractable() {
    return game.gamePhase == 'playing' && !animations.isAnimating;
}

/**
 * 
 * @param {string} title 
 */
function updateTitle(title) {
    const titleElement = document.getElementById('level-title');

    if (titleElement)
        titleElement.textContent = title;
}

/**
 * 
 * @param {ButtonColor | (string & {})} name 
 */
function playAudio(name) {
    const soundPath = `./sounds/${name}.mp3`;
    const audio = new Audio(soundPath);
    audio.play();
}

/** Effects **/

/**
 * 
 * @param {HTMLElement} element 
 */
function playFlashEffect(element) {
    element.classList.remove('btn-flashing');
    void element.offsetWidth;
    element.classList.add('btn-flashing');
}

/**
 * 
 * @param {HTMLElement} element
 */
function playPressEffect(element) {
    element.classList.add('pressed');
    setTimeout(() => {
        element.classList.remove('pressed');
    }, 100);
}

function playGameOverEffect() {
    document.documentElement.classList.remove('game-over');
    void document.body.offsetWidth;
    document.documentElement.classList.add('game-over');
}

// Initialization
setup();