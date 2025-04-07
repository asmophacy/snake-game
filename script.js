const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const mainMenu = document.getElementById('main-menu');
const startButton = document.getElementById('start-button');
const speedSlider = document.getElementById('speed-slider');
const speedValueSpan = document.getElementById('speed-value');
const lastScoreDiv = document.getElementById('last-score');
// --- Audio elements ---
const backgroundMusic = document.getElementById('background-music');
const muteButton = document.getElementById('mute-button');
const eatSound = document.getElementById('eat-sound'); // --- NEW: Get eat sound element ---
let isMuted = false; // Track mute state
// --- End Audio elements ---

// Set default volume
backgroundMusic.volume = 0.3;
eatSound.volume = 0.5; // --- NEW: Set eat sound volume (adjust 0.5 as needed) ---

const box = 20;
let snake;
let direction;
let apples = []; // --- NEW: Array for multiple apples ---
let game;
let score = 0;
let gameSpeed = 100;
let allImagesLoaded = false;
let isPaused = false;

// --- NEW: Apple count and timing ---
let targetAppleCount = 2; // Start with 2 apples
let gameStartTime = null;
let appleCountIncreased = false;
const appleIncreaseTime = 30000; // 30 seconds in milliseconds
// --- End NEW ---

// Load images
const appleImg = new Image();
appleImg.src = 'assets/apple.png';

const headUp = new Image();
headUp.src = 'assets/snake-head-up.png';
const headDown = new Image();
headDown.src = 'assets/snake-head-down.png';
const headLeft = new Image();
headLeft.src = 'assets/snake-head-left.png';
const headRight = new Image();
headRight.src = 'assets/snake-head-right.png';

const bodyVertical = new Image();
bodyVertical.src = 'assets/snake-body-vertical.png';
const bodyHorizontal = new Image();
bodyHorizontal.src = 'assets/snake-body-horizontal.png';

const backgroundImg = new Image();
backgroundImg.src = 'assets/background.jpg';

let imagesLoaded = 0;
const totalImages = 8;

function imageLoaded() {
    imagesLoaded++;
    console.log(`Image ${imagesLoaded}/${totalImages} loaded.`);
    if (imagesLoaded === totalImages) {
        allImagesLoaded = true;
        console.log("All images loaded.");
    }
}

appleImg.onload = imageLoaded;
headUp.onload = imageLoaded;
headDown.onload = imageLoaded;
headLeft.onload = imageLoaded;
headRight.onload = imageLoaded;
bodyVertical.onload = imageLoaded;
bodyHorizontal.onload = imageLoaded;
backgroundImg.onload = imageLoaded;

appleImg.onerror = () => console.error("Failed to load apple.jpg");
headUp.onerror = () => console.error("Failed to load snake-head-up.jpg");
headDown.onerror = () => console.error("Failed to load snake-head-down.jpg");
headLeft.onerror = () => console.error("Failed to load snake-head-left.jpg");
headRight.onerror = () => console.error("Failed to load snake-head-right.jpg");
bodyVertical.onerror = () => console.error("Failed to load snake-body-vertical.png");
bodyHorizontal.onerror = () => console.error("Failed to load snake-body-horizontal.png");
backgroundImg.onerror = () => console.error("Failed to load background.jpg");

// --- NEW: Helper function to check if a location is occupied ---
function isOccupied(x, y) {
    // Check snake body
    for (const segment of snake) {
        if (segment.x === x && segment.y === y) {
            return true;
        }
    }
    // Check other apples
    for (const app of apples) {
        if (app.x === x && app.y === y) {
            return true;
        }
    }
    return false;
}
// --- End NEW ---

// --- NEW: Function to spawn a single new apple ---
function spawnNewApple() {
    let newApple;
    do {
        newApple = {
            x: Math.floor(Math.random() * (canvas.width / box)) * box,
            y: Math.floor(Math.random() * (canvas.height / box)) * box
        };
    } while (isOccupied(newApple.x, newApple.y)); // Keep trying until a free spot is found
    apples.push(newApple);
    console.log("Spawned apple at:", newApple.x / box, newApple.y / box);
}
// --- End NEW ---

speedSlider.oninput = function() {
    gameSpeed = parseInt(this.value);
    speedValueSpan.textContent = this.value;
}

// Function to set up game state (but not start the loop)
function setupGame() {
    console.log("Setting up game state...");
    snake = [{ x: 9 * box, y: 9 * box }]; // Start snake
    direction = 'RIGHT';
    score = 0;
    lastScoreDiv.textContent = '';

    // --- UPDATED: Initialize apples ---
    apples = []; // Clear existing apples
    targetAppleCount = 2; // Reset target count
    appleCountIncreased = false; // Reset flag
    for (let i = 0; i < targetAppleCount; i++) {
        spawnNewApple(); // Spawn initial apples
    }
    // --- End UPDATED ---
}

// --- NEW: Mute Button Logic ---
muteButton.addEventListener('click', toggleMute);

