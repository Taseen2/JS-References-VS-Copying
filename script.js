/**
 * Utility to play a beep sound for user feedback
 * @param {number} freq - Frequency of the sound
 * @param {string} type - Oscillator type (sine, square, sawtooth, triangle)
 * @param {number} duration - Duration of the sound in seconds
 */
function playBeep(freq = 440, type = 'sine', duration = 0.1) {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc.start();
    gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {
    // Ignore if audio fails or is blocked
  }
}

/**
 * Global application state
 * orig: The original object we're experimenting with
 * copy: The variable that will hold our copy/reference
 * copyType: Type of copy operation performed (none, ref, shallow, deep)
 */
let state = {
  orig: { name: "Hero", stats: { level: 1 } },
  copy: null,
  copyType: 'none'
};

let dom; // Holds references to DOM elements
let onStateChangeCallback = null; // Callback for when the state changes

/**
 * Initializes the Interactive Playground
 * Sets up event listeners for mutation and copying buttons
 */
function initPlayground(onStateChange) {
  onStateChangeCallback = onStateChange;
  dom = {
    origName: document.getElementById('orig-name'),
    origLevel: document.getElementById('orig-level'),
    copyName: document.getElementById('copy-name'),
    copyLevel: document.getElementById('copy-level'),
    copyCodeActive: document.getElementById('copy-code-active'),
    copyCodeBlock: document.getElementById('copy-code-block'),
    copyBadge: document.getElementById('copy-badge'),
    btnRef: document.getElementById('btn-ref'),
    btnShallow: document.getElementById('btn-shallow'),
    btnDeep: document.getElementById('btn-deep'),
    mutCopyBtns: document.querySelectorAll('#mut-copy-name, #mut-copy-level')
  };

  // 🔗 Reference Copy: copy points to the same memory as original
  document.getElementById('btn-ref').addEventListener('click', () => {
    state.copyType = 'ref';
    state.copy = state.orig;
    updateUI();
    playBeep(600, 'sine', 0.1);
  });

  // 🌊 Shallow Copy: top-level is new, nested objects are still references
  document.getElementById('btn-shallow').addEventListener('click', () => {
    state.copyType = 'shallow';
    state.copy = { ...state.orig };
    updateUI();
    playBeep(800, 'sine', 0.1);
  });

  // 🧱 Deep Copy: brand new object with no shared references
  document.getElementById('btn-deep').addEventListener('click', () => {
    state.copyType = 'deep';
    state.copy = structuredClone(state.orig);
    updateUI();
    playBeep(1000, 'sine', 0.1);
  });

  document.getElementById('btn-reset').addEventListener('click', resetPlayground);

  // Mutate Original: Changing a primitive (name) vs an object property (stats.level)
  document.getElementById('mut-orig-name').addEventListener('click', () => {
    state.orig.name = state.orig.name === "Hero" ? "Villain" : "Hero";
    updateUI(true);
    playBeep(300, 'square', 0.05);
  });

  document.getElementById('mut-orig-level').addEventListener('click', () => {
    state.orig.stats.level += 1;
    updateUI(true);
    playBeep(300, 'square', 0.05);
  });

  // Mutate Copy: Demonstrates how changes to 'copy' might affect 'original'
  document.getElementById('mut-copy-name').addEventListener('click', () => {
    if (!state.copy) return;
    state.copy.name = state.copy.name === "Helper" ? "Sidekick" : "Helper";
    updateUI(true);
    playBeep(400, 'square', 0.05);
  });

  document.getElementById('mut-copy-level').addEventListener('click', () => {
    if (!state.copy) return;
    state.copy.stats.level += 1;
    updateUI(true);
    playBeep(400, 'square', 0.05);
  });

  renderPlayground();
}

/**
 * Resets the application to its starting state
 */
function resetPlayground() {
  state.orig = { name: "Hero", stats: { level: 1 } };
  state.copy = null;
  state.copyType = 'none';
  playBeep(200, 'sawtooth', 0.2);
  updateUI();
}

/**
 * Updates a DOM node with a new value and triggers a CSS animation
 */
