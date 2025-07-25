// Global variables
let currentQuestionIndex = 0;
let currentPhotoIndex = 0;
let confettiCanvas, confettiCtx;
let particleCanvas, particleCtx;
let confettiParticles = [];
let particleSystem = [];
let floatingHearts = [];
let flippedCards = [];
let matchedPairs = 0;
let moveCount = 0;
let gameCompleted = false;
let scratchCanvas, scratchCtx;
let wheelCanvas, wheelCtx;
let isSpinning = false;
let cursorTrail = [];

// Enhanced data structures
const photos = [
    {
        src: 'https://via.placeholder.com/400x300/ff69b4/ffffff?text=Memory+1',
        caption: 'First day we met - you stole my heart instantly ❤️'
    },
    {
        src: 'https://via.placeholder.com/400x300/87ceeb/ffffff?text=Memory+2', 
        caption: 'Our first coffee date - you were so beautiful ☕'
    },
    {
        src: 'https://via.placeholder.com/400x300/ff69b4/ffffff?text=Memory+3',
        caption: 'When you became my favorite nurse 👩‍⚕️'
    },
    {
        src: 'https://via.placeholder.com/400x300/87ceeb/ffffff?text=Memory+4',
        caption: 'Planning our future with little Sumayyah 👶'
    }
];

const wheelMessages = [
    'You make my heart skip a beat! 💓',
    'Most beautiful nurse in the world! 👩‍⚕️',
    'You\'re my favorite person ever! 🥰',
    'Can\'t wait for our future together! 💍',
    'You\'re stronger than you know! 💪',
    'Sumayyah will be lucky to have you! 👶',
    'You light up my world! ✨',
    'Forever grateful for you! 🙏'
];

// Quiz questions data
const quizQuestions = [
    {
        question: "Who eats the most but denies it? 🍕😂",
        options: ["Ahmad", "Aisha"],
        correctAnswer: 1,
        responses: {
            0: "Stop the cap nurse 😏",
            1: "Finally, you admit it 😈"
        }
    },
    {
        question: "What's the best part of your day?",
        options: ["Coffee", "Memes", "Ahmad's nonsense"],
        correctAnswer: 2,
        responses: {
            0: "Coffee is great, but there's something better 😉",
            1: "Memes are fun, but not the best part 😄",
            2: "Aww, you're too sweet! 🥰"
        }
    },
    {
        question: "Who will be the best mama for Sumayyah inshaAllah?",
        options: ["Aisha", "Aisha (obviously)"],
        correctAnswer: 0, // Both are correct, but we'll treat first as correct
        responses: {
            0: "MashaAllah! You're going to be amazing! 🤱💕",
            1: "Exactly! No doubt about it! 👑"
        }
    }
];

// Memory Game State
let memoryGameState = {
    firstCard: null,
    secondCard: null,
    lockBoard: false,
    matchCount: 0,
    moveCount: 0,
    gameActive: false
};

// Initialize audio
function initializeAudio() {
    // Preload audio files
    const backgroundMusic = document.getElementById('background-music');
    const successSound = document.getElementById('success-sound');
    const clickSound = document.getElementById('click-sound');
    
    // Set initial volume
    if (backgroundMusic) backgroundMusic.volume = 0.5;
    if (successSound) successSound.volume = 0.7;
    if (clickSound) clickSound.volume = 0.5;
    
    // Preload audio
    [backgroundMusic, successSound, clickSound].forEach(audio => {
        if (audio) {
            audio.load();
            // iOS requires user interaction before playing audio
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.log('Audio play failed, will require user interaction:', error);
                });
            }
        }
    });
}

// Simple debug function
function debug(message, data = '') {
    console.log(`[DEBUG] ${message}`, data);
    const debugDiv = document.getElementById('debug-console');
    if (debugDiv) {
        debugDiv.innerHTML += `<div>${new Date().toISOString()}: ${message} ${data}</div>`;
        debugDiv.scrollTop = debugDiv.scrollHeight;
    }
}

// Initialize the website
document.addEventListener('DOMContentLoaded', function() {
    debug('DOM fully loaded');
    
    try {
        // Show PIN screen immediately
        const pinScreen = document.getElementById('pin-screen');
        if (pinScreen) {
            debug('Showing PIN screen');
            pinScreen.style.display = 'flex';
            pinScreen.style.opacity = '1';
            pinScreen.style.visibility = 'visible';
            
            // Focus on PIN input
            const pinInput = document.getElementById('pin-input');
            if (pinInput) {
                pinInput.focus();
                debug('Focused PIN input');
            } else {
                debug('PIN input not found');
            }
        } else {
            debug('PIN screen not found');
        }
        
        // Initialize other components
        initializeCanvasSystems();
        startFloatingHearts();
        initializeCursorTrail();
        initializeAudio();
        setupEventListeners();
        
        // Preload memory game images
        preloadMemoryGameImages();
        
        debug('Initialization complete');
    } catch (error) {
        debug('Error during initialization:', error);
    }
});

