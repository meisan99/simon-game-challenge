/** @typedef {"green" | "red" | "yellow" | "blue"} ButtonColor */
/** @type {ButtonColor[]} */
const buttonColors = ["green", "red", "yellow", "blue"]

/** @type {ButtonColor[]} */
var gamePattern = [];
/** @type {ButtonColor[]} */
var userClickedPattern = []

/** @type {Boolean} */
var started = false;

setup();

function setup() {
    // Button Setup
    const allButtons = document.querySelectorAll('div.btn');
    for (var i = 0; i < allButtons.length; i++) {
        const button = allButtons[i];
        button.addEventListener('click', () => {
            if (!isInteractable()) return;

            if (!buttonColors.includes(button.id)) {
                console.warn(`Invalid button id ${button.id}`);
                return;
            }

            playPressEffect(button);
            selectColor(button.id);
        });
    }

    // Keybord Setup
    document.addEventListener('click', tryStartGame);
}

function tryStartGame() {
    if (started) return;

    started = true
    proceedNextSequence();
    document.removeEventListener('click', tryStartGame);
}

/**
 * 
 * @returns
 */
function proceedNextSequence() {

    userClickedPattern = [];

    const randomIdx = Math.floor(Math.random() * buttonColors.length);
    const nextColor = buttonColors[randomIdx];
    gamePattern.push(nextColor);

    var targetButton = document.querySelector(`.btn#${nextColor}`);

    playAudio(nextColor);
    playFlashEffect(targetButton);

    updateTitle(`Level ${gamePattern.length}`);
}

/**
 * 
 * @param {ButtonColor} color 
 * @param
 */
function selectColor(color) {
    userClickedPattern.push(color);

    if (!validateColor(userClickedPattern.length - 1, color)) {
        gameOver();
        return;
    }

    playAudio(color);

    // Proceed next sequence if current level cleared
    if (userClickedPattern.length == gamePattern.length) {
        setTimeout(() => {
            proceedNextSequence();
        }, 1000);
    }
}


function gameOver() {

    gamePattern = [];
    userClickedPattern = [];
    started = false;

    // handle wrong answer
    playAudio('wrong');
    updateTitle('Game Over, Click Anywhere to Restart');
    playGameOverEffect();

    setTimeout(() => {
        document.addEventListener('click', tryStartGame);
    }, 100);
}

/** Utility **/

function isInteractable() {
    return started;
}

/**
 * 
 * @param {number} index
 * @param {ButtonColor} color
 * @returns {boolean}
 */
function validateColor(index, color) {
    return color === gamePattern[index];
}


/**
 * 
 * @param {string} title 
 */
function updateTitle(title) {
    const titleElement = document.getElementById('level-title');
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
    document.body.classList.add('game-over');
    setTimeout(() => {
        document.body.classList.remove('game-over');
    }, 100);
}