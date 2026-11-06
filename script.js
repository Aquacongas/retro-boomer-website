'use strict';

// Two equal groups make the end of each pass identical to its start.
(() => {
  const ticker = document.querySelector('.ticker');
  if (!ticker) return;
  const track = ticker.querySelector('.ticker-track');
  const group = track.querySelector('.ticker-group');
  track.append(group.cloneNode(true));
  const updateTickerSpeed = () => {
    track.style.setProperty('--ticker-duration', `${group.getBoundingClientRect().width / 45}s`);
  };
  updateTickerSpeed();
  new ResizeObserver(updateTickerSpeed).observe(group);
})();

(() => {
  const menu = document.querySelector('.menu-toggle');
  const navigation = document.querySelector('#navigation');
  const closeMenu = () => {
    menu.setAttribute('aria-expanded', 'false');
    navigation.classList.remove('is-open');
  };
  menu.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    menu.setAttribute('aria-expanded', String(open));
    navigation.classList.toggle('is-open', open);
  });
  navigation.addEventListener('click', event => {
    if (event.target.closest('a')) closeMenu();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') {
      closeMenu();
      menu.focus();
    }
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('.header')) closeMenu();
  });
  matchMedia('(min-width: 651px)').addEventListener('change', closeMenu);

  // The complete tape transport is driven by this one state and one clock.
  // p is the fraction wound onto the right reel. Wound tape area, not radius,
  // is proportional to p: r² = hub² + tapeArea * p.
  const state = {
    mode: 'stop', p: 0.42, speed: 0,
    leftAngle: 0, rightAngle: 0, tapeDistance: 0,
    frame: 0, lastTime: null, lastPaint: 0, drag: null,
    inView: true, visible: !document.hidden
  };
  const HUB_RADIUS = 22;
  const PACK_RADIUS = 50;
  const AREA = PACK_RADIUS ** 2 - HUB_RADIUS ** 2;
  // An abbreviated visual transport cycle, not an audio duration or chain clock.
  const TAPE_LENGTH = 14000;
  const PLAY_SPEED = TAPE_LENGTH / 180;
  const REWIND_SPEED = -TAPE_LENGTH / 34;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const deck = document.querySelector('#deck');
  const svg = document.querySelector('#cassette');
  const leftReel = document.querySelector('#reel-left');
  const rightReel = document.querySelector('#reel-right');
  const leftPack = document.querySelector('#pack-left');
  const rightPack = document.querySelector('#pack-right');
  const leftRings = document.querySelector('#rings-left');
  const rightRings = document.querySelector('#rings-right');
  const pencil = document.querySelector('#pencil');
  const pencilFaces = [...document.querySelector('#pencil-faces').children];
  const pencilMetalHighlight = document.querySelector('#pencil-metal-highlight');
  const pencilEraserHighlight = document.querySelector('#pencil-eraser-highlight');
  const counter = document.querySelector('#counter');
  const progress = document.querySelector('#tape-progress');
  const progressbar = progress.parentElement;
  const status = document.querySelector('#transport-status');
  const direction = document.querySelector('#transport-direction');
  const buttons = [...document.querySelectorAll('.transport-controls button')];
  const bars = [...document.querySelectorAll('.vu i')];
  const dragHub = document.querySelector('#hub-drag');
  let oldCounter = '';
  let oldProgress = -1;

  const radii = () => ({
    left: Math.sqrt(HUB_RADIUS ** 2 + AREA * (1 - state.p)),
    right: Math.sqrt(HUB_RADIUS ** 2 + AREA * state.p)
  });

  function renderPencil() {
    // Orthographic projection of a hexagonal prism turning about its own
    // longitudinal (local X) axis. The axis runs from (0, 0) to (124, 0),
    // inside a STATIC -40° group anchored at the left hub (205, 212).
    // Neither that group nor its insertion point ever receives a rotation.
    const phase = (reducedMotion.matches ? 0 : state.leftAngle) * Math.PI / 180;
    const vertices = Array.from({ length: 6 }, (_, index) => {
      const angle = phase + index * Math.PI / 3;
      return { y: Math.cos(angle) * 8, z: Math.sin(angle) * 8 };
    });
    pencilFaces.forEach((face, index) => {
      const a = vertices[index];
      const b = vertices[(index + 1) % 6];
      const normal = phase + (index + 0.5) * Math.PI / 3;
      // Cull the back-facing half of the prism. Depth projects slightly along
      // X to foreshorten its cross-section without displacing its centerline.
      face.style.display = Math.sin(normal) > 0 ? '' : 'none';
      const ax = a.z * 0.28;
      const bx = b.z * 0.28;
      face.setAttribute('points', `${ax},${a.y} ${124 + ax},${a.y} ${124 + bx},${b.y} ${bx},${b.y}`);
      const light = Math.max(0, Math.sin(normal) * 0.6 - Math.cos(normal) * 0.4);
      face.setAttribute('fill', `hsl(39 75% ${32 + light * 36}%)`);
    });
    const highlight = (0.5 + Math.cos(phase) * 0.23).toFixed(3);
    pencilMetalHighlight.setAttribute('offset', highlight);
    pencilEraserHighlight.setAttribute('offset', highlight);
  }

  function render() {
    const { left, right } = radii();
    leftPack.setAttribute('r', left.toFixed(3));
    rightPack.setAttribute('r', right.toFixed(3));
    leftRings.setAttribute('r', Math.max(HUB_RADIUS, left - 3).toFixed(3));
    rightRings.setAttribute('r', Math.max(HUB_RADIUS, right - 3).toFixed(3));
    // SVG positive rotation is clockwise. At the bottom tangent, a negative
    // rotation transports tape rightward: supply (left) -> take-up (right).
    if (!reducedMotion.matches) {
      leftReel.setAttribute('transform', `rotate(${state.leftAngle.toFixed(3)})`);
      rightReel.setAttribute('transform', `rotate(${state.rightAngle.toFixed(3)})`);
    }
    if (state.mode === 'rewind') renderPencil();
    const count = String(Math.floor(state.p * 1000 + 1e-7)).padStart(4, '0');
    if (count !== oldCounter) {
      counter.textContent = count;
      oldCounter = count;
    }
    progress.style.width = `${state.p * 100}%`;
    const percent = Math.round(state.p * 100);
    if (percent !== oldProgress) {
      progressbar.setAttribute('aria-valuenow', String(percent));
      oldProgress = percent;
    }
    bars.forEach((bar, i) => {
      // A transport activity indicator, deliberately not presented as audio.
      const active = state.mode === 'play' || state.mode === 'rewind';
      const height = active && !reducedMotion.matches
        ? 4 + (Math.sin(state.tapeDistance / 34 + i * 0.7) + 1) * 8 + (i % 3) * 2
        : 4;
      bar.style.height = `${height.toFixed(1)}px`;
    });
  }

  function updateControls(message) {
    const mode = state.mode;
    deck.dataset.mode = mode;
    buttons.forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.mode === mode));
    });
    pencil.setAttribute('visibility', mode === 'rewind' ? 'visible' : 'hidden');
    status.textContent = message || ({
      play: 'PLAYING / SIDE A', rewind: 'PENCIL REWIND / SIDE A',
      stop: 'STOPPED / SIDE A', hand: 'MANUAL REWIND / SIDE A'
    })[mode];
    direction.textContent = ({ play: '▶ LEFT → RIGHT', rewind: '◀◀ RIGHT → LEFT', stop: '■ STOPPED', hand: '↻ TURN BY HAND' })[mode];
  }

  function cancelFrame() {
    if (state.frame) cancelAnimationFrame(state.frame);
    state.frame = 0;
    state.lastTime = null;
  }

  function running() {
    return (state.mode === 'play' || state.mode === 'rewind') && state.visible && state.inView;
  }

  function startFrame() {
    if (!state.frame && running()) state.frame = requestAnimationFrame(frame);
  }

  function endDrag() {
    const drag = state.drag;
    state.drag = null;
    if (drag && dragHub.hasPointerCapture(drag.pointerId)) {
      dragHub.releasePointerCapture(drag.pointerId);
    }
  }

  function setMode(mode, message) {
    if (state.mode === mode && !message) return;
    endDrag();
    cancelFrame();
    state.mode = mode;
    // Disengaging the transport brakes instantly. A newly engaged transport
    // accelerates from zero, so a pencil never coasts in the wrong direction.
    state.speed = 0;
    updateControls(message);
    render();
    startFrame();
  }

  function advance(distance) {
    const previous = state.p;
    state.p = Math.max(0, Math.min(1, previous + distance / TAPE_LENGTH));
    const actualDistance = (state.p - previous) * TAPE_LENGTH;
    const { left, right } = radii();
    // Constant linear tape speed means each reel's angular speed is v/r.
    const degrees = 180 / Math.PI;
    state.leftAngle = (state.leftAngle - actualDistance / left * degrees) % 360;
    state.rightAngle = (state.rightAngle - actualDistance / right * degrees) % 360;
    state.tapeDistance += actualDistance;
    if ((state.p === 1 && distance > 0) || (state.p === 0 && distance < 0)) {
      setMode('stop', state.p === 1 ? 'END OF SIDE A / REWIND' : 'FULLY REWOUND / READY');
      return false;
    }
    return true;
  }

  function frame(now) {
    state.frame = 0;
    if (!running()) return;
    const dt = state.lastTime === null ? 0 : Math.min(0.05, (now - state.lastTime) / 1000);
    state.lastTime = now;
    const target = state.mode === 'play' ? PLAY_SPEED : REWIND_SPEED;
    state.speed += (target - state.speed) * (1 - Math.exp(-dt * 7));
    if (!advance(state.speed * dt)) return;
    if (!reducedMotion.matches || now - state.lastPaint > 125) {
      render();
      state.lastPaint = now;
    }
    startFrame();
  }

  buttons.forEach(button => {
    button.addEventListener('click', () => setMode(button.dataset.mode));
  });

  function angleAt(event) {
    // Transform pointer coordinates into SVG space; this remains accurate when
    // the whole deck is rotated or resized, and across touch/mouse inputs.
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(svg.getScreenCTM().inverse());
    return Math.atan2(point.y - 212, point.x - 205);
  }

  dragHub.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0) return;
    event.preventDefault();
    setMode('hand');
    state.drag = { pointerId: event.pointerId, angle: angleAt(event) };
    dragHub.setPointerCapture(event.pointerId);
  });
  dragHub.addEventListener('pointermove', event => {
    if (!state.drag || state.drag.pointerId !== event.pointerId) return;
    const angle = angleAt(event);
    let delta = angle - state.drag.angle;
    if (delta > Math.PI) delta -= Math.PI * 2;
    if (delta < -Math.PI) delta += Math.PI * 2;
    state.drag.angle = angle;
    advance(-delta * radii().left);
    render();
  });
  const releaseHand = () => {
    if (state.mode === 'hand') setMode('stop');
  };
  dragHub.addEventListener('pointerup', releaseHand);
  dragHub.addEventListener('pointercancel', releaseHand);
  dragHub.addEventListener('lostpointercapture', releaseHand);
  dragHub.addEventListener('keydown', event => {
    if (!['ArrowRight', 'ArrowLeft', 'Enter', ' '].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'Enter' || event.key === ' ') {
      setMode(state.mode === 'rewind' ? 'stop' : 'rewind');
    } else {
      setMode('hand');
      advance((event.key === 'ArrowRight' ? -1 : 1) * radii().left * Math.PI / 3);
      render();
    }
  });
  dragHub.addEventListener('keyup', event => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') releaseHand();
  });
  dragHub.addEventListener('blur', releaseHand);

  document.addEventListener('visibilitychange', () => {
    state.visible = !document.hidden;
    cancelFrame();
    startFrame();
  });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      state.inView = entries[0].isIntersecting;
      cancelFrame();
      startFrame();
    }, { rootMargin: '100px' }).observe(deck);
  }
  reducedMotion.addEventListener('change', () => {
    // A stable orientation prevents abrupt spinning when reduced motion changes.
    render();
  });
  updateControls('READY / SIDE A');
  render();

  // All ten stages reproduce the original v1.0.1 consensus emission parameters.
  const stageButtons = document.querySelector('#emission-stages');
  const stageDetail = document.querySelector('#emission-detail');
  const rows = document.querySelector('#emission-rows');
  const format = value => value.toLocaleString('en-US', { maximumFractionDigits: 8 });
  let firstBlock = 1;
  const stages = Array.from({ length: 10 }, (_, index) => {
    const length = 10000 * 2 ** index;
    const stage = { index, start: firstBlock, end: firstBlock + length - 1, length, reward: 100000 / 2 ** index };
    firstBlock += length;
    return stage;
  });
  const duration = length => length / 1440 > 365 ? `${(length / 525600).toFixed(1)} yr` : `${Math.round(length / 1440)} days`;
  function selectStage(index) {
    const stage = stages[index];
    [...stageButtons.children].forEach((button, buttonIndex) => {
      button.setAttribute('aria-pressed', String(index === buttonIndex));
    });
    stageDetail.innerHTML = `<strong>STAGE ${index + 1} / 1 BILLION TAPE</strong><span>BLOCKS ${format(stage.start)} – ${format(stage.end)}</span><span>${format(stage.reward)} TAPE / BLOCK</span><span>≈ ${duration(stage.length)}</span>`;
  }
  stages.forEach(stage => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = `S${stage.index + 1}`;
    button.setAttribute('aria-label', `Inspect emission stage ${stage.index + 1}`);
    button.setAttribute('aria-pressed', 'false');
    button.addEventListener('click', () => selectStage(stage.index));
    stageButtons.append(button);
    const row = document.createElement('tr');
    [String(stage.index + 1).padStart(2, '0'), `${format(stage.start)} – ${format(stage.end)}`, format(stage.reward), format(stage.length), duration(stage.length)].forEach(value => {
      const cell = document.createElement('td');
      cell.textContent = value;
      row.append(cell);
    });
    rows.append(row);
  });
  selectStage(0);
})();