function updateNodeInfo(node, newValue) {
  if (node.textContent !== String(newValue)) {
    node.textContent = newValue;
    node.classList.remove('glow-update');
    void node.offsetWidth; // Trigger reflow for animation restart
    node.classList.add('glow-update');
  }
}

/**
 * Renders the state into the Playground UI
 */
function renderPlayground() {
  updateNodeInfo(dom.origName, state.orig.name);
  updateNodeInfo(dom.origLevel, state.orig.stats.level);

  if (state.copyType !== 'none') {
    dom.copyCodeBlock.classList.add('hidden');
    dom.copyCodeActive.classList.remove('hidden');
    dom.mutCopyBtns.forEach(btn => btn.disabled = false);

    updateNodeInfo(dom.copyName, state.copy.name);
    updateNodeInfo(dom.copyLevel, state.copy.stats.level);
  } else {
    dom.copyCodeBlock.classList.remove('hidden');
    dom.copyCodeActive.classList.add('hidden');
    dom.mutCopyBtns.forEach(btn => btn.disabled = true);
  }

  // Update button active states and badges
  [dom.btnRef, dom.btnShallow, dom.btnDeep].forEach(btn => btn.classList.remove('active'));
  if (state.copyType === 'ref') {
    dom.btnRef.classList.add('active');
    dom.copyBadge.textContent = 'Reference';
    dom.copyBadge.className = 'badge ref';
  } else if (state.copyType === 'shallow') {
    dom.btnShallow.classList.add('active');
    dom.copyBadge.textContent = 'Shallow';
    dom.copyBadge.className = 'badge shallow';
  } else if (state.copyType === 'deep') {
    dom.btnDeep.classList.add('active');
    dom.copyBadge.textContent = 'Deep Clone';
    dom.copyBadge.className = 'badge deep';
  } else {
    dom.copyBadge.textContent = 'None';
    dom.copyBadge.className = 'badge';
  }
}

/**
 * Orchestrates UI updates and triggers external callbacks (like diagram updates)
 */
function updateUI(skipDiagramRefresh) {
  renderPlayground();
  if (onStateChangeCallback && !skipDiagramRefresh) {
    onStateChangeCallback(state.copyType);
  }
}

/**
 * Utility to handle multi-line text inside SVG <text> elements using <tspan>
 */
function setSvgMultilineText(element, lines) {
  element.innerHTML = lines.map((line, index) => {
    const dy = index === 0 ? '-0.55em' : '1.1em';
    return `<tspan x="${element.getAttribute('x')}" dy="${dy}">${line}</tspan>`;
  }).join('');
}

/**
 * Initializes the Memory Heap Diagram (SVG)
 */