function toggleMute() {
    isMuted = !isMuted;
    backgroundMusic.muted = isMuted;
    eatSound.muted = isMuted; // --- NEW: Mute/unmute eat sound too ---
    muteButton.textContent = isMuted ? 'Unmute 🔈' : 'Mute 🔇';
    console.log("Muted:", isMuted);
}
// --- End NEW ---

// --- NEW: Helper function to safely play audio ---
// Browsers often block autoplay until user interaction
function playAudioSafely(audioElement) {
    const playPromise = audioElement.play();
    if (playPromise !== undefined) {
        playPromise.then(_ => {
            // Autoplay started!
            console.log("Music playing.");
        }).catch(error => {
            // Autoplay was prevented.
            console.warn("Music autoplay prevented:", error);
            // Optionally, update UI to indicate music is paused until interaction
        });
    }
}
// --- End NEW ---

// Event listener for the start button
startButton.addEventListener('click', () => {
    if (!allImagesLoaded) {
        console.error("Images not loaded yet!");
        alert("Assets are still loading, please wait a moment.");
        return;
    }
    console.log("Start button clicked. Speed:", gameSpeed);
    mainMenu.classList.add('hidden');
    canvas.classList.remove('hidden');
    document.getElementById('controls').classList.remove('hidden'); // Show controls
    isPaused = false;
    setupGame(); // Initialize snake, apples, score

    // --- NEW: Record start time ---
    gameStartTime = Date.now();
    // --- End NEW ---

    // --- UPDATED: Start music ---
    if (!isMuted) {
        playAudioSafely(backgroundMusic);
    }
    // --- End UPDATED ---

    // Clear any residual interval just in case
    if (game) {
        clearInterval(game);
    }
    // Start the game loop with the selected speed
    game = setInterval(draw, gameSpeed);
    console.log("New game interval started:", game, "with delay:", gameSpeed);
    canvas.focus(); // Try to focus the canvas for key events
});

// Get references to the control buttons
const upButton = document.getElementById('up-button');
const downButton = document.getElementById('down-button');
const leftButton = document.getElementById('left-button');
const rightButton = document.getElementById('right-button');

// Add event listeners for the buttons
upButton.addEventListener('click', () => changeDirection({ keyCode: 38 })); // Up arrow
downButton.addEventListener('click', () => changeDirection({ keyCode: 40 })); // Down arrow
leftButton.addEventListener('click', () => changeDirection({ keyCode: 37 })); // Left arrow
rightButton.addEventListener('click', () => changeDirection({ keyCode: 39 })); // Right arrow);

window.addEventListener('keydown', handleKeyDown);

function handleKeyDown(event) {
    const key = event.keyCode;

    if (key === 27) {
        if (game && !isPaused) {
            pauseGame();
        } else if (isPaused) {
            resumeGame();
        }
        return;
    }

    if (isPaused || !game) {
        return;
    }

    if ([37, 38, 39, 40, 65, 87, 68, 83].includes(key)) {
        event.preventDefault();
    }
    console.log("Key pressed:", key, "Current direction:", direction);

    changeDirection(event);
}

// Add this function if it's missing
function changeDirection(event) {
    const key = event.keyCode;
    // Prevent reversing direction directly
    const goingUp = direction === 'UP';
    const goingDown = direction === 'DOWN';
    const goingLeft = direction === 'LEFT';
    const goingRight = direction === 'RIGHT';

    if ((key === 37 || key === 65) && !goingRight) {
        direction = 'LEFT';
        console.log("Direction changed to LEFT");
    } else if ((key === 38 || key === 87) && !goingDown) {
        direction = 'UP';
        console.log("Direction changed to UP");
    } else if ((key === 39 || key === 68) && !goingLeft) {
        direction = 'RIGHT';
        console.log("Direction changed to RIGHT");
    } else if ((key === 40 || key === 83) && !goingUp) {
        direction = 'DOWN';
        console.log("Direction changed to DOWN");
    }
}

function collision(head, array) {
    for (let i = 1; i < array.length; i++) {
        if (head.x === array[i].x && head.y === array[i].y) {
            return true;
        }
    }
    return false;
}

function pauseGame() {
    if (!game) return;
    isPaused = true;
    clearInterval(game);
    console.log("Game paused. Interval ID:", game);
    game = null;

    // --- UPDATED: Pause music ---
    backgroundMusic.pause();
    // --- End UPDATED ---

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.font = '40px Arial';
    ctx.textAlign = 'center';
    ctx.fillText("Paused", canvas.width / 2, canvas.height / 2);
}

function resumeGame() {
    if (game) return;
    isPaused = false;

    // --- UPDATED: Resume music ---
    if (!isMuted) {
        playAudioSafely(backgroundMusic);
    }
    // --- End UPDATED ---

    game = setInterval(draw, gameSpeed);
    console.log("Game resumed. New interval ID:", game);
}

function gameOver() {
    console.log("Game Over! Final Score:", score, "Interval ID:", game);
    clearInterval(game);
    console.log("Game interval cleared:", game);
    game = null; // Reset game interval variable
    isPaused = false; // Ensure not paused on game over

    // --- NEW: Reset timer ---
    gameStartTime = null;
    // --- End NEW ---

    // --- UPDATED: Stop music ---
    backgroundMusic.pause();
    backgroundMusic.currentTime = 0; // Reset music to beginning
    // --- End UPDATED ---

    canvas.classList.add('hidden');
    mainMenu.classList.remove('hidden');
    lastScoreDiv.textContent = `Last Score: ${score}`; // Display final score
}

