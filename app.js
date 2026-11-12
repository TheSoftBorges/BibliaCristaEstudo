// Capítulos do vídeo: o início de cada cena, em segundos (ver README do site).
const CHAPTERS = [
  { start: 0,    title: 'Leitura',            text: 'Página de rosto com gravura de Doré e texto no estilo de Bíblia impressa.' },
  { start: 10.2, title: 'Nomes clicáveis',    text: 'Toque em Abrão e veja quem é, sem sair do capítulo.' },
  { start: 15.0, title: 'Estudo e original',  text: 'Notas de estudo e o versículo em hebraico, palavra por palavra.' },
  { start: 23.7, title: 'Estudo da palavra',  text: 'Verbete, formas no texto e ocorrências por livro.' },
  { start: 29.4, title: 'Mapa do capítulo',   text: 'Os lugares de Gênesis 12, enquadrados no mapa offline.' },
  { start: 34.8, title: 'Rotas',              text: 'A segunda viagem de Paulo, desenhada etapa por etapa.' },
  { start: 43.2, title: 'Linha do tempo',     text: 'Eventos e vidas em ordem cronológica.' },
  { start: 51.1, title: 'Árvore genealógica', text: 'A família de Abraão e a genealogia de Jesus.' },
  { start: 61.1, title: 'Busca',              text: 'Texto, notas de estudo e filtros por testamento.' },
  { start: 66.7, title: 'Planos e progresso', text: 'Cinco planos e um quadrado por capítulo lido.' },
  { start: 74.5, title: 'Temas',              text: 'Papiro, claro e escuro, trocados na hora.' },
];

const $ = (s) => document.querySelector(s);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Vídeo ---------- */
const video = $('#video');
const list = $('#chapters');
const fill = $('#trackFill');
const track = $('#track');
const timeEl = $('#time');
const toggle = $('#toggle');
const overlay = $('#playOverlay');
let userPaused = false;

CHAPTERS.forEach((c, i) => {
  const li = document.createElement('li');
  const b = document.createElement('button');
  b.type = 'button';
  b.innerHTML =
    `<span class="n">${String(i + 1).padStart(2, '0')}</span>` +
    `<span class="t"><b>${c.title}</b><small>${c.text}</small></span>` +
    `<span class="bar"><i></i></span>`;
  b.addEventListener('click', () => {
    video.currentTime = c.start + 0.05;
    userPaused = false;
    video.play().catch(() => {});
  });
  li.appendChild(b);
  list.appendChild(li);
});
const items = [...list.children];
const bars = items.map((li) => li.querySelector('.bar i'));

const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
let current = -1;

function paint() {
  const t = video.currentTime;
  const dur = video.duration || 85.5;
  let idx = 0;
  for (let i = 0; i < CHAPTERS.length; i++) if (t >= CHAPTERS[i].start) idx = i;
  const end = idx + 1 < CHAPTERS.length ? CHAPTERS[idx + 1].start : dur;
  const p = Math.min(1, Math.max(0, (t - CHAPTERS[idx].start) / (end - CHAPTERS[idx].start)));

  if (idx !== current) {
    items.forEach((li, i) => li.classList.toggle('active', i === idx));
    bars.forEach((b, i) => { if (i !== idx) b.style.transform = 'scaleX(0)'; });
    // No celular a lista é uma faixa horizontal: mantém o capítulo ativo à vista.
    if (list.scrollWidth > list.clientWidth) {
      const li = items[idx];
      list.scrollTo({ left: li.offsetLeft - 16, behavior: reduced ? 'auto' : 'smooth' });
    }
    current = idx;
  }
  bars[idx].style.transform = `scaleX(${p})`;
  fill.style.transform = `scaleX(${t / dur})`;
  track.setAttribute('aria-valuenow', Math.round((t / dur) * 100));
  timeEl.textContent = fmt(t);
}

function loop() {
  paint();
  if (!video.paused) requestAnimationFrame(loop);
}