function initMemoryDiagram() {
  const svgContainer = document.getElementById('svg-container');
  const svgHTML = `
      <svg viewBox="0 0 800 400" width="100%" height="100%">
        <defs>
          <marker id="arrowHead-cyan" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#06b6d4" />
          </marker>
          <marker id="arrowHead-purple" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#d946ef" />
          </marker>
          <marker id="arrowHead-green" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#10b981" />
          </marker>
        </defs>
        <!-- Stack Variables -->
        <g id="dim-vars">
            <rect x="50" y="80" width="120" height="40" class="mem-node" />
            <text x="110" y="105" class="mem-text">original</text>
            <rect x="50" y="240" width="120" height="40" class="mem-node" id="rect-copy" opacity="0.3" />
            <text x="110" y="265" class="mem-text" id="text-copy" opacity="0.3">copy</text>
            <text x="110" y="295" class="mem-text-small" id="label-stack">Stack (Variables)</text>
        </g>
        <!-- Heap Level 1: Root Objects -->
        <g id="dim-heap-l1">
            <rect x="350" y="60" width="140" height="70" class="mem-node mem-node-highlight" id="heap-obj1" />
            <text x="420" y="80" class="mem-text-small">Heap 0x01</text>
            <text x="420" y="105" class="mem-text mem-text-code" id="heap-obj1-text">{ name, stats: 0x02 }</text>
            <rect x="350" y="220" width="140" height="70" class="mem-node" id="heap-obj3" opacity="0" />
            <text x="420" y="240" class="mem-text-small" id="heap-obj3-text1" opacity="0">Heap 0x03</text>
            <text x="420" y="265" class="mem-text mem-text-code" id="heap-obj3-text2" opacity="0">{ name, stats: ? }</text>
        </g>
        <!-- Heap Level 2: Nested Objects -->
        <g id="dim-heap-l2">
            <rect x="650" y="60" width="120" height="70" class="mem-node mem-node-highlight" id="heap-obj2" />
            <text x="710" y="80" class="mem-text-small">Heap 0x02</text>
            <text x="710" y="105" class="mem-text mem-text-code">{ level: 1 }</text>
            <rect x="650" y="220" width="120" height="70" class="mem-node" id="heap-obj4" opacity="0" />
            <text x="710" y="240" class="mem-text-small" id="heap-obj4-text1" opacity="0">Heap 0x04</text>
            <text x="710" y="265" class="mem-text mem-text-code" id="heap-obj4-text2" opacity="0">{ level: 1 }</text>
        </g>
        <!-- Connection Paths (Pointers) -->
        <g id="dim-paths">
            <path d="M 170 100 C 250 100, 250 100, 340 100" class="mem-path active" marker-end="url(#arrowHead-cyan)" />
            <path d="M 490 100 C 560 100, 560 100, 640 100" class="mem-path active" marker-end="url(#arrowHead-cyan)" id="path-0x01-0x02"/>
            <path d="M 170 260 C 250 260, 250 260, 340 260" class="mem-path hidden" id="path-copy-main" />
            <path d="M 490 260 C 560 260, 560 260, 640 260" class="mem-path hidden" id="path-copy-nested" />
        </g>
      </svg>
    `;
  svgContainer.innerHTML = svgHTML;
  setSvgMultilineText(document.getElementById('heap-obj1-text'), ['{ name,', 'stats: 0x02 }']);
  setSvgMultilineText(document.getElementById('heap-obj3-text2'), ['{ name,', 'stats: ? }']);
  updateDiagram('none');
}

/**
 * Updates the SVG diagram paths and visibility based on the copy type
 */