function draw() {
    if (isPaused) return;

    // --- NEW: Check for timed apple increase ---
    if (gameStartTime && !appleCountIncreased) {
        const elapsedTime = Date.now() - gameStartTime;
        if (elapsedTime >= appleIncreaseTime) {
            console.log("Increasing apple count after 30 seconds.");
            targetAppleCount = 4;
            appleCountIncreased = true;
            // Spawn additional apples if needed
            while (apples.length < targetAppleCount) {
                spawnNewApple();
            }
        }
    }
    // --- End NEW ---

    // Draw Background
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (backgroundImg.complete) {
        ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);
    } else {
        ctx.fillStyle = '#DDDDDD';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Draw Snake
    for (let i = 0; i < snake.length; i++) {
        if (i === 0) {
            let headImg;
            switch (direction) {
                case 'UP':    headImg = headUp; break;
                case 'DOWN':  headImg = headDown; break;
                case 'LEFT':  headImg = headLeft; break;
                case 'RIGHT': headImg = headRight; break;
                default:      headImg = headRight;
            }
            if (headImg.complete) {
                ctx.drawImage(headImg, snake[i].x, snake[i].y, box, box);
            } else {
                ctx.fillStyle = 'darkgreen';
                ctx.fillRect(snake[i].x, snake[i].y, box, box);
            }
        } else {
            const prevSegment = snake[i - 1];
            const currentSegment = snake[i];
            let bodyImg;

            if (prevSegment.x === currentSegment.x) {
                bodyImg = bodyVertical;
            } else if (prevSegment.y === currentSegment.y) {
                bodyImg = bodyHorizontal;
            } else {
                if (i > 1) {
                    const prevPrevSegment = snake[i - 2];
                    if (prevPrevSegment.x === prevSegment.x) {
                        bodyImg = bodyVertical;
                    } else {
                        bodyImg = bodyHorizontal;
                    }
                } else {
                    if (direction === 'UP' || direction === 'DOWN') {
                        bodyImg = bodyVertical;
                    } else {
                        bodyImg = bodyHorizontal;
                    }
                }
            }

            if (bodyImg && bodyImg.complete) {
                ctx.drawImage(bodyImg, currentSegment.x, currentSegment.y, box, box);
            } else {
                ctx.fillStyle = 'lightgreen';
                ctx.fillRect(currentSegment.x, currentSegment.y, box, box);
                ctx.strokeStyle = 'darkgreen';
                ctx.strokeRect(currentSegment.x, currentSegment.y, box, box);
            }
        }
    }

    // --- UPDATED: Draw all apples ---
    for (const currentApple of apples) {
        if (appleImg.complete) {
            ctx.drawImage(appleImg, currentApple.x, currentApple.y, box, box);
        } else {
            ctx.fillStyle = 'red'; // Fallback color
            ctx.fillRect(currentApple.x, currentApple.y, box, box);
        }
    }
    // --- End UPDATED ---

    // Current head position
    let snakeX = snake[0].x;
    let snakeY = snake[0].y;

    // Update head position based on direction
    if (direction === 'LEFT') snakeX -= box;
    if (direction === 'UP') snakeY -= box;
    if (direction === 'RIGHT') snakeX += box;
    if (direction === 'DOWN') snakeY += box;

    // --- UPDATED: Check for apple collision ---
    let appleEaten = false;
    for (let i = 0; i < apples.length; i++) {
        if (snakeX === apples[i].x && snakeY === apples[i].y) {
            score++;
            console.log("Ate apple at:", apples[i].x / box, apples[i].y / box);

            // --- NEW: Play eat sound ---
            if (!isMuted) {
                eatSound.currentTime = 0; // Rewind to start
                eatSound.play();          // Play the sound
            }
            // --- End NEW ---

            apples.splice(i, 1); // Remove eaten apple from array
            spawnNewApple();     // Spawn a replacement apple
            appleEaten = true;
            break; // Only eat one apple per frame
        }
    }
    // --- End UPDATED ---

    // --- UPDATED: Snake movement (pop tail only if no apple eaten) ---
    if (!appleEaten) {
        if (snake.length > 0) {
            snake.pop();
        } else {
            console.error("Tried to pop an empty snake array!");
            gameOver();
            return;
        }
    }
    // --- End UPDATED ---

    const newHead = { x: snakeX, y: snakeY };

    // Check for game over conditions (wall or self collision)
    if (snakeX < 0 || snakeY < 0 || snakeX >= canvas.width || snakeY >= canvas.height || collision(newHead, snake)) {
        gameOver();
        return;
    }

    // Add new head
    snake.unshift(newHead);

    // Draw Score on canvas
    ctx.fillStyle = 'black';
    ctx.font = '20px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText("Score: " + score, box, box);
}
