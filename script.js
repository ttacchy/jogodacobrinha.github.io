(function () {
  var N = 20;   // células por lado
  var S = 22;   // tamanho da célula em pixels (N * S = 440)

  var cv = document.getElementById('c');
  var ctx = cv.getContext('2d');
  var elScore = document.getElementById('score');
  var elBest = document.getElementById('best');
  var ov = document.getElementById('ov');
  var ovT = document.getElementById('ovT');
  var ovP = document.getElementById('ovP');
  var go = document.getElementById('go');

  var snake, dir, next, food, score, timer;
  var running = false, paused = false, best = 0;

  try { best = parseInt(localStorage.getItem('cobrinha-best'), 10) || 0; } catch (e) {}
  elBest.textContent = best;

  function css(v) {
    return getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  }

  function placeFood() {
    var free = [];
    for (var x = 0; x < N; x++) {
      for (var y = 0; y < N; y++) {
        if (!snake.some(function (s) { return s.x === x && s.y === y; })) free.push({ x: x, y: y });
      }
    }
    food = free[Math.floor(Math.random() * free.length)];
  }

  function reset() {
    snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
    dir = { x: 1, y: 0 };
    next = dir;
    score = 0;
    elScore.textContent = 0;
    placeFood();
    draw();
  }

  function speed() {
    return Math.max(60, 140 - Math.floor(score / 5) * 8);
  }

  function loop() {
    clearTimeout(timer);
    if (!running || paused) return;
    step();
    if (running) timer = setTimeout(loop, speed());
  }

  function step() {
    dir = next;
    var h = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
    var eat = food && h.x === food.x && h.y === food.y;
    var body = eat ? snake : snake.slice(0, -1);

    var hitWall = h.x < 0 || h.y < 0 || h.x >= N || h.y >= N;
    var hitSelf = body.some(function (s) { return s.x === h.x && s.y === h.y; });
    if (hitWall || hitSelf) return end();

    snake.unshift(h);
    if (eat) {
      score++;
      elScore.textContent = score;
      if (snake.length === N * N) return end(true);
      placeFood();
    } else {
      snake.pop();
    }
    draw();
  }

  function end(won) {
    running = false;
    clearTimeout(timer);
    draw();
    if (score > best) {
      best = score;
      elBest.textContent = best;
      try { localStorage.setItem('cobrinha-best', best); } catch (e) {}
    }
    ovT.textContent = won ? 'Você venceu!' : 'Fim de jogo';
    ovP.textContent = 'Você fez ' + score + (score === 1 ? ' ponto.' : ' pontos.');
    go.textContent = 'Jogar de novo';
    ov.classList.remove('hide');
    go.focus();
  }

  function start() {
    reset();
    running = true;
    paused = false;
    ov.classList.add('hide');
    loop();
  }

  function turn(d) {
    var m = { u: { x: 0, y: -1 }, d: { x: 0, y: 1 }, l: { x: -1, y: 0 }, r: { x: 1, y: 0 } }[d];
    if (!running || paused || !m) return;
    if (m.x === -dir.x && m.y === -dir.y) return; // não pode virar 180°
    next = m;
  }

  function togglePause() {
    if (!running) return;
    paused = !paused;
    if (paused) {
      ovT.textContent = 'Pausado';
      ovP.textContent = 'Aperte espaço ou toque em Continuar.';
      go.textContent = 'Continuar';
      ov.classList.remove('hide');
    } else {
      ov.classList.add('hide');
      loop();
    }
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    ctx.fill();
  }

  function draw() {
    // tabuleiro xadrez
    ctx.fillStyle = css('--board');
    ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.fillStyle = css('--grid');
    for (var x = 0; x < N; x++) {
      for (var y = 0; y < N; y++) {
        if ((x + y) % 2 === 0) ctx.fillRect(x * S, y * S, S, S);
      }
    }

    // maçã
    if (food) {
      ctx.fillStyle = css('--food');
      ctx.beginPath();
      ctx.arc(food.x * S + S / 2, food.y * S + S / 2 + 1, S / 2 - 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = css('--snake');
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(food.x * S + S / 2, food.y * S + 5);
      ctx.lineTo(food.x * S + S / 2 + 3, food.y * S + 1);
      ctx.stroke();
    }

    // cobra
    snake.forEach(function (s, i) {
      ctx.fillStyle = i === 0 ? css('--head') : css('--snake');
      var p = i === 0 ? 1 : 2;
      roundRect(s.x * S + p, s.y * S + p, S - 2 * p, S - 2 * p, i === 0 ? 8 : 6);
    });

    // olhos
    var h = snake[0], ox = h.x * S, oy = h.y * S;
    var eyes = dir.x !== 0
      ? [[dir.x > 0 ? S - 8 : 5, 5], [dir.x > 0 ? S - 8 : 5, S - 9]]
      : [[5, dir.y > 0 ? S - 8 : 5], [S - 9, dir.y > 0 ? S - 8 : 5]];
    ctx.fillStyle = css('--board');
    eyes.forEach(function (e) {
      ctx.beginPath();
      ctx.arc(ox + e[0] + 1.5, oy + e[1] + 1.5, 2.2, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // botão principal (jogar / continuar)
  go.addEventListener('click', function () {
    if (running && paused) togglePause(); else start();
  });

  // teclado
  document.addEventListener('keydown', function (e) {
    var k = e.key.toLowerCase();
    var map = { arrowup: 'u', w: 'u', arrowdown: 'd', s: 'd', arrowleft: 'l', a: 'l', arrowright: 'r', d: 'r' };
    if (map[k]) {
      e.preventDefault();
      turn(map[k]);
    } else if (k === ' ') {
      e.preventDefault();
      if (!running) start(); else togglePause();
    }
  });

  // botões na tela
  document.querySelectorAll('.pad button').forEach(function (b) {
    b.addEventListener('click', function () { turn(b.getAttribute('data-d')); });
  });

  // deslizar no celular
  var t0 = null;
  cv.addEventListener('touchstart', function (e) {
    var t = e.touches[0];
    t0 = { x: t.clientX, y: t.clientY };
  }, { passive: true });
  cv.addEventListener('touchend', function (e) {
    if (!t0) return;
    var t = e.changedTouches[0];
    var dx = t.clientX - t0.x, dy = t.clientY - t0.y;
    t0 = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
    turn(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'r' : 'l') : (dy > 0 ? 'd' : 'u'));
  });

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', draw);

  reset();
})();