// Preload memory game images for better performance
function preloadMemoryGameImages() {
    const imageUrls = [
        'images/memory1.jpg',
        'images/memory2.jpg',
        'images/memory3.jpg',
        'images/memory4.jpg'
    ];
    
    imageUrls.forEach(url => {
        const img = new Image();
        img.src = url;
    });
}

function setupEventListeners() {
    debug('Setting up event listeners');
    
    // PIN entry
    const unlockBtn = document.getElementById('unlock-btn');
    const pinInput = document.getElementById('pin-input');
    
    if (unlockBtn && pinInput) {
        debug('Setting up PIN entry listeners');
        
        unlockBtn.addEventListener('click', function() {
            debug('Unlock button clicked');
            checkPIN();
        });
        
        pinInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                debug('Enter key pressed in PIN input');
                checkPIN();
            }
        });
        
        // Clear error on input
        pinInput.addEventListener('input', function() {
            const errorMessage = document.getElementById('error-message');
            if (errorMessage) errorMessage.textContent = '';
        });
    } else {
        debug('Missing PIN elements:', { unlockBtn: !!unlockBtn, pinInput: !!pinInput });
    }
    
    // Other event listeners
    const setupButtonListener = (id, action) => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.addEventListener('click', action);
        } else {
            debug(`Button not found: ${id}`);
        }
    };
    
    // Setup other button listeners
    setupButtonListener('continue-btn', () => switchScreen('gallery-screen'));
    setupButtonListener('gallery-continue', () => switchScreen('memory-game-screen'));
    setupButtonListener('timeline-continue', () => switchScreen('scratch-screen'));
    setupButtonListener('scratch-continue', () => switchScreen('wheel-screen'));
    setupButtonListener('spin-btn', spinWheel);
    setupButtonListener('wheel-continue', startQuiz);
    setupButtonListener('voice-btn', showVoicePlayer);
    
    // Add memory game restart if it exists
    const memoryRestartBtn = document.getElementById('memory-restart');
    if (memoryRestartBtn) {
        memoryRestartBtn.addEventListener('click', initializeMemoryGame);
    }
    
    // Mouse tracking for cursor trail
    document.addEventListener('mousemove', updateCursorTrail);
    
    // Click effects
    document.addEventListener('click', createClickEffect);
    
    debug('Event listeners setup complete');
}

function checkPIN() {
    debug('checkPIN called');
    
    const pinInput = document.getElementById('pin-input');
    const errorMessage = document.getElementById('error-message');
    
    if (!pinInput || !errorMessage) {
        debug('PIN elements not found', { pinInput: !!pinInput, errorMessage: !!errorMessage });
        return;
    }
    
    const enteredPIN = pinInput.value;
    debug('Checking PIN:', enteredPIN);
    
    if (enteredPIN === '2001') {
        debug('Correct PIN entered');
        errorMessage.textContent = '';
        
        // Show welcome screen immediately
        showWelcomeScreen();
        
        // Try to play sounds (but don't wait for them)
        try {
            playSuccessSound().catch(e => debug('Success sound error:', e));
            startBackgroundMusic();
        } catch (e) {
            debug('Error with sounds:', e);
        }
    } else {
        debug('Wrong PIN entered');
        errorMessage.textContent = "Bruh, and you call yourself my nurse? Try again 🤭";
        pinInput.value = '';
        pinInput.focus();
        
        // Add shake animation
        pinInput.style.animation = 'shake 0.5s ease-in-out';
        pinInput.addEventListener('animationend', function onAnimationEnd() {
            pinInput.style.animation = '';
            pinInput.removeEventListener('animationend', onAnimationEnd);
        });
    }
}

function playSuccessSound() {
    return new Promise((resolve, reject) => {
        const successSound = document.getElementById('success-sound');
        if (!successSound) {
            console.error('Success sound element not found');
            resolve(); // Resolve anyway to continue the flow
            return;
        }
        
        // Reset audio to start
        successSound.currentTime = 0;
        
        // Play the sound and handle the promise
        const playPromise = successSound.play();
        
        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    // When audio finishes playing
                    successSound.onended = resolve;
                })
                .catch(error => {
                    console.log('Error playing success sound:', error);
                    resolve(); // Still resolve to continue the flow
                });
        } else {
            // Fallback for browsers that don't support play() returning a promise
            successSound.onended = resolve;
            resolve();
        }
    });
}

function startBackgroundMusic() {
    const backgroundMusic = document.getElementById('background-music');
    backgroundMusic.volume = 0.3;
    backgroundMusic.play().catch(e => console.log('Background music play failed:', e));
}