function updateDiagram(type) {
  const pCopyMain = document.getElementById('path-copy-main');
  const pCopyNested = document.getElementById('path-copy-nested');
  const rectCopy = document.getElementById('rect-copy');
  const textCopy = document.getElementById('text-copy');
  const h3 = document.getElementById('heap-obj3');
  const h3t1 = document.getElementById('heap-obj3-text1');
  const h3t2 = document.getElementById('heap-obj3-text2');
  const h4 = document.getElementById('heap-obj4');
  const h4t1 = document.getElementById('heap-obj4-text1');
  const h4t2 = document.getElementById('heap-obj4-text2');
  const highlightClasses = ['mem-node-highlight', 'mem-node-highlight-purple', 'mem-node-highlight-green'];

  // Reset visual states
  pCopyMain.classList.remove('active', 'active-purple', 'active-green');
  pCopyNested.classList.remove('active', 'active-purple', 'active-green');
  pCopyMain.classList.add('hidden');
  pCopyNested.classList.add('hidden');
  rectCopy.setAttribute('opacity', '0.3');
  textCopy.setAttribute('opacity', '0.3');
  h3.setAttribute('opacity', '0');
  h3t1.setAttribute('opacity', '0');
  h3t2.setAttribute('opacity', '0');
  h3.classList.remove(...highlightClasses);
  h4.setAttribute('opacity', '0');
  h4t1.setAttribute('opacity', '0');
  h4t2.setAttribute('opacity', '0');
  h4.classList.remove(...highlightClasses);

  if (type === 'none') return;
  rectCopy.setAttribute('opacity', '1');
  textCopy.setAttribute('opacity', '1');
  pCopyMain.classList.remove('hidden');

  if (type === 'ref') {
    // Reference: copy points to the exact same heap object as original
    pCopyMain.setAttribute('d', 'M 170 260 C 250 260, 250 120, 340 120');
    pCopyMain.setAttribute('marker-end', 'url(#arrowHead-cyan)');
    pCopyMain.classList.add('active');
  } else if (type === 'shallow') {
    // Shallow Copy: new top-level object (Heap 0x03), but same nested object (Heap 0x02)
    h3.setAttribute('opacity', '1');
    h3t1.setAttribute('opacity', '1');
    h3t2.setAttribute('opacity', '1');
    setSvgMultilineText(h3t2, ['{ name,', 'stats: 0x02 }']);
    h3.classList.add('mem-node-highlight-purple');
    pCopyMain.setAttribute('d', 'M 170 260 C 250 260, 250 260, 340 260');
    pCopyMain.setAttribute('marker-end', 'url(#arrowHead-purple)');
    pCopyMain.classList.add('active-purple');
    pCopyNested.classList.remove('hidden');
    pCopyNested.setAttribute('d', 'M 490 260 C 560 260, 560 120, 640 120');
    pCopyNested.setAttribute('marker-end', 'url(#arrowHead-purple)');
    pCopyNested.classList.add('active-purple');
  } else if (type === 'deep') {
    // Deep Clone: completely new objects for all levels (Heap 0x03 and Heap 0x04)
    h3.setAttribute('opacity', '1');
    h3t1.setAttribute('opacity', '1');
    h3t2.setAttribute('opacity', '1');
    setSvgMultilineText(h3t2, ['{ name,', 'stats: 0x04 }']);
    h3.classList.add('mem-node-highlight-green');
    pCopyMain.setAttribute('d', 'M 170 260 C 250 260, 250 260, 340 260');
    pCopyMain.setAttribute('marker-end', 'url(#arrowHead-green)');
    pCopyMain.classList.add('active-green');
    h4.setAttribute('opacity', '1');
    h4t1.setAttribute('opacity', '1');
    h4t2.setAttribute('opacity', '1');
    h4.classList.add('mem-node-highlight-green');
    pCopyNested.classList.remove('hidden');
    pCopyNested.setAttribute('d', 'M 490 260 C 560 260, 560 260, 640 260');
    pCopyNested.setAttribute('marker-end', 'url(#arrowHead-green)');
    pCopyNested.classList.add('active-green');
  }
}

// Simulated console text for the typewriter effect
const CONSOLE_TXT = `> const shield = { durability: 100 };
> const warrior = { item: shield };
> const mage = { ...warrior };

<span class="comment">// Wait! We used spread (...)!</span>
> mage.item.durability = 0;

> console.log(warrior.item.durability);
<span class="output">0</span>

<span class="comment">// The warrior's shield broke too!</span>
<span class="comment">// Spread creates a shallow copy.</span>
<span class="comment">// Nested object 'item' is still a reference.</span>`;

/**
 * Initializes the Console simulation with Intersection Observer
 */
function initConsole() {
  const typewriter = document.getElementById('typewriter');
  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      startTyping(typewriter, CONSOLE_TXT);
      observer.disconnect();
    }
  }, { threshold: 0.5 });
  observer.observe(typewriter);
}

/**
 * Creates a typewriter effect for the given HTML content
 */
function startTyping(element, htmlContent) {
  element.innerHTML = '<span class="cursor"></span>';
  const parts = htmlContent.split(/(<[^>]*>)/g);
  let currentPartIndex = 0;
  let charIndex = 0;
  let renderedHTML = '';

  function type() {
    if (currentPartIndex >= parts.length) {
      element.innerHTML = renderedHTML;
      return;
    }

    const part = parts[currentPartIndex];
    if (part.startsWith('<')) {
      renderedHTML += part;
      currentPartIndex++;
      window.requestAnimationFrame(type);
    } else if (charIndex < part.length) {
      renderedHTML += part[charIndex];
      charIndex++;
      element.innerHTML = renderedHTML + '<span class="cursor"></span>';
      setTimeout(type, 15 + Math.random() * 30);
    } else {
      charIndex = 0;
      currentPartIndex++;
      window.requestAnimationFrame(type);
    }
  }

  type();
}

/**
 * Quiz Data
 */
