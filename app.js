// Costanti di Configurazione del Gioco
const CONFIG = {
    BASE_MARGIN: 5.0,       // Margine di errore iniziale (Livello 1) in secondi
    MARGIN_DECAY: 0.75,     // Moltiplicatore di difficoltà a ogni livello
    MIN_MARGIN: 0.05,       // Margine minimo insuperabile (50 millesimi di secondo)
    BLIND_THRESHOLD: 2.0    // Dopo quanti secondi il display diventa "cieco"
};

// Stato dell'applicazione
let state = {
    currentLevel: 1,
    targetTime: 0,
    startTime: 0,
    elapsedTime: 0,
    timerInterval: null,
    isPlaying: false,
    highScore: 0,
    lastScore: 0
};

// Elementi del DOM
const screens = {
    home: document.getElementById('home-screen'),
    game: document.getElementById('game-screen'),
    result: document.getElementById('result-screen')
};

const dom = {
    startBtn: document.getElementById('start-btn'),
    actionBtn: document.getElementById('action-btn'),
    nextBtn: document.getElementById('next-btn'),
    homeBtn: document.getElementById('home-btn'),
    homeRecord: document.getElementById('home-record'),
    homeLastScore: document.getElementById('home-last-score'),
    gameLevel: document.getElementById('game-level'),
    targetValue: document.getElementById('target-value'),
    timerDisplay: document.getElementById('timer-display'),
    resultTitle: document.getElementById('result-title'),
    resultMessage: document.getElementById('result-message'),
    resultStats: document.getElementById('result-stats')
};

// Inizializzazione al caricamento della pagina
document.addEventListener('DOMContentLoaded', () => {
    initStorage();
    setupEventListeners();
});

// Gestione LocalStorage
function initStorage() {
    state.highScore = parseInt(localStorage.getItem('blind_timer_highscore')) || 0;
    dom.homeRecord.textContent = `Record: Livello ${state.highScore}`;
}

function updateHighScore(level) {
    if (level > state.highScore) {
        state.highScore = level;
        localStorage.setItem('blind_timer_highscore', level);
        dom.homeRecord.textContent = `Record: Livello ${state.highScore}`;
    }
}

// Navigazione tra le schermate
function showScreen(screenKey) {
    Object.keys(screens).forEach(key => {
        if (key === screenKey) {
            screens[key].classList.remove('hidden');
        } else {
            screens[key].classList.add('hidden');
        }
    });
}

// Configurazione Event Listener
function setupEventListeners() {
    dom.startBtn.addEventListener('click', () => startNewGame());
    dom.actionBtn.addEventListener('click', () => handleActionClick());
    dom.nextBtn.addEventListener('click', () => loadLevel(state.currentLevel + 1));
    dom.homeBtn.addEventListener('click', () => {
        dom.homeLastScore.textContent = `Ultima Partita: Livello ${state.lastScore}`;
        dom.homeLastScore.classList.remove('hidden');
        showScreen('home');
    });
}

// Logica di Gioco
function startNewGame() {
    state.lastScore = 0;
    loadLevel(1);
}

function loadLevel(level) {
    state.currentLevel = level;
    state.isPlaying = false;
    state.elapsedTime = 0;
    
    // Genera un tempo target casuale tra 5.00 e 15.00 secondi
    state.targetTime = parseFloat((Math.random() * (15 - 5) + 5).toFixed(2));
    
    // Aggiorna Interfaccia Grafica
    dom.gameLevel.textContent = `LIV. ${state.currentLevel}`;
    dom.targetValue.textContent = `${state.targetTime.toFixed(2)}s`;
    dom.timerDisplay.textContent = '0.00';
    dom.timerDisplay.classList.remove('timer-blind');
    dom.actionBtn.textContent = 'AVVIA';
    dom.actionBtn.style.backgroundColor = 'var(--action-color)';
    
    showScreen('game');
}

function handleActionClick() {
    if (!state.isPlaying) {
        // Avvia il Timer
        state.isPlaying = true;
        dom.actionBtn.textContent = 'STOP!';
        dom.actionBtn.style.backgroundColor = 'var(--danger-color)';
        state.startTime = performance.now();
        
        state.timerInterval = setInterval(() => {
            const currentTime = performance.now();
            state.elapsedTime = (currentTime - state.startTime) / 1000;
            
            if (state.elapsedTime >= CONFIG.BLIND_THRESHOLD) {
                dom.timerDisplay.textContent = '??.??';
                dom.timerDisplay.classList.add('timer-blind');
            } else {
                dom.timerDisplay.textContent = state.elapsedTime.toFixed(2);
            }
        }, 10); // Aggiorna ogni 10ms per precisione al centesimo
    } else {
        // Ferma il Timer
        clearInterval(state.timerInterval);
        evaluateResult();
    }
}

// Calcolo dello scarto e verdetto
function evaluateResult() {
    state.lastScore = state.currentLevel;
    const finalTime = parseFloat(state.elapsedTime.toFixed(2));
    const difference = Math.abs(finalTime - state.targetTime);
    
    // Calcolo dinamico della tolleranza in base al livello
    // Formula: MargineBase * (Decay ^ (Livello - 1))
    let currentAllowedMargin = CONFIG.BASE_MARGIN * Math.pow(CONFIG.MARGIN_DECAY, state.currentLevel - 1);
    // Evita che diventi matematicamente impossibile a livelli estremi
    if (currentAllowedMargin < CONFIG.MIN_MARGIN) currentAllowedMargin = CONFIG.MIN_MARGIN;
    
    const isSuccess = difference <= currentAllowedMargin;
    
    // Configura la schermata dei risultati
    if (isSuccess) {
        dom.resultTitle.textContent = "LIVELLO SUPERATO!";
        dom.resultTitle.className = "success-text";
        dom.resultMessage.textContent = `Grande! Ottimo tempismo.`;
        dom.nextBtn.classList.remove('hidden');
        updateHighScore(state.currentLevel);
    } else {
        dom.resultTitle.textContent = "GAME OVER";
        dom.resultTitle.className = "danger-text";
        dom.resultMessage.textContent = `Hai mancato il target!`;
        dom.nextBtn.classList.add('hidden'); // Nasconde il tasto per avanzare
    }
    
    dom.resultStats.innerHTML = `
        Target: <strong>${state.targetTime.toFixed(2)}s</strong><br>
        Tuo Tempo: <strong>${finalTime.toFixed(2)}s</strong><br>
        Scarto effettuato: <strong>${difference.toFixed(2)}s</strong><br>
        Scarto massimo ammesso: <strong>${currentAllowedMargin.toFixed(2)}s</strong>
    `;
    
    showScreen('result');
}