function showWelcomeScreen() {
    debug('Showing welcome screen');
    
    // Hide PIN screen using the switchScreen function
    const pinScreen = document.getElementById('pin-screen');
    if (pinScreen) {
        pinScreen.style.opacity = '0';
        pinScreen.style.visibility = 'hidden';
        pinScreen.style.display = 'none';
    }
    
    // Show welcome screen
    const welcomeScreen = document.getElementById('welcome-screen');
    if (welcomeScreen) {
        welcomeScreen.style.display = 'flex';
        // Force reflow
        void welcomeScreen.offsetWidth;
        welcomeScreen.style.opacity = '1';
        welcomeScreen.style.visibility = 'visible';
        
        // Start typing animation after a short delay
        setTimeout(() => {
            debug('Starting typing animation');
            startTypingAnimation();
        }, 300);
    } else {
        debug('Welcome screen not found');
    }
}

function startTypingAnimation() {
    const text = "Hey Aisha… Pause your life-saving mode for a sec. Someone thinks you're the most beautiful, stubborn, hungry nurse out there and made this for you.";
    const typingElement = document.getElementById('typing-text');
    const continueBtn = document.getElementById('continue-btn');
    
    let index = 0;
    typingElement.textContent = '';
    
    function typeCharacter() {
        if (index < text.length) {
            typingElement.textContent += text.charAt(index);
            index++;
            setTimeout(typeCharacter, 50);
        } else {
            // Show continue button after typing is complete
            setTimeout(() => {
                continueBtn.classList.remove('hidden');
                continueBtn.classList.add('show');
            }, 1000);
        }
    }
    
    typeCharacter();
}

function startQuiz() {
    switchScreen('quiz-screen');
    currentQuestionIndex = 0;
    showQuestion();
}

function showQuestion() {
    const questionContainer = document.getElementById('question-container');
    const question = quizQuestions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / quizQuestions.length) * 100;
    
    // Update progress bar
    document.getElementById('progress').style.width = progress + '%';
    
    questionContainer.innerHTML = `
        <div class="question">
            <h2>${question.question}</h2>
            <div class="options">
                ${question.options.map((option, index) => 
                    `<div class="option" onclick="selectAnswer(${index})">${option}</div>`
                ).join('')}
            </div>
            <div class="feedback" id="feedback"></div>
        </div>
    `;
}

function selectAnswer(selectedIndex) {
    const question = quizQuestions[currentQuestionIndex];
    const feedback = document.getElementById('feedback');
    const options = document.querySelectorAll('.option');
    
    // Disable all options
    options.forEach(option => {
        option.style.pointerEvents = 'none';
        option.style.opacity = '0.7';
    });
    
    // Highlight selected option
    options[selectedIndex].style.background = '#f8c8dc';
    options[selectedIndex].style.borderColor = '#e74c3c';
    
    // Show feedback
    feedback.textContent = question.responses[selectedIndex];
    feedback.classList.add('show');
    
    if (selectedIndex === question.correctAnswer) {
        feedback.classList.add('correct');
    } else {
        feedback.classList.add('fun');
    }
    
    // Trigger confetti
    triggerConfetti();
    
    // Move to next question or finish quiz
    setTimeout(() => {
        currentQuestionIndex++;
        if (currentQuestionIndex < quizQuestions.length) {
            showQuestion();
        } else {
            showRevealScreen();
        }
    }, 3000);
}

function showRevealScreen() {
    switchScreen('reveal-screen');
    
    // Lower background music volume
    const backgroundMusic = document.getElementById('background-music');
    backgroundMusic.volume = 0.1;
    
    // Auto-proceed to final screen after animations
    setTimeout(() => {
        showFinalScreen();
    }, 8000);
}

function showFinalScreen() {
    switchScreen('final-screen');
    triggerConfetti();
}

function showVoicePlayer() {
    const voicePlayer = document.getElementById('voice-player');
    voicePlayer.classList.remove('hidden');
    voicePlayer.classList.add('show');
}

function switchScreen(screenId) {
    debug(`Switching to screen: ${screenId}`);
    
    // Hide all screens
    document.querySelectorAll('.screen').forEach(screen => {
        screen.style.opacity = '0';
        screen.style.visibility = 'hidden';
        screen.style.display = 'none';
    });
    
    // Show target screen
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        debug(`Showing screen: ${screenId}`);
        targetScreen.style.display = 'flex';
        // Force reflow
        void targetScreen.offsetWidth;
        targetScreen.style.opacity = '1';
        targetScreen.style.visibility = 'visible';
        
        // Special handling for specific screens
        if (screenId === 'memory-game-screen') {
            initializeMemoryGame();
        } else if (screenId === 'quiz-screen') {
            startQuiz();
        } else if (screenId === 'scratch-screen') {
            initScratchCard();
        } else if (screenId === 'wheel-screen') {
            initializeSpinWheel();
        }
    } else {
        console.error('Screen not found:', screenId);
    }
}

