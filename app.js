(() => {
  const pitch = document.querySelector('#pitch');
  const pieces = [...document.querySelectorAll('[data-piece]')];
  const samples = {
    onside: { fw: [63, 35], df1: [73, 27], df2: [69, 73], gk: [93, 50], ball: [46, 60] },
    offside: { fw: [83, 35], df1: [73, 27], df2: [69, 73], gk: [93, 50], ball: [46, 60] },
    level: { fw: [73, 47], df1: [73, 22], df2: [66, 76], gk: [93, 50], ball: [46, 60] },
    ball: { fw: [80, 30], df1: [69, 27], df2: [64, 73], gk: [93, 50], ball: [85, 65] },
    own: { fw: [44, 30], df1: [38, 22], df2: [34, 78], gk: [93, 50], ball: [29, 60] }
  };
  let state;
  let drag = null;
  const clamp = n => Math.max(0, Math.min(100, n));
  function render() {
    const result = OffsideRules.evaluatePosition({ forwardX: state.fw[0], ballX: state.ball[0], defenders: [state.df1[0], state.df2[0], state.gk[0]] });
    for (const piece of pieces) {
      const [x, y] = state[piece.dataset.piece];
      piece.style.left = `${2 + x * .96}%`;
      piece.style.top = `${3.08 + y * .9384}%`;
    }
    // ピッチの白い外周線を座標0〜100の境界に対応させる。
    const line = document.querySelector('#offside-line');
    line.style.left = `${2 + result.secondLastX * .96}%`;
    line.style.top = '3.08%'; line.style.bottom = '3.08%';
    const zone = document.querySelector('#offside-zone');
    zone.style.left = `${2 + result.limitX * .96}%`;
    zone.style.right = '2%'; zone.style.top = '3.08%'; zone.style.bottom = '3.08%';
    const passer = document.querySelector('#passer');
    passer.style.left = `${2 + Math.max(0, state.ball[0] - 5) * .96}%`;
    passer.style.top = `${3.08 + Math.min(100, state.ball[1] + 9) * .9384}%`;
    document.querySelector('#verdict').classList.toggle('offside', result.offside);
    document.querySelector('#verdict-title').textContent = result.offside ? 'オフサイドポジション' : 'オンサイド';
    document.querySelector('#verdict-en').textContent = result.offside ? 'OFFSIDE POSITION' : 'ONSIDE';
    document.querySelector('#verdict-icon').textContent = result.offside ? '!' : '✓';
    // 詳細判定と同じ結果を、スマホの追従フィールドにも表示する。
    document.querySelector('#mobile-verdict').classList.toggle('offside', result.offside);
    document.querySelector('#mobile-verdict-title').textContent = document.querySelector('#verdict-title').textContent;
    document.querySelector('#mobile-verdict-icon').textContent = result.offside ? '!' : '✓';
    document.querySelector('#reason').textContent = result.reason;
    document.querySelectorAll('.check-icon').forEach((icon, i) => {
      icon.textContent = result.conditions[i] ? '✓' : '−';
      icon.classList.toggle('yes', result.conditions[i]);
      icon.setAttribute('aria-label', result.conditions[i] ? '当てはまる' : '当てはまらない');
    });
  }
  function clearSample() {
    document.querySelectorAll('[data-sample]').forEach(button => {
      button.classList.remove('active'); button.setAttribute('aria-pressed', 'false');
    });
  }
  function loadSample(name) {
    state = Object.fromEntries(Object.entries(samples[name]).map(([key, value]) => [key, [...value]]));
    clearSample();
    const button = document.querySelector(`[data-sample="${name}"]`);
    button.classList.add('active'); button.setAttribute('aria-pressed', 'true');
    render();
  }
  function movePointer(event) {
    if (!drag || event.pointerId !== drag.pointerId) return;
    const rect = pitch.getBoundingClientRect();
    const contentLeft = rect.left + pitch.clientLeft;
    const contentTop = rect.top + pitch.clientTop;
    state[drag.key] = [
      clamp(Math.round((((event.clientX - contentLeft - drag.offsetX) / pitch.clientWidth * 100) - 2) / .96)),
      clamp(Math.round((((event.clientY - contentTop - drag.offsetY) / pitch.clientHeight * 100) - 3.08) / .9384))
    ];
    clearSample(); render();
  }
  function endDrag(event) {
    if (!drag || event.pointerId !== drag.pointerId) return;
    drag.element.classList.remove('dragging');
    drag = null;
  }
  for (const piece of pieces) {
    piece.addEventListener('pointerdown', event => {
      if (drag || (event.pointerType === 'mouse' && event.button !== 0)) return;
      event.preventDefault();
      piece.focus({ preventScroll: true });
      const rect = piece.getBoundingClientRect();
      drag = { key: piece.dataset.piece, pointerId: event.pointerId, element: piece, offsetX: event.clientX - rect.left - rect.width / 2, offsetY: event.clientY - rect.top - rect.height / 2 };
      piece.setPointerCapture(event.pointerId); piece.classList.add('dragging');
    });
    piece.addEventListener('pointermove', movePointer);
    piece.addEventListener('pointerup', endDrag);
    piece.addEventListener('pointercancel', endDrag);
    piece.addEventListener('lostpointercapture', endDrag);
    piece.addEventListener('keydown', event => {
      const delta = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[event.key];
      if (!delta) return;
      event.preventDefault();
      state[piece.dataset.piece] = state[piece.dataset.piece].map((value, i) => clamp(value + delta[i] * (event.shiftKey ? 5 : 1)));
      clearSample(); render();
    });
  }
  document.querySelectorAll('[data-sample]').forEach(button => button.addEventListener('click', () => loadSample(button.dataset.sample)));
  document.querySelector('#reset').addEventListener('click', () => loadSample('onside'));
  // 選択ボタンやキーボードのフォーカスが追従エリアに隠れないようにする。
  const fieldView = document.querySelector('.field-view');
  const updateFieldHeight = () => document.documentElement.style.setProperty('--field-view-height', `${Math.ceil(fieldView.getBoundingClientRect().height)}px`);
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(updateFieldHeight).observe(fieldView);
  window.addEventListener('resize', updateFieldHeight);
  updateFieldHeight();
  loadSample('onside');
})();
