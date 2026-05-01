import { TOPICS } from './topics.js';

const TOTAL_ROUNDS = 3;
const DEFAULT_PAIRS_PER_ROUND = 8;
const BOARD_GAP = 12;
const MIN_CARD_WIDTH_DESKTOP = 95;
const MIN_CARD_WIDTH_MOBILE = 78;
const WRONG_PAIR_DELAY = 1200;

let currentTopic = null;
let PAIRS = [];
let PAIRS_PER_ROUND = DEFAULT_PAIRS_PER_ROUND;
let CARDS_PER_ROUND = PAIRS_PER_ROUND * 2;

let currentRound = 1;
let roundDeck = [];
let selectedCards = [];
let lockBoard = false;
let matchedPairsInRound = 0;
let attemptsInRound = 0;
let totalErrors = 0;
let gameStarted = false;
const errorCountByPair = {};

const board = document.getElementById('board');
const pageTitle = document.getElementById('pageTitle');
const boardTitle = document.getElementById('boardTitle');
const topicLabel = document.getElementById('topicLabel');
const roundLabel = document.getElementById('roundLabel');
const matchLabel = document.getElementById('matchLabel');
const errorLabel = document.getElementById('errorLabel');
const messageBox = document.getElementById('messageBox');
const roundHint = document.getElementById('roundHint');
const resultBox = document.getElementById('resultBox');
const reviewContainer = document.getElementById('reviewContainer');
const summaryText = document.getElementById('summaryText');
const headerDescription = document.getElementById('headerDescription');
const startBtn = document.getElementById('startBtn');
const nextBtn = document.getElementById('nextBtn');
const backBtn = document.getElementById('backBtn');
const topicsCountBadge = document.getElementById('topicsCountBadge');

topicsCountBadge.textContent = `${TOPICS.length} tópicos disponíveis`;

startBtn.addEventListener('click', startGame);
nextBtn.addEventListener('click', goToNextRound);
backBtn.addEventListener('click', goToTopicSelection);
window.addEventListener('resize', updateBoardLayout);

renderTopicSelection();
updateHUD();

function renderTopicSelection() {
  gameStarted = false;
  currentTopic = null;
  pageTitle.textContent = 'Jogo da Memória — Matemática';
  headerDescription.textContent = 'Escolha um tópico para começar. Cada tema possui seu próprio conjunto de cards e mantém a mesma dinâmica do jogo.';
  topicLabel.textContent = 'Selecione';
  boardTitle.textContent = 'Tópicos disponíveis';
  roundHint.textContent = 'Clique em um tópico para carregar o jogo.';
  messageBox.innerHTML = `
    <strong>Como funciona:</strong> primeiro escolha um tópico. Depois, o jogo exibirá os cards desse conteúdo em 3 rodadas, mostrando ao final os conceitos com mais erros para revisão.
    <div class="legend">
      <span class="badge">${TOPICS.length} tópicos disponíveis</span>
      <span class="badge ok">Seleção por cards</span>
      <span class="badge bad">Revisão ao final</span>
    </div>
  `;
  resultBox.classList.remove('show');
  reviewContainer.innerHTML = '';
  summaryText.textContent = '';
  startBtn.classList.add('hidden');
  nextBtn.classList.add('hidden');
  backBtn.classList.add('hidden');
  board.innerHTML = '';
  board.style.removeProperty('--board-cols');
  board.style.setProperty('--board-cols', Math.min(TOPICS.length, 3));
  TOPICS.forEach(topic => {
    const btn = document.createElement('button');
    btn.className = 'topic-card';
    btn.innerHTML = `
      <div>
        <h3>${escapeHtml(topic.title)}</h3>
        <p>${escapeHtml(topic.description)}</p>
      </div>
      <div class="topic-meta">
        <span class="topic-tag">${topic.cards.length} cards no banco</span>
        <span class="topic-tag">${topic.pairsPerRound ?? DEFAULT_PAIRS_PER_ROUND} pares por rodada</span>
      </div>
    `;
    btn.addEventListener('click', () => selectTopic(topic.id));
    board.appendChild(btn);
  });
}