// Confetti Animation System
function initializeConfetti() {
    confettiCanvas = document.getElementById('confetti-canvas');
    confettiCtx = confettiCanvas.getContext('2d');
    
    // Set canvas size
    function resizeCanvas() {
        confettiCanvas.width = window.innerWidth;
        confettiCanvas.height = window.innerHeight;
    }
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
}

function createConfettiParticle() {
    return {
        x: Math.random() * confettiCanvas.width,
        y: -10,
        vx: (Math.random() - 0.5) * 4,
        vy: Math.random() * 3 + 2,
        color: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b', '#eb4d4b', '#6c5ce7'][Math.floor(Math.random() * 7)],
        size: Math.random() * 8 + 4,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10
    };
}

function updateConfetti() {
    confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    
    for (let i = confettiParticles.length - 1; i >= 0; i--) {
        const particle = confettiParticles[i];
        
        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.rotation += particle.rotationSpeed;
        
        // Apply gravity
        particle.vy += 0.1;
        
        // Draw particle
        confettiCtx.save();
        confettiCtx.translate(particle.x, particle.y);
        confettiCtx.rotate(particle.rotation * Math.PI / 180);
        confettiCtx.fillStyle = particle.color;
        confettiCtx.fillRect(-particle.size/2, -particle.size/2, particle.size, particle.size);
        confettiCtx.restore();
        
        // Remove particles that are off screen
        if (particle.y > confettiCanvas.height + 10) {
            confettiParticles.splice(i, 1);
        }
    }
    
    if (confettiParticles.length > 0) {
        requestAnimationFrame(updateConfetti);
    }
}

function triggerConfetti() {
    // Create confetti particles
    for (let i = 0; i < 50; i++) {
        confettiParticles.push(createConfettiParticle());
    }
    
    // Start animation if not already running
    if (confettiParticles.length === 50) {
        updateConfetti();
    }
}

// Add some extra interactive effects
document.addEventListener('click', function(e) {
    // Create a small sparkle effect on clicks
    if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'BUTTON') {
        createSparkle(e.clientX, e.clientY);
    }
});

function createSparkle(x, y) {
    const sparkle = document.createElement('div');
    sparkle.style.position = 'fixed';
    sparkle.style.left = x + 'px';
    sparkle.style.top = y + 'px';
    sparkle.style.width = '10px';
    sparkle.style.height = '10px';
    sparkle.style.background = '#f39c12';
    sparkle.style.borderRadius = '50%';
    sparkle.style.pointerEvents = 'none';
    sparkle.style.zIndex = '999';
    sparkle.style.animation = 'sparkle 0.6s ease-out forwards';
    
    document.body.appendChild(sparkle);
    
    setTimeout(() => {
        sparkle.remove();
    }, 600);
}

// Add sparkle animation to CSS dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes sparkle {
        0% {
            transform: scale(0) rotate(0deg);
            opacity: 1;
        }
        100% {
            transform: scale(1.5) rotate(180deg);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// ===== ENHANCED INTERACTIVE FEATURES =====

// Canvas Systems Initialization
function initializeCanvasSystems() {
    // Confetti canvas
    confettiCanvas = document.getElementById('confetti-canvas');
    confettiCtx = confettiCanvas.getContext('2d');
    
    // Particle canvas
    particleCanvas = document.getElementById('particle-canvas');
    particleCtx = particleCanvas.getContext('2d');
    
    function resizeCanvases() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        confettiCanvas.width = width;
        confettiCanvas.height = height;
        particleCanvas.width = width;
        particleCanvas.height = height;
    }
    
    resizeCanvases();
    window.addEventListener('resize', resizeCanvases);
}

// Floating Hearts System
function startFloatingHearts() {
    const heartsContainer = document.querySelector('.floating-hearts');
    
    function createFloatingHeart() {
        const heart = document.createElement('div');
        heart.className = 'floating-heart';
        heart.innerHTML = ['❤️', '💕', '💖', '💝', '💗'][Math.floor(Math.random() * 5)];
        heart.style.left = Math.random() * 100 + '%';
        heart.style.animationDuration = (Math.random() * 3 + 5) + 's';
        heart.style.fontSize = (Math.random() * 10 + 15) + 'px';
        
        heartsContainer.appendChild(heart);
        
        setTimeout(() => {
            heart.remove();
        }, 8000);
    }
    
    // Create hearts periodically
    setInterval(createFloatingHeart, 2000);
}

// Custom Cursor Trail
function initializeCursorTrail() {
    const trail = document.querySelector('.cursor-trail');
    
    document.addEventListener('mousemove', (e) => {
        trail.style.left = e.clientX - 10 + 'px';
        trail.style.top = e.clientY - 10 + 'px';
        
        // Create trail particles
        if (Math.random() < 0.3) {
            createTrailParticle(e.clientX, e.clientY);
        }
    });
}

