const startBt = document.querySelector('#start')
const viewScoresBt = document.querySelector('#view-scores')
const screens = document.querySelectorAll('.screen')
const timeList = document.querySelector('#time-list')
const timeEl = document.querySelector('#time')
const board = document.querySelector('#board')
const colors = ['#1bcf55', '#a9cf1b', '#cf651b', '#3b1bcf', '#cf1b93']
const restartBtn = document.getElementById('restart')

const scoresScreen = document.getElementById('scores-screen')
const highscoreListEl = document.getElementById('highscore-list')
const clearScoresBtn = document.getElementById('clear-scores')
const backToStartBtn = document.getElementById('back-to-start')

const nameModal = document.getElementById('name-modal')
const modalScoreEl = document.getElementById('modal-score')
const playerNameInput = document.getElementById('player-name')
const saveNameBtn = document.getElementById('save-name')
const skipSaveBtn = document.getElementById('skip-save')

let time = 0
let initialTime = 0
let score = 0
let timerId = null

const HIGHSCORES_KEY = 'aim_training_highscores_v1'
const MAX_SCORES = 10

startBt.addEventListener('click', (event) => {
    event.preventDefault()
    document.getElementById('start-screen').classList.add('up')
})

if (viewScoresBt) {
    viewScoresBt.addEventListener('click', (event) => {
    event.preventDefault()
    showHighScoresScreen()
    })
}

function showHighScoresScreen() {
    renderHighScores()
    const screensArr = Array.from(screens)
    const idx = screensArr.indexOf(scoresScreen)

    if (idx === -1) {
        screens.forEach(s => s.classList.remove('up'))
        scoresScreen.classList.add('up')
        return
    }

    screens.forEach(s => s.classList.remove('up'))
    for (let i = 0; i < idx; i++) {
        screens[i].classList.add('up')
    }
}

timeList.addEventListener('click', (event) => {
    if (event.target.classList.contains('time-btn')) {
        initialTime = parseInt(event.target.getAttribute('data-time'), 10)
        if (!initialTime) return
        time = initialTime
        document.getElementById('time-screen').classList.add('up')
        startGame()
    }
})

board.addEventListener('click', event => {
    if (event.target.classList.contains('circle')) {
        score++
        event.target.remove()
        createRandomCircle()
    }
})

if (restartBtn) {
    restartBtn.addEventListener('click', () => {
        screens.forEach(s => s.classList.remove('up'))
        document.getElementById('game-screen').classList.add('up')
        resetGameState()
        startGame()
    })
}

if (clearScoresBtn) {
    clearScoresBtn.addEventListener('click', () => {
        localStorage.removeItem(HIGHSCORES_KEY)
        renderHighScores()
    })
}

if (backToStartBtn) {
    backToStartBtn.addEventListener('click', () => {
        screens.forEach(s => s.classList.remove('up'))
        document.getElementById('start-screen').classList.add('up')
    })
}

saveNameBtn.addEventListener('click', () => {
    const raw = playerNameInput.value || ''
    const name = raw.trim().substring(0, 20) || 'Anon'
    saveHighScore({ name, score, date: new Date().toISOString() })
    closeNameModal()
    showHighScoresScreen()
})

skipSaveBtn.addEventListener('click', () => {
    closeNameModal()
    showHighScoresScreen()
})

playerNameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        saveNameBtn.click()
    }
})

function openNameModal(currentScore) {
    modalScoreEl.textContent = currentScore
    playerNameInput.value = ''
    nameModal.classList.remove('hidden')
    nameModal.setAttribute('aria-hidden', 'false')
    playerNameInput.focus()
}

function closeNameModal() {
    nameModal.classList.add('hidden')
    nameModal.setAttribute('aria-hidden', 'true')
}


function resetGameState() {
    if (timerId) {
        clearInterval(timerId)
        timerId = null
    }
    score = 0
    time = initialTime
    board.innerHTML = ''
    timeEl.parentNode.classList.remove('hide')
    setTime(time < 10 ? `0${time}` : time)
}

function startGame() {
    if (!initialTime || initialTime <= 0) return

    if (timerId) clearInterval(timerId)
    score = 0
    time = initialTime
    setTime(time < 10 ? `0${time}` : time)
    board.innerHTML = ''
    createRandomCircle()
    timerId = setInterval(decreaseTime, 1000)

    screens.forEach(s => s.classList.remove('up'))
    document.getElementById('game-screen').classList.add('up')
}

function decreaseTime() {
    if (time === 0) {
        finishGame()
    } else {
        let current = --time
        if (current < 10) current = `0${current}`
        setTime(current)
    }
}

function setTime(value) {
    timeEl.innerHTML = `00:${value}`
}

function finishGame() {
    if (timerId) {
        clearInterval(timerId)
        timerId = null
    }
    timeEl.parentNode.classList.add('hide')
    board.innerHTML = `<h1>Score: <span class="primary">${score}</span></h1>`

    if (score > 0) {
        openNameModal(score)
    } else {
        showHighScoresScreen()
    }
}


function loadHighScores() {
    try {
        const raw = localStorage.getItem(HIGHSCORES_KEY)
        if (!raw) return []
        const parsed = JSON.parse(raw)
        if (!Array.isArray(parsed)) return []
        return parsed
    } catch (e) {
        console.error('Failed to load high scores', e)
        return []
    }
}

function saveHighScore(entry) {
    const scores = loadHighScores()
    scores.push(entry)
    scores.sort((a, b) => b.score - a.score)
    const top = scores.slice(0, MAX_SCORES)
    try {
        localStorage.setItem(HIGHSCORES_KEY, JSON.stringify(top))
    } catch (e) {
        console.error('Failed to save high scores', e)
    }
}

function renderHighScores() {
    const scores = loadHighScores()
    highscoreListEl.innerHTML = ''
    if (scores.length === 0) {
        const li = document.createElement('li')
        li.textContent = 'No scores yet. Play a game to add your name!'
        highscoreListEl.appendChild(li)
        return
    }
    scores.forEach(entry => {
        const li = document.createElement('li')
        const date = new Date(entry.date)
        const shortDate = isNaN(date.getTime()) ? '' : `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`
        li.textContent = `${entry.name} - ${entry.score} - ${shortDate}`
        highscoreListEl.appendChild(li)
    })
}


function createRandomCircle() {
    const circle = document.createElement('div')
    const size = getRandomNumber(10, 60)
    const { width, height } = board.getBoundingClientRect()
    const x = getRandomNumber(0, Math.max(0, width - size))
    const y = getRandomNumber(0, Math.max(0, height - size))
    const color = getRandomColor()

    circle.style.background = color
    circle.classList.add('circle')
    circle.style.width = `${size}px`
    circle.style.height = `${size}px`
    circle.style.top = `${y}px`
    circle.style.left = `${x}px`
    circle.style.position = 'absolute'
    circle.style.borderRadius = '50%'

    board.append(circle)
}

function getRandomNumber(min, max) {
    return Math.round(Math.random() * (max - min) + min)
}

function getRandomColor() {
    return colors[Math.floor(Math.random() * colors.length)]
}

renderHighScores()