function selectTopic(topicId) {
  const topic = TOPICS.find(t => t.id === topicId);
  if (!topic) return;

  currentTopic = topic;
  PAIRS = topic.cards.map(pair => ({ ...pair }));
  PAIRS_PER_ROUND = topic.pairsPerRound ?? DEFAULT_PAIRS_PER_ROUND;
  CARDS_PER_ROUND = PAIRS_PER_ROUND * 2;

  pageTitle.textContent = `Jogo da Memória — ${topic.title}`;
  headerDescription.innerHTML = `
    Encontre os pares corretos entre conceito e aplicação. Cada partida tem <strong>${TOTAL_ROUNDS} rodadas</strong>. Em cada rodada aparecem <strong>${CARDS_PER_ROUND} cards aleatórios</strong> (${PAIRS_PER_ROUND} pares), escolhidos do banco deste tópico.
  `;
  topicLabel.textContent = topic.title;
  boardTitle.textContent = 'Tabuleiro';
  roundHint.textContent = `Tópico carregado: ${topic.title}. Clique em "Iniciar / Reiniciar Jogo".`;
  messageBox.innerHTML = `
    <strong>Tópico selecionado:</strong> ${escapeHtml(topic.title)}.<br>
    ${escapeHtml(topic.description)}
    <div class="legend">
      <span class="badge">${CARDS_PER_ROUND} cartas por rodada</span>
      <span class="badge ok">${TOTAL_ROUNDS} rodadas</span>
      <span class="badge bad">Top 3 para revisão</span>
    </div>
  `;
  startBtn.classList.remove('hidden');
  nextBtn.classList.remove('hidden');
  backBtn.classList.remove('hidden');
  nextBtn.disabled = true;
  resultBox.classList.remove('show');
  reviewContainer.innerHTML = '';
  summaryText.textContent = '';
  board.innerHTML = '';
  updateHUD();
}

function resetCounters() {
  currentRound = 1;
  selectedCards = [];
  lockBoard = false;
  matchedPairsInRound = 0;
  attemptsInRound = 0;
  totalErrors = 0;
  gameStarted = true;
  Object.keys(errorCountByPair).forEach(key => delete errorCountByPair[key]);
  PAIRS.forEach(pair => errorCountByPair[pair.id] = 0);
  resultBox.classList.remove('show');
  reviewContainer.innerHTML = '';
  summaryText.textContent = '';
  nextBtn.disabled = true;
  updateHUD();
}

function updateHUD() {
  roundLabel.textContent = `${currentRound} / ${TOTAL_ROUNDS}`;
  matchLabel.textContent = `${matchedPairsInRound} / ${PAIRS_PER_ROUND}`;
  errorLabel.textContent = `${totalErrors}`;
}

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function createRoundDeck() {
  const chosenPairs = shuffle(PAIRS).slice(0, PAIRS_PER_ROUND);
  const cards = [];
  chosenPairs.forEach(pair => {
    cards.push({ uid: cryptoRandomId(), pairId: pair.id, text: pair.a });
    cards.push({ uid: cryptoRandomId(), pairId: pair.id, text: pair.b });
  });
  return shuffle(cards);
}

function cryptoRandomId() {
  return Math.random().toString(36).slice(2, 11) + Date.now().toString(36).slice(-4);
}

function getDivisors(n) {
  const divisors = [];
  for (let i = 1; i <= Math.sqrt(n); i++) {
    if (n % i === 0) {
      divisors.push(i);
      if (i !== n / i) divisors.push(n / i);
    }
  }
  return divisors.sort((a, b) => a - b);
}