function syncButtons() {
  const playing = !video.paused;
  toggle.classList.toggle('paused', !playing);
  toggle.setAttribute('aria-label', playing ? 'Pausar' : 'Reproduzir');
  overlay.classList.toggle('hide', playing);
}

video.addEventListener('play', () => { syncButtons(); requestAnimationFrame(loop); });
video.addEventListener('pause', syncButtons);
video.addEventListener('seeked', paint);
video.addEventListener('loadedmetadata', paint);

function togglePlay() {
  if (video.paused) { userPaused = false; video.play().catch(() => {}); }
  else { userPaused = true; video.pause(); }
}
toggle.addEventListener('click', togglePlay);
overlay.addEventListener('click', togglePlay);
video.addEventListener('click', togglePlay);

function seekFromEvent(e) {
  const r = track.getBoundingClientRect();
  const x = Math.min(r.width, Math.max(0, e.clientX - r.left));
  video.currentTime = (x / r.width) * (video.duration || 85.5);
}
track.addEventListener('pointerdown', (e) => {
  track.setPointerCapture(e.pointerId);
  seekFromEvent(e);
  const move = (ev) => seekFromEvent(ev);
  const up = () => { track.removeEventListener('pointermove', move); track.removeEventListener('pointerup', up); };
  track.addEventListener('pointermove', move);
  track.addEventListener('pointerup', up);
});
track.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight') video.currentTime = Math.min(video.duration, video.currentTime + 5);
  if (e.key === 'ArrowLeft') video.currentTime = Math.max(0, video.currentTime - 5);
});

// Toca sozinho quando o telefone entra na tela e pausa ao sair (a menos que a pessoa tenha pausado).
if ('IntersectionObserver' in window) {
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting) { if (!userPaused && !reduced) video.play().catch(() => {}); }
    else video.pause();
  }, { threshold: 0.35 }).observe(video);
}
syncButtons();
paint();

/* ---------- Entrada das seções ---------- */
const revealEls = document.querySelectorAll('.reveal');
if (reduced || !('IntersectionObserver' in window)) {
  revealEls.forEach((el) => el.classList.add('in'));
} else {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      io.unobserve(e.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  revealEls.forEach((el) => {
    // Escalona irmãos dentro do mesmo bloco.
    const sibs = [...el.parentElement.children].filter((c) => c.classList.contains('reveal'));
    el.style.transitionDelay = `${Math.min(sibs.indexOf(el), 6) * 70}ms`;
    io.observe(el);
  });
}

/* ---------- Menu no celular ---------- */
const burger = $('#burger');
const menu = $('#menu');
function setMenu(open) {
  burger.setAttribute('aria-expanded', open);
  burger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  document.body.classList.toggle('menu-open', open);
  if (open) { menu.hidden = false; requestAnimationFrame(() => menu.classList.add('open')); }
  else { menu.classList.remove('open'); setTimeout(() => { menu.hidden = true; }, 450); }
}
burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
menu.addEventListener('click', (e) => { if (e.target.tagName === 'A') setMenu(false); });
addEventListener('keydown', (e) => { if (e.key === 'Escape' && document.body.classList.contains('menu-open')) setMenu(false); });

/* ---------- Doação: copiar a chave Pix ---------- */
const pixCopy = $('#pixCopy');
if (pixCopy) {
  const label = $('#pixCopyLabel');
  pixCopy.addEventListener('click', async () => {
    const key = $('#pixKey').textContent.trim();
    let ok = false;
    try { await navigator.clipboard.writeText(key); ok = true; }
    catch {
      // Sem permissão de área de transferência (ou página fora de https): seleciona o texto para copiar à mão.
      const r = document.createRange(); r.selectNodeContents($('#pixKey'));
      const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);
      try { ok = document.execCommand('copy'); } catch { ok = false; }
    }
    label.textContent = ok ? 'Chave copiada' : 'Selecione e copie';
    pixCopy.classList.toggle('done', ok);
    setTimeout(() => { label.textContent = 'Copiar chave'; pixCopy.classList.remove('done'); }, 2600);
  });
}