function updateCursorTrail(e) {
    const trail = document.querySelector('.cursor-trail');
    trail.style.left = e.clientX - 10 + 'px';
    trail.style.top = e.clientY - 10 + 'px';
}

function createTrailParticle(x, y) {
    const particle = {
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        life: 1,
        decay: 0.02,
        size: Math.random() * 3 + 2,
        color: `hsl(${Math.random() * 60 + 300}, 70%, 60%)`
    };
    
    particleSystem.push(particle);
    
    if (particleSystem.length === 1) {
        animateParticles();
    }
}

function animateParticles() {
    particleCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
    
    for (let i = particleSystem.length - 1; i >= 0; i--) {
        const particle = particleSystem[i];
        
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life -= particle.decay;
        
        if (particle.life <= 0) {
            particleSystem.splice(i, 1);
            continue;
        }
        
        particleCtx.save();
        particleCtx.globalAlpha = particle.life;
        particleCtx.fillStyle = particle.color;
        particleCtx.beginPath();
        particleCtx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        particleCtx.fill();
        particleCtx.restore();
    }
    
    if (particleSystem.length > 0) {
        requestAnimationFrame(animateParticles);
    }
}

// Photo Gallery System
function initializePhotoGallery() {
    createPhotoDots();
    updatePhotoDisplay();
}

function createPhotoDots() {
    const dotsContainer = document.querySelector('.photo-dots');
    dotsContainer.innerHTML = '';
    
    photos.forEach((_, index) => {
        const dot = document.createElement('div');
        dot.className = 'photo-dot';
        if (index === 0) dot.classList.add('active');
        dot.addEventListener('click', () => goToPhoto(index));
        dotsContainer.appendChild(dot);
    });
}

function changePhoto(direction) {
    currentPhotoIndex += direction;
    if (currentPhotoIndex >= photos.length) currentPhotoIndex = 0;
    if (currentPhotoIndex < 0) currentPhotoIndex = photos.length - 1;
    
    updatePhotoDisplay();
    playClickSound();
}

function goToPhoto(index) {
    currentPhotoIndex = index;
    updatePhotoDisplay();
    playClickSound();
}

function updatePhotoDisplay() {
    const slides = document.querySelectorAll('.photo-slide');
    const dots = document.querySelectorAll('.photo-dot');
    
    slides.forEach((slide, index) => {
        slide.classList.toggle('active', index === currentPhotoIndex);
    });
    
    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentPhotoIndex);
    });
}

// Memory Game System with Image Support

// Define memory cards with local images
const memoryCards = [
    { id: 1, type: 'memory1', emoji: '❤️', image: 'images/memory1.jpg' },
    { id: 2, type: 'memory1', emoji: '❤️', image: 'images/memory1.jpg' },
    { id: 3, type: 'memory2', emoji: '😊', image: 'images/memory2.jpg' },
    { id: 4, type: 'memory2', emoji: '😊', image: 'images/memory2.jpg' },
    { id: 5, type: 'memory3', emoji: '👩‍⚕️', image: 'images/memory3.jpg' },
    { id: 6, type: 'memory3', emoji: '👩‍⚕️', image: 'images/memory3.jpg' },
    { id: 7, type: 'memory4', emoji: '👶', image: 'images/memory4.jpg' },
    { id: 8, type: 'memory4', emoji: '👶', image: 'images/memory4.jpg' }
];

function initializeMemoryGame() {
    // Reset game state
    memoryGameState = {
        firstCard: null,
        secondCard: null,
        lockBoard: false,
        matchCount: 0,
        moveCount: 0,
        gameActive: true
    };
    
    // Shuffle and create cards
    const shuffledCards = [...memoryCards].sort(() => Math.random() - 0.5);
    createMemoryCards(shuffledCards);
    
    // Update UI
    updateMoveCounter();
    updateMatchMessage('Find matching pairs!');
    
    // Hide continue button at start
    const continueBtn = document.getElementById('memory-continue');
    if (continueBtn) continueBtn.classList.add('hidden');
    
    // Show restart button
    const restartBtn = document.getElementById('memory-restart');
    if (restartBtn) restartBtn.classList.remove('hidden');
}

function createMemoryCards(cards) {
    const grid = document.getElementById('memory-grid');
    grid.innerHTML = '';
    
    cards.forEach((cardData, index) => {
        const card = createMemoryCard(cardData);
        grid.appendChild(card);
    });
}