function chooseBestColumns(totalCards) {
  if (totalCards <= 0) return 1;

  const boardWidth = board.clientWidth || board.parentElement?.clientWidth || window.innerWidth || 800;
  const boardTop = board.getBoundingClientRect().top;
  const availableHeight = Math.max(180, window.innerHeight - boardTop - 24);
  const isMobile = window.innerWidth <= 640;
  const minCardWidth = isMobile ? MIN_CARD_WIDTH_MOBILE : MIN_CARD_WIDTH_DESKTOP;
  const cardAspect = isMobile ? (1 / 0.9) : 1;

  const maxColsByWidth = Math.max(
    1,
    Math.floor((boardWidth + BOARD_GAP) / (minCardWidth + BOARD_GAP))
  );

  const divisors = getDivisors(totalCards)
    .filter(cols => cols <= maxColsByWidth)
    .sort((a, b) => b - a);

  if (divisors.length === 0) return 1;

  let bestFit = null;
  let bestOverflow = null;

  for (const cols of divisors) {
    const rows = totalCards / cols;
    const cardWidth = (boardWidth - (cols - 1) * BOARD_GAP) / cols;
    const cardHeight = cardWidth / cardAspect;
    const totalGridHeight = rows * cardHeight + (rows - 1) * BOARD_GAP;
    const fits = totalGridHeight <= availableHeight;
    const candidate = { cols, rows, cardWidth, totalGridHeight };

    if (fits) {
      if (!bestFit || candidate.cardWidth > bestFit.cardWidth || (Math.abs(candidate.cardWidth - bestFit.cardWidth) < 0.01 && candidate.cols > bestFit.cols)) {
        bestFit = candidate;
      }
    } else {
      const overflow = totalGridHeight - availableHeight;
      if (!bestOverflow || overflow < bestOverflow.overflow || (Math.abs(overflow - bestOverflow.overflow) < 0.01 && candidate.cols > bestOverflow.cols)) {
        bestOverflow = { ...candidate, overflow };
      }
    }
  }

  if (bestFit) return bestFit.cols;
  return bestOverflow ? bestOverflow.cols : divisors[0];
}

function updateBoardLayout() {
  const totalCards = roundDeck.length || CARDS_PER_ROUND || TOPICS.length;
  const cols = chooseBestColumns(totalCards);
  board.style.setProperty('--board-cols', cols);
}

function startGame() {
  if (!currentTopic) return;
  resetCounters();
  messageBox.innerHTML = `
    <strong>Partida iniciada!</strong> Encontre os pares corretos do tópico <strong>${escapeHtml(currentTopic.title)}</strong>.
    Ao terminar cada rodada, clique em <strong>Próxima Rodada</strong>.
    <div class="legend">
      <span class="badge">Rodada 1 pronta</span>
      <span class="badge ok">${PAIRS_PER_ROUND} pares no tabuleiro</span>
      <span class="badge bad">Atenção aos conceitos</span>
    </div>
  `;
  roundHint.textContent = `Rodada 1: encontre os ${PAIRS_PER_ROUND} pares.`;
  loadRound();
}

function loadRound() {
  selectedCards = [];
  lockBoard = false;
  matchedPairsInRound = 0;
  attemptsInRound = 0;
  nextBtn.disabled = true;

  roundDeck = createRoundDeck();
  renderGameBoard();
  updateBoardLayout();
  updateHUD();
}

function renderGameBoard() {
  board.innerHTML = '';
  roundDeck.forEach(cardData => {
    const btn = document.createElement('button');
    btn.className = 'card';
    btn.setAttribute('data-uid', cardData.uid);
    btn.setAttribute('data-pair-id', cardData.pairId);
    btn.setAttribute('aria-label', 'Carta do jogo da memória');
    btn.innerHTML = `
      <div class="card-inner">
        <div class="card-face card-front">?</div>
        <div class="card-face card-back">${escapeHtml(cardData.text)}</div>
      </div>
    `;
    btn.addEventListener('click', () => handleCardClick(btn, cardData));
    board.appendChild(btn);
  });
}