const questions = [
  {
    q: "What happens when you copy an array using `let b = a`?",
    options: [
      "Creates a brand new array in memory.",
      "Both variables point to the exact same memory address.",
      "Creates a shallow copy automatically."
    ],
    ans: 1
  },
  {
    q: "How can you safely deep copy an object containing nested objects?",
    options: [
      "Using structuredClone(obj)",
      "Using the spread operator: {...obj}",
      "Using Object.assign({}, obj)"
    ],
    ans: 0
  },
  {
    q: "In a Shallow Copy, which of the following is true?",
    options: [
      "Nested objects are totally independent.",
      "The top level properties are separated, but nested objects still share the same reference.",
      "All properties still share the exact same references as the original."
    ],
    ans: 1
  },
  {
    q: "What is copied when you write `const copy = {...original}`?",
    options: [
      "Only the first level of properties.",
      "Every nested object at every depth.",
      "Only methods, not values."
    ],
    ans: 0
  },
  {
    q: "Which array copy keeps the original array independent at the top level?",
    options: [
      "const copy = original",
      "const copy = [...original]",
      "const copy = original.push(1)"
    ],
    ans: 1
  },
  {
    q: "Why can mutating `copy.profile.name` also change `original.profile.name` after a shallow copy?",
    options: [
      "`profile` is still the same nested object reference.",
      "Strings are always shared by reference.",
      "The browser caches object names."
    ],
    ans: 0
  },
  {
    q: "Which value type is copied by value in JavaScript?",
    options: [
      "Object",
      "Array",
      "Number"
    ],
    ans: 2
  },
  {
    q: "What does `structuredClone()` help you avoid?",
    options: [
      "Accidental shared nested references.",
      "All syntax errors.",
      "The need to declare variables."
    ],
    ans: 0
  },
  {
    q: "After `const b = a`, what does `b === a` return when `a` is an object?",
    options: [
      "false, because objects are copied.",
      "true, because both variables reference the same object.",
      "undefined, because objects cannot be compared."
    ],
    ans: 1
  }
];

/**
 * Initializes the Quiz component
 */
function initQuiz() {
  const root = document.getElementById('quiz-root');
  renderQuestion(0, root, 0);
}

/**
 * Renders a specific question and handles answer selection
 */
function renderQuestion(index, root, score) {
  if (index >= questions.length) {
    root.innerHTML = `<h3>Quiz Complete! 🎉</h3><p>You scored ${score}/${questions.length}</p>
        <button class="btn btn-action" id="restart-quiz">Restart</button>`;
    document.getElementById('restart-quiz').addEventListener('click', () => {
      renderQuestion(0, root, 0);
    });
    return;
  }

  const q = questions[index];
  let html = `<div class="quiz-question">${index + 1}. ${q.q}</div>`;
  html += `<div class="quiz-options">`;
  q.options.forEach((opt, idx) => {
    html += `<button class="quiz-btn" data-idx="${idx}">${opt}</button>`;
  });
  html += `</div><div class="quiz-feedback" id="q-feedback"></div>`;
  root.innerHTML = html;

  const btns = root.querySelectorAll('.quiz-btn');
  btns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const selectedIdx = parseInt(e.target.getAttribute('data-idx'), 10);
      const feedback = document.getElementById('q-feedback');
      btns.forEach(b => b.disabled = true);

      if (selectedIdx === q.ans) {
        e.target.classList.add('correct');
        feedback.textContent = "Correct! Moving on...";
        feedback.style.color = 'var(--neon-green)';
        setTimeout(() => renderQuestion(index + 1, root, score + 1), 1500);
      } else {
        e.target.classList.add('wrong');
        btns[q.ans].classList.add('correct');
        feedback.textContent = "Incorrect!";
        feedback.style.color = 'var(--neon-red)';
        setTimeout(() => renderQuestion(index + 1, root, score), 2000);
      }
    });
  });
}

/**
 * Main entry point: Initialize all components when DOM is ready
 */
document.addEventListener('DOMContentLoaded', () => {
  const themeBtn = document.getElementById('theme-toggle');
  themeBtn.addEventListener('click', () => {
    document.body.classList.toggle('light-theme');
  });

  initMemoryDiagram();
  initPlayground((copyType) => {
    updateDiagram(copyType);
  });
  initConsole();
  initQuiz();
});