function createMemoryCard(card) {
    const cardElement = document.createElement('div');
    cardElement.className = 'memory-card';
    cardElement.dataset.id = card.id;
    cardElement.dataset.type = card.type;
    
    const cardInner = document.createElement('div');
    cardInner.className = 'card-inner';
    
    const cardFront = document.createElement('div');
    cardFront.className = 'card-front';
    cardFront.innerHTML = '?'; // This will be the back of the card
    
    const cardBack = document.createElement('div');
    cardBack.className = 'card-back';
    
    // If the card has an image, create an img element, otherwise use emoji
    if (card.image) {
        const img = document.createElement('img');
        img.src = card.image;
        img.alt = 'Memory ' + card.type;
        img.loading = 'lazy';
        cardBack.appendChild(img);
    } else {
        cardBack.textContent = card.emoji; // Fallback to emoji if no image
    }
    
    cardInner.appendChild(cardFront);
    cardInner.appendChild(cardBack);
    cardElement.appendChild(cardInner);
    
    // Add click event to flip the card
    cardElement.addEventListener('click', () => flipCard(cardElement));
    
    return cardElement;
}

function flipCard(cardElement) {
    if (memoryGameState.lockBoard || cardElement === memoryGameState.firstCard || cardElement.classList.contains('matched')) return;
    
    // Play flip sound if available
    if (window.flipSound) {
        window.flipSound.currentTime = 0;
        window.flipSound.play().catch(e => console.log('Audio play failed:', e));
    }
    
    cardElement.classList.add('flipped');
    
    if (!memoryGameState.firstCard) {
        // First card flipped
        memoryGameState.firstCard = cardElement;
        return;
    }
    
    // Second card flipped
    memoryGameState.secondCard = cardElement;
    memoryGameState.moveCount++;
    updateMoveCounter();
    
    checkForMatch();
}

function checkForMatch() {
    const isMatch = memoryGameState.firstCard.dataset.type === memoryGameState.secondCard.dataset.type;
    
    if (isMatch) {
        // Match found
        memoryGameState.matchCount++;
        disableCards();
        updateMatchMessage('Match found!');
        
        // Play match sound if available
        if (window.matchSound) {
            window.matchSound.currentTime = 0;
            window.matchSound.play().catch(e => console.log('Audio play failed:', e));
        }
        
        // Check if game is won
        if (memoryGameState.matchCount === memoryCards.length / 2) {
            memoryGameState.gameActive = false;
            setTimeout(() => {
                updateMatchMessage('You won! 🎉');
                // Trigger confetti
                createConfetti(30);
                
                // Show continue button and hide restart button
                const continueBtn = document.getElementById('memory-continue');
                const restartBtn = document.getElementById('memory-restart');
                if (continueBtn) continueBtn.classList.remove('hidden');
                if (restartBtn) restartBtn.classList.add('hidden');
            }, 500);
        }
    } else {
        // No match
        memoryGameState.lockBoard = true;
        updateMatchMessage('Try again!');
        
        setTimeout(() => {
            memoryGameState.firstCard.classList.remove('flipped');
            memoryGameState.secondCard.classList.remove('flipped');
            resetBoard();
        }, 1000);
    }
}

function disableCards() {
    memoryGameState.firstCard.classList.add('matched');
    memoryGameState.secondCard.classList.add('matched');
    
    resetBoard();
}

function resetBoard() {
    memoryGameState.firstCard = null;
    memoryGameState.secondCard = null;
    memoryGameState.lockBoard = false;
}

function updateMoveCounter() {
    const moveCounter = document.getElementById('move-counter');
    if (moveCounter) {
        moveCounter.textContent = `Moves: ${memoryGameState.moveCount}`;
    }
}

function updateMatchMessage(message) {
    const messageElement = document.getElementById('memory-message');
    if (messageElement) {
        messageElement.textContent = message;
    }
}

function flipCard(card, index) {
    if (flippedCards.length >= 2 || card.classList.contains('flipped') || card.classList.contains('matched')) {
        return;
    }
    
    card.classList.add('flipped');
    flippedCards.push({ card, index });
    
    if (flippedCards.length === 2) {
        moveCount++;
        document.getElementById('move-count').textContent = moveCount;
        
        setTimeout(checkMatch, 800);
    }
    
    playClickSound();
}

function checkMatch() {
    const [first, second] = flippedCards;
    const firstData = memoryGameData[first.index];
    const secondData = memoryGameData[second.index];
    
    if (firstData.id === secondData.id) {
        // Match found
        first.card.classList.add('matched');
        second.card.classList.add('matched');
        firstData.matched = true;
        secondData.matched = true;
        
        matchedPairs++;
        document.getElementById('match-count').textContent = `${matchedPairs}/6`;
        
        playMatchSound();
        triggerConfetti();
        
        if (matchedPairs === 6) {
            setTimeout(() => {
                switchScreen('timeline-screen');
            }, 2000);
        }
    } else {
        // No match
        setTimeout(() => {
            first.card.classList.remove('flipped');
            second.card.classList.remove('flipped');
        }, 1000);
    }
    
    flippedCards = [];
}