function handleCardClick(cardElement, cardData) {
  if (!gameStarted || lockBoard) return;
  if (cardElement.classList.contains('flipped') || cardElement.classList.contains('matched')) return;

  cardElement.classList.add('flipped');
  selectedCards.push({ element: cardElement, data: cardData });

  if (selectedCards.length < 2) return;

  lockBoard = true;
  attemptsInRound++;
  const [first, second] = selectedCards;

  if (first.data.pairId === second.data.pairId && first.data.uid !== second.data.uid) {
    setTimeout(() => {
      first.element.classList.add('matched');
      second.element.classList.add('matched');
      matchedPairsInRound++;
      selectedCards = [];
      lockBoard = false;
      updateHUD();
      checkRoundCompletion();
    }, 350);
  } else {
    totalErrors++;
    errorCountByPair[first.data.pairId] += 1;
    errorCountByPair[second.data.pairId] += 1;
    updateHUD();

    setTimeout(() => {
      first.element.classList.remove('flipped');
      second.element.classList.remove('flipped');
      selectedCards = [];
      lockBoard = false;
    }, WRONG_PAIR_DELAY);
  }
}

function checkRoundCompletion() {
  if (matchedPairsInRound === PAIRS_PER_ROUND) {
    if (currentRound < TOTAL_ROUNDS) {
      nextBtn.disabled = false;
      roundHint.textContent = `Rodada ${currentRound} concluída! Clique em "Próxima Rodada".`;
      messageBox.innerHTML = `
        <strong>Parabéns!</strong> Você concluiu a rodada ${currentRound} do tópico <strong>${escapeHtml(currentTopic.title)}</strong>.
        <div class="legend">
          <span class="badge ok">Rodada concluída</span>
          <span class="badge">Tentativas: ${attemptsInRound}</span>
          <span class="badge bad">Erros acumulados: ${totalErrors}</span>
        </div>
      `;
    } else {
      finishGame();
    }
  }
}

function goToNextRound() {
  if (currentRound >= TOTAL_ROUNDS) return;
  currentRound++;
  roundHint.textContent = `Rodada ${currentRound}: encontre os ${PAIRS_PER_ROUND} pares.`;
  messageBox.innerHTML = `
    <strong>Nova rodada!</strong> O tabuleiro foi renovado com ${CARDS_PER_ROUND} cartas aleatórias.
    <div class="legend">
      <span class="badge">Rodada ${currentRound}</span>
      <span class="badge ok">${PAIRS_PER_ROUND} pares novos sorteados</span>
    </div>
  `;
  loadRound();
}

function finishGame() {
  roundHint.textContent = 'Partida encerrada.';
  nextBtn.disabled = true;

  const ranked = PAIRS
    .map(pair => ({ ...pair, errors: errorCountByPair[pair.id] || 0 }))
    .sort((a, b) => b.errors - a.errors);

  const top3 = ranked.filter(item => item.errors > 0).slice(0, 3);

  resultBox.classList.add('show');
  summaryText.innerHTML = `
    Você terminou as <strong>${TOTAL_ROUNDS} rodadas</strong> do tópico <strong>${escapeHtml(currentTopic.title)}</strong> com
    <strong>${totalErrors} erro(s)</strong> acumulado(s).
  `;

  if (top3.length === 0) {
    reviewContainer.innerHTML = `
      <div class="message">
        <strong>Excelente!</strong> Você não teve erros registrados nesta partida.
      </div>
    `;
  } else {
    reviewContainer.innerHTML = `
      <div class="review-list">
        ${top3.map((item, index) => `
          <div class="review-card">
            <h3>${index + 1}º conceito para revisar</h3>
            <div class="count">Erros envolvendo este par: ${item.errors}</div>
            <div class="review-pair">
              <div class="review-item">${escapeHtml(item.a)}</div>
              <div class="review-item">${escapeHtml(item.b)}</div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  messageBox.innerHTML = `
    <strong>Fim da partida!</strong> Role a página para ver os cartões/conceitos que mais precisaram de revisão.
    <div class="legend">
      <span class="badge ok">${TOTAL_ROUNDS} rodadas concluídas</span>
      <span class="badge bad">Erros totais: ${totalErrors}</span>
    </div>
  `;
}

function goToTopicSelection() {
  roundDeck = [];
  selectedCards = [];
  lockBoard = false;
  matchedPairsInRound = 0;
  attemptsInRound = 0;
  totalErrors = 0;
  currentRound = 1;
  updateHUD();
  renderTopicSelection();
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
