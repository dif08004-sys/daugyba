/* ==========================================================================
   MAGIŠKA DAUGYBA - LOGIKA IR INTERAKCIJOS
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // ------------------------------------------------------------------------
  // State Management
  // ------------------------------------------------------------------------
  const state = {
    soundEnabled: true,
    currentTab: 'practice',
    selectedTable: 'mix', // '1'...'10' or 'mix'
    practiceMode: 'choice', // 'choice' or 'keypad'
    streak: 0,
    currentQuestion: null,
    keypadInput: '',
    
    // Quiz State
    quiz: {
      active: false,
      includedNumbers: [2, 3, 4, 5, 6, 7, 8, 9, 10],
      totalQuestions: 10,
      currentStep: 0,
      score: 0,
      questions: [],
      userAnswers: []
    },

    // Badges / Achievements
    badges: {
      first_correct: { unlocked: false, name: 'Pirmasis Žingsnis 🌟', desc: 'Atlik 1 teisingą daugybą' },
      streak_5: { unlocked: false, name: 'Ugninis Skaičiuotojas 🔥', desc: 'Pasiek 5 teisingų atsakymų seriją' },
      streak_10: { unlocked: false, name: 'Daugybos Riteris ⚔️', desc: 'Pasiek 10 teisingų atsakymų seriją' },
      used_hint: { unlocked: false, name: 'Gudrusis Išradėjas 💡', desc: 'Pasinaudok užuomina' },
      quiz_master: { unlocked: false, name: 'Testo Meistras 🏆', desc: 'Surink 100% teste' },
      quiz_completed: { unlocked: false, name: 'Testo Čempionas 🏅', desc: 'Užbaik bet kurį žinių testą' }
    }
  };

  // Load saved badges from localStorage
  loadBadges();

  // ------------------------------------------------------------------------
  // Emojis for Visual Hints
  // ------------------------------------------------------------------------
  const hintEmojis = ['⭐️', '🍎', '🎈', '🐱', '🚀', '💎', '🎨', '🐶', '⚽️', '🍪'];

  // ------------------------------------------------------------------------
  // Pedagogical Multiplication Tricks Data
  // ------------------------------------------------------------------------
  const tricksData = {
    1: {
      title: 'Daugyba iš 1 (Veidrodis)',
      desc: 'Padauginus iš 1, skaičius išlieka visiškai toks pat! Skaičius lyg žiūrėtų į veidrodį.',
      example: '1 × 7 = 7  |  1 × 9 = 9'
    },
    2: {
      title: 'Daugyba iš 2 (Dvigubinimas)',
      desc: 'Tiesiog sudėk tą patį skaičių su pačiu savimi! (N + N)',
      example: '2 × 6 = 6 + 6 = 12'
    },
    3: {
      title: 'Daugyba iš 3 (Trigubinimas)',
      desc: 'Dvigubink skaičių ir pridėk jį dar vieną kartą!',
      example: '3 × 4 = (4 + 4) + 4 = 12'
    },
    4: {
      title: 'Daugyba iš 4 (Dvigubink dukart)',
      desc: 'Dvigubink skaičių du kartus iš eilės!',
      example: '4 × 6 ➔ 6 + 6 = 12 ➔ 12 + 12 = 24'
    },
    5: {
      title: 'Daugyba iš 5 (0 arba 5 pabaigoje)',
      desc: 'Atsakymas VISADA baigiasi 0 arba 5! Lyginiams skaičiams pabaigoje 0, nelyginiams - 5.',
      example: '5 × 4 = 20 (baigiasi 0) | 5 × 7 = 35 (baigiasi 5)'
    },
    6: {
      title: 'Daugyba iš 6 (5 + 1 grupė)',
      desc: 'Padaugink skaičių iš 5 ir pridėk dar vieną to skaičiaus kartą!',
      example: '6 × 4 = (5 × 4) + 4 = 20 + 4 = 24'
    },
    7: {
      title: 'Daugyba iš 7 (Išskaidymas)',
      desc: 'Išskaidyk 7 į 5 ir 2! Padaugink iš 5, padaugink iš 2 ir sudėk atsakymus.',
      example: '7 × 6 = (5 × 6) + (2 × 6) = 30 + 12 = 42'
    },
    8: {
      title: 'Daugyba iš 8 (Dvigubink 3 kartus)',
      desc: 'Dvigubink skaičių tris kartus iš eilės!',
      example: '8 × 3 ➔ 3+3=6 ➔ 6+6=12 ➔ 12+12=24'
    },
    9: {
      title: 'Daugyba iš 9 (Magiškas 10 - 1)',
      desc: 'Padaugink skaičių iš 10 ir atimk vieną skaičių! Arba naudok pirštų triuką.',
      example: '9 × 6 = (10 × 6) - 6 = 60 - 6 = 54'
    },
    10: {
      title: 'Daugyba iš 10 (Prirašyk Nulį)',
      desc: 'Tiesiog prirašyk skaičių 0 pabaigoje! Tai pats lengviausias triukas.',
      example: '10 × 8 = 80  |  10 × 5 = 50'
    }
  };

  // ------------------------------------------------------------------------
  // Audio Synthesizer (Web Audio API)
  // ------------------------------------------------------------------------
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  let audioCtx = null;

  function initAudio() {
    if (!audioCtx) {
      audioCtx = new AudioCtx();
    }
  }

  function playSound(type) {
    if (!state.soundEnabled) return;
    try {
      initAudio();
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === 'click') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.05);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === 'correct') {
        // Cheerful major arpeggio (C5 -> E5 -> G5 -> C6)
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, idx) => {
          const noteOsc = audioCtx.createOscillator();
          const noteGain = audioCtx.createGain();
          noteOsc.type = 'triangle';
          noteOsc.frequency.setValueAtTime(freq, now + idx * 0.08);
          noteGain.gain.setValueAtTime(0.25, now + idx * 0.08);
          noteGain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.25);
          noteOsc.connect(noteGain);
          noteGain.connect(audioCtx.destination);
          noteOsc.start(now + idx * 0.08);
          noteOsc.stop(now + idx * 0.08 + 0.25);
        });
      } else if (type === 'wrong') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.25);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'hint') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.15);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'fanfare') {
        const notes = [440, 554.37, 659.25, 880];
        notes.forEach((freq, idx) => {
          const noteOsc = audioCtx.createOscillator();
          const noteGain = audioCtx.createGain();
          noteOsc.type = 'square';
          noteOsc.frequency.setValueAtTime(freq, now + idx * 0.12);
          noteGain.gain.setValueAtTime(0.15, now + idx * 0.12);
          noteGain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.4);
          noteOsc.connect(noteGain);
          noteGain.connect(audioCtx.destination);
          noteOsc.start(now + idx * 0.12);
          noteOsc.stop(now + idx * 0.12 + 0.4);
        });
      }
    } catch (e) {
      console.log('Audio error:', e);
    }
  }

  // ------------------------------------------------------------------------
  // DOM Elements Initialization
  // ------------------------------------------------------------------------
  const soundToggleBtn = document.getElementById('soundToggleBtn');
  const soundIcon = document.getElementById('soundIcon');
  const navBtns = document.querySelectorAll('.nav-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  // Practice DOM
  const numberChipsContainer = document.getElementById('numberChips');
  const streakCount = document.getElementById('streakCount');
  const inputModeBtn = document.getElementById('inputModeBtn');
  const numAEl = document.getElementById('numA');
  const numBEl = document.getElementById('numB');
  const answerPlaceholder = document.getElementById('answerPlaceholder');
  const hintBtn = document.getElementById('hintBtn');
  const choiceOptions = document.getElementById('choiceOptions');
  const keypadArea = document.getElementById('keypadArea');
  const keypadDisplay = document.getElementById('keypadDisplay');
  const feedbackBox = document.getElementById('feedbackBox');
  const feedbackIcon = document.getElementById('feedbackIcon');
  const feedbackText = document.getElementById('feedbackText');
  const nextQuestionBtn = document.getElementById('nextQuestionBtn');

  // Hint Modal DOM
  const hintModal = document.getElementById('hintModal');
  const closeHintBtn = document.getElementById('closeHintBtn');
  const gotItBtn = document.getElementById('gotItBtn');
  const hintEqText = document.getElementById('hintEqText');
  const hintVisualGrid = document.getElementById('hintVisualGrid');
  const hintVisualDesc = document.getElementById('hintVisualDesc');
  const hintAdditionText = document.getElementById('hintAdditionText');
  const hintTrickText = document.getElementById('hintTrickText');

  // Quiz DOM
  const quizSelectorsGrid = document.getElementById('quizSelectorsGrid');
  const selectAllQuizBtn = document.getElementById('selectAllQuizBtn');
  const clearAllQuizBtn = document.getElementById('clearAllQuizBtn');
  const quizCountSelect = document.getElementById('quizCountSelect');
  const startQuizBtn = document.getElementById('startQuizBtn');
  const quizSetup = document.getElementById('quizSetup');
  const quizActive = document.getElementById('quizActive');
  const quizResults = document.getElementById('quizResults');
  const quizProgressBar = document.getElementById('quizProgressBar');
  const quizCurrentNum = document.getElementById('quizCurrentNum');
  const quizTotalNum = document.getElementById('quizTotalNum');
  const quizScoreCount = document.getElementById('quizScoreCount');
  const quizNumA = document.getElementById('quizNumA');
  const quizNumB = document.getElementById('quizNumB');
  const quizChoices = document.getElementById('quizChoices');
  const quizFeedback = document.getElementById('quizFeedback');
  const quizFeedbackText = document.getElementById('quizFeedbackText');

  // Quiz Results DOM
  const resultStars = document.getElementById('resultStars');
  const resultTitle = document.getElementById('resultTitle');
  const resultSubtitle = document.getElementById('resultSubtitle');
  const resCorrect = document.getElementById('resCorrect');
  const resAccuracy = document.getElementById('resAccuracy');
  const retryQuizBtn = document.getElementById('retryQuizBtn');
  const backToPracticeBtn = document.getElementById('backToPracticeBtn');

  // Other Tabs DOM
  const tricksGrid = document.getElementById('tricksGrid');
  const badgesGrid = document.getElementById('badgesGrid');

  // ------------------------------------------------------------------------
  // Navigation & Tab Switching
  // ------------------------------------------------------------------------
  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      playSound('click');
      const targetTab = btn.getAttribute('data-tab');
      switchTab(targetTab);
    });
  });

  function switchTab(tabName) {
    state.currentTab = tabName;
    navBtns.forEach(b => b.classList.toggle('active', b.getAttribute('data-tab') === tabName));
    tabContents.forEach(c => c.classList.toggle('active', c.id === `${tabName}Tab`));

    if (tabName === 'tricks') {
      renderTricks();
    } else if (tabName === 'achievements') {
      renderBadges();
    }
  }

  // Sound Toggle
  soundToggleBtn.addEventListener('click', () => {
    state.soundEnabled = !state.soundEnabled;
    soundIcon.textContent = state.soundEnabled ? '🔊' : '🔇';
    playSound('click');
  });

  // ------------------------------------------------------------------------
  // Practice Mode Initialization & Logic
  // ------------------------------------------------------------------------
  function initPracticeUI() {
    // Generate Number Chips (1 to 10 + Mix)
    numberChipsContainer.innerHTML = '';
    
    for (let i = 1; i <= 10; i++) {
      const chip = document.createElement('button');
      chip.className = `chip-btn ${state.selectedTable === String(i) ? 'active' : ''}`;
      chip.textContent = `× ${i}`;
      chip.addEventListener('click', () => {
        playSound('click');
        state.selectedTable = String(i);
        updateChipSelection();
        generatePracticeQuestion();
      });
      numberChipsContainer.appendChild(chip);
    }

    const mixChip = document.createElement('button');
    mixChip.className = `chip-btn ${state.selectedTable === 'mix' ? 'active' : ''}`;
    mixChip.textContent = '🌟 Visi skaičiai';
    mixChip.addEventListener('click', () => {
      playSound('click');
      state.selectedTable = 'mix';
      updateChipSelection();
      generatePracticeQuestion();
    });
    numberChipsContainer.appendChild(mixChip);

    // Toggle Input Mode (Choice vs Keypad)
    inputModeBtn.addEventListener('click', () => {
      playSound('click');
      if (state.practiceMode === 'choice') {
        state.practiceMode = 'keypad';
        inputModeBtn.textContent = 'Režimas: Pasirinkimas';
        choiceOptions.classList.add('hidden');
        keypadArea.classList.remove('hidden');
      } else {
        state.practiceMode = 'choice';
        inputModeBtn.textContent = 'Režimas: Klaviatūra';
        choiceOptions.classList.remove('hidden');
        keypadArea.classList.add('hidden');
      }
    });

    // Keypad Logic
    document.querySelectorAll('.key-btn').forEach(key => {
      key.addEventListener('click', () => {
        playSound('click');
        const val = key.getAttribute('data-val');
        if (val === 'clear') {
          state.keypadInput = '';
        } else if (val === null && key.id === 'keypadSubmit') {
          submitKeypadAnswer();
          return;
        } else {
          if (state.keypadInput.length < 3) {
            state.keypadInput += val;
          }
        }
        keypadDisplay.textContent = state.keypadInput || '--';
      });
    });

    document.getElementById('keypadSubmit').addEventListener('click', () => {
      submitKeypadAnswer();
    });

    nextQuestionBtn.addEventListener('click', () => {
      playSound('click');
      generatePracticeQuestion();
    });

    generatePracticeQuestion();
  }

  function updateChipSelection() {
    const chips = numberChipsContainer.querySelectorAll('.chip-btn');
    chips.forEach(chip => {
      const isMix = chip.textContent.includes('Visi') && state.selectedTable === 'mix';
      const isNum = chip.textContent === `× ${state.selectedTable}`;
      chip.classList.toggle('active', isMix || isNum);
    });
  }

  function generatePracticeQuestion() {
    feedbackBox.classList.add('hidden');
    answerPlaceholder.textContent = '?';
    state.keypadInput = '';
    keypadDisplay.textContent = '--';

    let numA, numB;
    if (state.selectedTable === 'mix') {
      numA = Math.floor(Math.random() * 10) + 1;
    } else {
      numA = parseInt(state.selectedTable, 10);
    }
    numB = Math.floor(Math.random() * 10) + 1;

    state.currentQuestion = {
      numA,
      numB,
      answer: numA * numB
    };

    numAEl.textContent = numA;
    numBEl.textContent = numB;

    renderChoiceOptions();
  }

  function renderChoiceOptions() {
    choiceOptions.innerHTML = '';
    const correctAnswer = state.currentQuestion.answer;
    
    // Generate 3 plausible distractors
    const optionsSet = new Set([correctAnswer]);
    while (optionsSet.size < 4) {
      let offset = (Math.floor(Math.random() * 5) + 1) * (Math.random() > 0.5 ? 1 : -1);
      let distractor = correctAnswer + offset;
      if (distractor > 0 && distractor !== correctAnswer) {
        optionsSet.add(distractor);
      }
    }

    const options = Array.from(optionsSet).sort(() => Math.random() - 0.5);

    options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'opt-btn';
      btn.textContent = opt;
      btn.addEventListener('click', () => handlePracticeAnswer(opt, btn));
      choiceOptions.appendChild(btn);
    });
  }

  function handlePracticeAnswer(selectedVal, btnElement) {
    const correctVal = state.currentQuestion.answer;

    if (selectedVal === correctVal) {
      playSound('correct');
      if (btnElement) btnElement.classList.add('correct');
      answerPlaceholder.textContent = correctVal;
      
      // Update streak
      state.streak++;
      streakCount.textContent = state.streak;

      // Check Badges
      unlockBadge('first_correct');
      if (state.streak >= 5) unlockBadge('streak_5');
      if (state.streak >= 10) unlockBadge('streak_10');

      feedbackIcon.textContent = getRandomCheerEmoji();
      feedbackText.textContent = getRandomCheerText();
      feedbackBox.classList.remove('hidden');

      // Disable choice buttons until next
      const optBtns = choiceOptions.querySelectorAll('.opt-btn');
      optBtns.forEach(b => b.disabled = true);
    } else {
      playSound('wrong');
      if (btnElement) btnElement.classList.add('wrong');
      state.streak = 0;
      streakCount.textContent = state.streak;
    }
  }

  function submitKeypadAnswer() {
    if (!state.keypadInput) return;
    const val = parseInt(state.keypadInput, 10);
    handlePracticeAnswer(val, null);
  }

  function getRandomCheerEmoji() {
    const emojis = ['🎉', '🌟', '🚀', '👏', '🦁', '👑', '🌈', '🔥'];
    return emojis[Math.floor(Math.random() * emojis.length)];
  }

  function getRandomCheerText() {
    const texts = [
      'Teisingai! Šaunuolis!',
      'Puikus darbas! Taip ir toliau!',
      'Galingas skaičiuotojas!',
      'Tikras daugybos čempionas!',
      'Nuostabu! Eini labai greitai!'
    ];
    return texts[Math.floor(Math.random() * texts.length)];
  }

  // ------------------------------------------------------------------------
  // Hint System Logic
  // ------------------------------------------------------------------------
  hintBtn.addEventListener('click', () => {
    playSound('hint');
    showHintModal(state.currentQuestion.numA, state.currentQuestion.numB);
    unlockBadge('used_hint');
  });

  closeHintBtn.addEventListener('click', hideHintModal);
  gotItBtn.addEventListener('click', hideHintModal);
  hintModal.addEventListener('click', (e) => {
    if (e.target === hintModal) hideHintModal();
  });

  function showHintModal(a, b) {
    hintEqText.textContent = `${a} × ${b}`;

    // Section 1: Visual Grid (b rows of a items)
    hintVisualGrid.innerHTML = '';
    const randomEmoji = hintEmojis[(a + b) % hintEmojis.length];

    for (let r = 0; r < b; r++) {
      const rowDiv = document.createElement('div');
      rowDiv.className = 'visual-row';
      for (let c = 0; c < a; c++) {
        const span = document.createElement('span');
        span.textContent = randomEmoji;
        rowDiv.appendChild(span);
      }
      hintVisualGrid.appendChild(rowDiv);
    }
    hintVisualDesc.textContent = `${b} eilutės po ${a} ${randomEmoji}`;

    // Section 2: Repeated Addition
    const additionParts = Array(b).fill(a);
    hintAdditionText.textContent = `${additionParts.join(' + ')}`;

    // Section 3: Smart Trick
    const mainNum = tricksData[a] ? a : (tricksData[b] ? b : null);
    if (mainNum && tricksData[mainNum]) {
      hintTrickText.textContent = tricksData[mainNum].desc;
    } else {
      hintTrickText.textContent = `Dauginant ${a} × ${b}, sudėk skaičių ${a} net ${b} kartų!`;
    }

    hintModal.classList.remove('hidden');
  }

  function hideHintModal() {
    hintModal.classList.add('hidden');
  }

  // ------------------------------------------------------------------------
  // Quiz Mode Logic
  // ------------------------------------------------------------------------
  function initQuizUI() {
    // Generate Checkboxes for numbers 1..10
    quizSelectorsGrid.innerHTML = '';
    for (let i = 1; i <= 10; i++) {
      const box = document.createElement('label');
      box.className = 'quiz-num-box';
      const isChecked = state.quiz.includedNumbers.includes(i);
      box.innerHTML = `
        <input type="checkbox" value="${i}" ${isChecked ? 'checked' : ''}>
        <span>× ${i}</span>
      `;
      box.querySelector('input').addEventListener('change', (e) => {
        const val = parseInt(e.target.value, 10);
        if (e.target.checked) {
          if (!state.quiz.includedNumbers.includes(val)) state.quiz.includedNumbers.push(val);
        } else {
          state.quiz.includedNumbers = state.quiz.includedNumbers.filter(n => n !== val);
        }
      });
      quizSelectorsGrid.appendChild(box);
    }

    selectAllQuizBtn.addEventListener('click', () => {
      playSound('click');
      state.quiz.includedNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      quizSelectorsGrid.querySelectorAll('input').forEach(cb => cb.checked = true);
    });

    clearAllQuizBtn.addEventListener('click', () => {
      playSound('click');
      state.quiz.includedNumbers = [2]; // keep at least 2
      quizSelectorsGrid.querySelectorAll('input').forEach(cb => {
        cb.checked = (cb.value === '2');
      });
    });

    startQuizBtn.addEventListener('click', startQuiz);
    retryQuizBtn.addEventListener('click', () => {
      quizResults.classList.add('hidden');
      quizSetup.classList.remove('hidden');
    });
    backToPracticeBtn.addEventListener('click', () => {
      switchTab('practice');
    });
  }

  function startQuiz() {
    playSound('click');
    if (state.quiz.includedNumbers.length === 0) {
      alert('Prašome pasirinkti bent vieną skaičių daugybai!');
      return;
    }

    state.quiz.totalQuestions = parseInt(quizCountSelect.value, 10);
    state.quiz.currentStep = 0;
    state.quiz.score = 0;
    state.quiz.questions = [];
    state.quiz.userAnswers = [];

    // Generate random questions based on selection
    for (let i = 0; i < state.quiz.totalQuestions; i++) {
      const a = state.quiz.includedNumbers[Math.floor(Math.random() * state.quiz.includedNumbers.length)];
      const b = Math.floor(Math.random() * 10) + 1;
      state.quiz.questions.push({ a, b, answer: a * b });
    }

    quizSetup.classList.add('hidden');
    quizResults.classList.add('hidden');
    quizActive.classList.remove('hidden');

    renderQuizQuestion();
  }

  function renderQuizQuestion() {
    quizFeedback.classList.add('hidden');
    const step = state.quiz.currentStep;
    const total = state.quiz.totalQuestions;
    const q = state.quiz.questions[step];

    quizCurrentNum.textContent = step + 1;
    quizTotalNum.textContent = total;
    quizScoreCount.textContent = state.quiz.score;
    quizProgressBar.style.width = `${((step) / total) * 100}%`;

    quizNumA.textContent = q.a;
    quizNumB.textContent = q.b;

    // Options
    quizChoices.innerHTML = '';
    const optionsSet = new Set([q.answer]);
    while (optionsSet.size < 4) {
      let offset = (Math.floor(Math.random() * 5) + 1) * (Math.random() > 0.5 ? 1 : -1);
      let distractor = q.answer + offset;
      if (distractor > 0 && distractor !== q.answer) optionsSet.add(distractor);
    }
    const options = Array.from(optionsSet).sort(() => Math.random() - 0.5);

    options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'opt-btn';
      btn.textContent = opt;
      btn.addEventListener('click', () => handleQuizAnswer(opt, btn));
      quizChoices.appendChild(btn);
    });
  }

  function handleQuizAnswer(selectedVal, btnElement) {
    const step = state.quiz.currentStep;
    const q = state.quiz.questions[step];
    const isCorrect = (selectedVal === q.answer);

    const optBtns = quizChoices.querySelectorAll('.opt-btn');
    optBtns.forEach(b => b.disabled = true);

    if (isCorrect) {
      playSound('correct');
      if (btnElement) btnElement.classList.add('correct');
      state.quiz.score++;
    } else {
      playSound('wrong');
      if (btnElement) btnElement.classList.add('wrong');
      // Highlight the correct one
      optBtns.forEach(b => {
        if (parseInt(b.textContent, 10) === q.answer) b.classList.add('correct');
      });
    }

    state.quiz.userAnswers.push({ question: q, userAns: selectedVal, isCorrect });

    setTimeout(() => {
      state.quiz.currentStep++;
      if (state.quiz.currentStep < state.quiz.totalQuestions) {
        renderQuizQuestion();
      } else {
        finishQuiz();
      }
    }, 1200);
  }

  function finishQuiz() {
    quizActive.classList.add('hidden');
    quizResults.classList.remove('hidden');

    const score = state.quiz.score;
    const total = state.quiz.totalQuestions;
    const percent = Math.round((score / total) * 100);

    resCorrect.textContent = `${score} / ${total}`;
    resAccuracy.textContent = `${percent}%`;

    unlockBadge('quiz_completed');
    if (percent === 100) {
      unlockBadge('quiz_master');
    }

    if (percent >= 90) {
      resultStars.textContent = '⭐⭐⭐';
      resultTitle.textContent = 'Nuostabus Daugybos Meistras!';
      resultSubtitle.textContent = 'Surinkai beveik visus taškus! Tu genialus!';
      playSound('fanfare');
      triggerConfetti();
    } else if (percent >= 70) {
      resultStars.textContent = '⭐⭐';
      resultTitle.textContent = 'Labai geras rezultatas!';
      resultSubtitle.textContent = 'Nedaug trūko iki maksimalaus įvertinimo!';
      playSound('correct');
    } else {
      resultStars.textContent = '⭐';
      resultTitle.textContent = 'Geras bandymas!';
      resultSubtitle.textContent = 'Šiek tiek pasipraktikuok mokymosi režime ir pabandyk vėl!';
      playSound('click');
    }
  }

  // ------------------------------------------------------------------------
  // Render Tricks Tab
  // ------------------------------------------------------------------------
  function renderTricks() {
    tricksGrid.innerHTML = '';
    for (let i = 1; i <= 10; i++) {
      const data = tricksData[i];
      if (!data) continue;

      const card = document.createElement('div');
      card.className = 'trick-card';
      card.innerHTML = `
        <div class="trick-card-num">
          <span>⚡</span> × ${i}
        </div>
        <div class="trick-card-title">${data.title}</div>
        <div class="trick-card-desc">${data.desc}</div>
        <div class="trick-example">Pavyzdys: ${data.example}</div>
      `;
      tricksGrid.appendChild(card);
    }
  }

  // ------------------------------------------------------------------------
  // Render Badges & Achievements Tab
  // ------------------------------------------------------------------------
  function renderBadges() {
    badgesGrid.innerHTML = '';
    Object.keys(state.badges).forEach(key => {
      const badge = state.badges[key];
      const card = document.createElement('div');
      card.className = `badge-card ${badge.unlocked ? 'unlocked' : ''}`;
      
      let icon = '🔒';
      if (key === 'first_correct') icon = '🌟';
      if (key === 'streak_5') icon = '🔥';
      if (key === 'streak_10') icon = '⚔️';
      if (key === 'used_hint') icon = '💡';
      if (key === 'quiz_master') icon = '🏆';
      if (key === 'quiz_completed') icon = '🏅';

      card.innerHTML = `
        <div class="badge-icon">${badge.unlocked ? icon : '🔒'}</div>
        <div class="badge-name">${badge.name}</div>
        <div class="badge-desc">${badge.desc}</div>
      `;
      badgesGrid.appendChild(card);
    });
  }

  function unlockBadge(key) {
    if (state.badges[key] && !state.badges[key].unlocked) {
      state.badges[key].unlocked = true;
      saveBadges();
    }
  }

  function saveBadges() {
    try {
      localStorage.setItem('daugyba_badges', JSON.stringify(state.badges));
    } catch (e) {}
  }

  function loadBadges() {
    try {
      const saved = localStorage.getItem('daugyba_badges');
      if (saved) {
        const parsed = JSON.parse(saved);
        Object.keys(parsed).forEach(k => {
          if (state.badges[k]) state.badges[k].unlocked = parsed[k].unlocked;
        });
      }
    } catch (e) {}
  }

  // ------------------------------------------------------------------------
  // Procedural Canvas Confetti Effect
  // ------------------------------------------------------------------------
  const canvas = document.getElementById('confettiCanvas');
  const ctx = canvas.getContext('2d');
  let confettiParticles = [];
  let confettiAnimationId = null;

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  function triggerConfetti() {
    confettiParticles = [];
    const colors = ['#6C5CE7', '#FF7675', '#FDCB6E', '#55E6C1', '#74B9FF'];
    for (let i = 0; i < 120; i++) {
      confettiParticles.push({
        x: canvas.width / 2,
        y: canvas.height / 2,
        vx: (Math.random() - 0.5) * 16,
        vy: (Math.random() - 0.8) * 16,
        size: Math.random() * 10 + 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rSpeed: (Math.random() - 0.5) * 10,
        opacity: 1
      });
    }

    if (confettiAnimationId) cancelAnimationFrame(confettiAnimationId);
    animateConfetti();
  }

  function animateConfetti() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let activeParticles = 0;

    confettiParticles.forEach(p => {
      if (p.opacity > 0) {
        activeParticles++;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.3; // gravity
        p.rotation += p.rSpeed;
        p.opacity -= 0.008;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      }
    });

    if (activeParticles > 0) {
      confettiAnimationId = requestAnimationFrame(animateConfetti);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  // Initialize App
  initPracticeUI();
  initQuizUI();
});