// Scratch Card System
function initScratchCard() {
    scratchCanvas = document.getElementById('scratch-canvas');
    scratchCtx = scratchCanvas.getContext('2d');
    
    // Fill canvas with scratch-off surface
    scratchCtx.fillStyle = '#c0c0c0';
    scratchCtx.fillRect(0, 0, 300, 200);
    
    // Add scratch pattern
    scratchCtx.fillStyle = '#a0a0a0';
    for (let i = 0; i < 50; i++) {
        scratchCtx.beginPath();
        scratchCtx.arc(Math.random() * 300, Math.random() * 200, Math.random() * 3 + 1, 0, Math.PI * 2);
        scratchCtx.fill();
    }
    
    let isScratching = false;
    let scratchedArea = 0;
    
    function startScratch(e) {
        isScratching = true;
        scratch(e);
    }
    
    function scratch(e) {
        if (!isScratching) return;
        
        const rect = scratchCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        scratchCtx.globalCompositeOperation = 'destination-out';
        scratchCtx.beginPath();
        scratchCtx.arc(x, y, 20, 0, Math.PI * 2);
        scratchCtx.fill();
        
        scratchedArea++;
        
        if (scratchedArea > 50) {
            document.getElementById('scratch-continue').classList.remove('hidden');
        }
    }
    
    function stopScratch() {
        isScratching = false;
    }
    
    // Enhanced touch events with better mobile support
    function preventDefault(e) {
        if (e.touches && e.touches.length > 1) {
            e.preventDefault();
        }
    }
    
    // Event listeners with passive: false for touch events
    window.addEventListener('resize', resizeCanvas, { passive: true });
    
    // Mouse events
    scratchCanvas.addEventListener('mousedown', startScratch);
    scratchCanvas.addEventListener('mousemove', scratch);
    scratchCanvas.addEventListener('mouseup', stopScratch);
    scratchCanvas.addEventListener('mouseleave', stopScratch);
    
    // Touch events with better mobile support
    scratchCanvas.addEventListener('touchstart', (e) => {
        preventDefault(e);
        startScratch(e.touches[0]);
    }, { passive: false });
    
    scratchCanvas.addEventListener('touchmove', (e) => {
        preventDefault(e);
        scratch(e.touches[0]);
    }, { passive: false });
    
    scratchCanvas.addEventListener('touchend', stopScratch);
    scratchCanvas.addEventListener('touchcancel', stopScratch);
    
    // Prevent page scroll on touch devices while scratching
    document.addEventListener('touchmove', preventDefault, { passive: false });
}

// Spin Wheel System with improved touch controls
function initializeSpinWheel() {
    spinWheel = document.querySelector('.wheel');
    spinButton = document.getElementById('spin-button');
    
    // Wheel configuration
    const segments = 8;
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD', '#FFD166', '#06D6A0', '#118AB2'];
    const messages = [
        'You\'re amazing!', 'You light up my life', 'My heart is yours', 
        'You\'re my favorite', 'You\'re perfect', 'I adore you', 
        'You\'re my dream', 'Spin again!'
    ];
    
    // Create wheel segments with better touch support
    function createWheel() {
        // Clear existing wheel
        spinWheel.innerHTML = '';
        
        // Add segments to wheel
        for (let i = 0; i < segments; i++) {
            const segment = document.createElement('div');
            segment.className = 'wheel-segment';
            segment.style.transform = `rotate(${(360 / segments) * i}deg)`;
            segment.style.backgroundColor = colors[i % colors.length];
            
            // Add touch feedback
            segment.style.webkitTapHighlightColor = 'transparent';
            
            const text = document.createElement('span');
            text.className = 'wheel-text';
            text.textContent = messages[i];
            text.style.transform = `rotate(${360 / segments / 2}deg)`;
            
            // Adjust text size for mobile
            if (window.innerWidth <= 768) {
                text.style.fontSize = '12px';
                text.style.width = '60%';
            }
            
            segment.appendChild(text);
            spinWheel.appendChild(segment);
        }
        
        // Add center circle
        const center = document.createElement('div');
        center.className = 'wheel-center';
        spinWheel.appendChild(center);
        
        // Add arrow if it doesn't exist
        if (!document.querySelector('.wheel-arrow')) {
            const arrow = document.createElement('div');
            arrow.className = 'wheel-arrow';
            spinWheel.parentNode.insertBefore(arrow, spinWheel.nextSibling);
        }
    }
    
    // Spin functionality with improved physics
    let isSpinning = false;
    let currentRotation = 0;
    
    function spin() {
        if (isSpinning) return;
        
        isSpinning = true;
        spinButton.disabled = true;
        spinButton.style.opacity = '0.6';
        
        // Haptic feedback on mobile if available
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
        
        // Play sound if available
        if (window.spinSound) {
            window.spinSound.currentTime = 0;
            window.spinSound.play().catch(e => console.log('Audio play failed:', e));
        }
        
        // Random spin (5-10 full rotations + random segment)
        const minSpin = 1800; // 5 full rotations
        const maxSpin = 3600; // 10 full rotations
        const spinDegrees = minSpin + Math.random() * (maxSpin - minSpin);
        
        const segmentAngle = 360 / segments;
        const winningSegment = Math.floor(Math.random() * segments);
        
        // Calculate target rotation (current + spin + offset to land on segment)
        const targetRotation = currentRotation + spinDegrees + (360 - (currentRotation % 360) + (winningSegment * segmentAngle));
        currentRotation = targetRotation;
        
        // Add a slight wobble effect
        spinWheel.style.transition = 'transform 4.5s cubic-bezier(0.17, 0.67, 0.12, 0.99)';
        
        // Small delay to ensure the transition is applied
        requestAnimationFrame(() => {
            spinWheel.style.transform = `rotate(${currentRotation}deg)`;
        });
        
        // Show result when spinning stops
        const spinDuration = 4500; // ms
        
        // Add a slight delay before showing the result
        const resultDelay = spinDuration - 500;
        
        setTimeout(() => {
            // Show confetti for winning spins (not for 'Spin again')
            if (winningSegment !== segments - 1) {
                createConfetti(20);
            }
            
            // Show result message with animation
            const existingResult = document.querySelector('.wheel-result');
            const result = existingResult || document.createElement('div');
            result.className = 'wheel-result';
            result.textContent = messages[winningSegment];
            
            if (!existingResult) {
                document.body.appendChild(result);
                // Animate in
                setTimeout(() => result.style.opacity = '1', 10);
            }
            
            // Remove result after 3 seconds
            setTimeout(() => {
                result.style.opacity = '0';
                setTimeout(() => {
                    if (result.parentNode) {
                        result.remove();
                    }
                }, 500);
            }, 3000);
            
        }, resultDelay);
        
        // Re-enable button after spin completes
        setTimeout(() => {
            isSpinning = false;
            spinButton.disabled = false;
            spinButton.style.opacity = '1';
        }, spinDuration);
    }
    
    // Handle touch events
    function handleTouchStart(e) {
        if (isSpinning) return;
        touchStartX = e.touches ? e.touches[0].clientX : e.clientX;
        touchStartTime = Date.now();
    }
    
    function handleTouchEnd(e) {
        if (isSpinning) return;
        
        const touchEndX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
        const touchEndTime = Date.now();
        const deltaX = touchEndX - touchStartX;
        const deltaTime = touchEndTime - touchStartTime;
        
        // Check if it's a quick swipe
        if (Math.abs(deltaX) > 50 && deltaTime < 300) {
            e.preventDefault();
            spin();
        }
    }
    
    // Initialize the wheel
    createWheel();
    
    // Add event listeners
    spinButton.addEventListener('click', spin);
    spinButton.addEventListener('touchstart', handleTouchStart, { passive: true });
    spinButton.addEventListener('touchend', (e) => {
        e.preventDefault();
        handleTouchEnd(e);
    }, { passive: false });
    
    // Support swipe to spin on the wheel itself
    spinWheel.addEventListener('touchstart', handleTouchStart, { passive: true });
    spinWheel.addEventListener('touchend', (e) => {
        e.preventDefault();
        handleTouchEnd(e);
    }, { passive: false });
    
    // Recreate wheel on window resize for better responsiveness
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            if (!isSpinning) {
                createWheel();
            }
        }, 250);
    });
}

// Sound Effects
function playClickSound() {
    const sound = document.getElementById('click-sound');
    if (sound) sound.play().catch(() => {});
}

function playMatchSound() {
    const sound = document.getElementById('match-sound');
    if (sound) sound.play().catch(() => {});
}

function playWheelSpinSound() {
    const sound = document.getElementById('wheel-spin-sound');
    if (sound) sound.play().catch(() => {});
}

// Click Effects
function createClickEffect(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;
    
    const effect = document.createElement('div');
    effect.style.position = 'fixed';
    effect.style.left = e.clientX - 5 + 'px';
    effect.style.top = e.clientY - 5 + 'px';
    effect.style.width = '10px';
    effect.style.height = '10px';
    effect.style.background = 'radial-gradient(circle, #ff69b4, transparent)';
    effect.style.borderRadius = '50%';
    effect.style.pointerEvents = 'none';
    effect.style.zIndex = '9999';
    effect.style.animation = 'sparkle 0.6s ease-out forwards';
    
    document.body.appendChild(effect);
    
    setTimeout(() => {
        effect.remove();
    }, 600);
}
