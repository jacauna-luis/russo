"use strict";
/* Russo Дорога — app de estudo (PWA) */
const D = window.DATA;
const W = D.words, P = D.phrases, Q = D.questions;
const $ = (s, el) => (el || document).querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const IMG = id => D.imgs[id] || "";
const rnd = n => Math.floor(Math.random() * n);
const pick = a => a[rnd(a.length)];
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const plain = s => String(s).replace(/́/g, "").toLowerCase().replace(/ё/g, "е");
const norm = s => String(s).toLowerCase().replace(/ё/g, "е").replace(/й/g, "\u0001").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\u0001/g, "й");
const todayKey = () => { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
const ICON = {
  spk: '<svg viewBox="0 0 24 24"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/></svg>',
  gear: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
  x: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  back: '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>',
  bolt: '<svg viewBox="0 0 24 24"><path d="M13 2 4.5 13.5H11L10 22l8.5-11.5H12z"/></svg>',
  redo: '<svg viewBox="0 0 24 24"><path d="M4 12a8 8 0 1 0 2.3-5.6"/><path d="M4 4v4h4"/></svg>',
  search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>'
};
const say = (text, cls) => `<button class="say ${cls || ""}" data-say="${esc(text)}" aria-label="Ouvir">${ICON.spk}</button>`;

/* ---------------- estado persistente ---------------- */
const KEY = "rd-state-v1";
const DEF = { v: 1, level: 1, prog: 0, hist: [], items: {}, days: {}, streak: { last: "", n: 0 }, total: { a: 0, c: 0 },
  settings: { theme: "auto", rate: 0.9, phon: "auto", len: 20, auto: true, voice: "" } };
function load() {
  try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.v === 1) return Object.assign({}, DEF, s, { settings: Object.assign({}, DEF.settings, s.settings || {}) }); } catch (e) { }
  return JSON.parse(JSON.stringify(DEF));
}
let S = load();
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { } }
const st = id => S.items[id] || (S.items[id] = { b: 0, d: 0, c: 0, w: 0, s: 0, fix: 0, seen: 0 });
const peek = id => S.items[id];
const INTERVAL = [0, 10 * 60e3, 24 * 3600e3, 3 * 24 * 3600e3, 7 * 24 * 3600e3, 21 * 24 * 3600e3];

/* ---------------- níveis ---------------- */
const LEVELS = [
  null,
  { name: "Primeiros passos", rank: 60, desc: "As palavras mais usadas: significado e tradução." },
  { name: "Base", rank: 120, desc: "Novas palavras e exercício de imagem." },
  { name: "Ouvido", rank: 200, desc: "Entram os exercícios de ouvir." },
  { name: "Frases curtas", rank: 280, desc: "Complete frases e traduza frases curtas." },
  { name: "Conversa", rank: 360, desc: "Mais palavras e frases do português para o russo." },
  { name: "Construção", rank: 450, desc: "Monte frases com as palavras embaralhadas." },
  { name: "Diálogo", rank: 540, desc: "Escolha a resposta certa para perguntas." },
  { name: "Fluência", rank: 640, desc: "Frases mais longas e ouvir frases inteiras." },
  { name: "Avançado", rank: 740, desc: "Opções mais parecidas entre si." },
  { name: "Viajante", rank: 850, desc: "Quase todo o vocabulário." },
  { name: "Experiente", rank: 1000, desc: "Todas as 1.000 palavras e frases longas." },
  { name: "Mestre", rank: 1000, desc: "Tudo, sem dicas de pronúncia." }
];
const MAXL = LEVELS.length - 1;
const phraseMax = L => L < 4 ? 0 : L < 5 ? 4 : L < 6 ? 5 : L < 8 ? 6 : L < 10 ? 8 : 99;
const tokens = s => s.replace(/[«»"“”.,!?…:;()]/g, " ").replace(/\s—\s|^—\s|\s—$/g, " ").split(/\s+/).filter(x => x && x !== "—");
P.forEach((p, i) => { p.id = "f" + i; p.len = tokens(p.ru).length; });
Q.forEach((q, i) => { q.id = "q" + i; q.len = tokens(q.q).length; });
W.forEach(w => { w.id = "w" + w.n; w.first = w.w.split(/,|\s\/\s/)[0].trim(); w.fp = plain(w.first).replace(/\s*\(.*\)$/, ""); });
const byId = id => id[0] === "w" ? W[+id.slice(1) - 1] : id[0] === "f" ? P[+id.slice(1)] : Q[+id.slice(1)];
function hints() { const m = S.settings.phon; return m === "always" || (m === "auto" && S.level <= 5); }

/* ---------------- voz (Web Speech: iPhone, Android e computador) ---------------- */
const HAS_TTS = "speechSynthesis" in window;
const IS_IOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
let ruVoices = [], webVoice = null, voicesLoaded = false;
function pickVoice() {
  if (!HAS_TTS) return;
  const all = speechSynthesis.getVoices();
  if (all.length) voicesLoaded = true;
  ruVoices = all.filter(v => /^ru/i.test(v.lang));
  const pref = S.settings.voice;
  webVoice = ruVoices.find(v => v.voiceURI === pref) || ruVoices.find(v => /premium|enhanced|melhorad|natural|google/i.test(v.name)) || ruVoices[0] || null;
}
if (HAS_TTS) {
  pickVoice();
  const onv = () => { pickVoice(); if (route === "settings" || route === "home") render(); };
  if (speechSynthesis.addEventListener) speechSynthesis.addEventListener("voiceschanged", onv); else speechSynthesis.onvoiceschanged = onv;
}
let ttsState = HAS_TTS ? 1 : 3;
function refreshTts() { return ttsState; }
const ttsOk = () => HAS_TTS;
let speakingBtn = null;
window.onSpeechEnd = () => { if (speakingBtn) speakingBtn.classList.remove("on"); speakingBtn = null; };
function speak(text, btn) {
  if (!HAS_TTS) { toast("Este navegador não tem leitura em voz alta."); return; }
  const clean = String(text).replace(/\u0301/g, "").replace(/[—…«»]/g, " ").replace(/\s*\/\s*/g, ", ");
  if (speakingBtn) speakingBtn.classList.remove("on");
  speakingBtn = btn || null; if (btn) btn.classList.add("on");
  const go = () => {
    const u = new SpeechSynthesisUtterance(clean);
    u.lang = "ru-RU"; u.rate = S.settings.rate; if (webVoice) u.voice = webVoice;
    u.onend = u.onerror = window.onSpeechEnd;
    speechSynthesis.speak(u);
  };
  // No iPhone, cancelar e falar no mesmo instante às vezes descarta a fala nova
  if (speechSynthesis.speaking || speechSynthesis.pending) { speechSynthesis.cancel(); setTimeout(go, 80); } else go();
}
function voiceHelp() {
  const ios = `<p class="muted" style="margin:0">No iPhone: Ajustes › Acessibilidade › Conteúdo Falado › Vozes › <b>Russo</b> › baixe <b>Milena (Melhorada)</b> ou <b>Yuri (Melhorada)</b>. Depois feche o app (deslize para cima) e abra de novo.</p>`;
  const other = `<p class="muted" style="margin:0">No Android (Chrome): Configurações › Gerenciamento geral › Saída de conversão de texto em voz › Mecanismo Google › instalar dados de voz › <b>Русский</b>. No computador, instale o idioma russo nas configurações de fala do sistema.</p>`;
  modal(`<h3>Voz russa</h3>${IS_IOS ? ios : other}<p class="small muted" style="margin:0">${ruVoices.length ? `Vozes russas encontradas: ${ruVoices.map(v => esc(v.name)).join(", ")}.` : "Nenhuma voz russa encontrada neste aparelho ainda."}</p>
  <button class="btn btn-s" data-act="test-voice">Testar: «Здравствуйте!»</button>
  <button class="btn btn-s" data-act="close-modal">Fechar</button>`);
}
const vib = p => { try { navigator.vibrate && navigator.vibrate(p); } catch (e) { } };

/* ---------------- UI helpers ---------------- */
let toastT;
function toast(msg) { const t = $("#toast"); t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => t.hidden = true, 2800); }
function modal(html) { const m = $("#modal"); m.innerHTML = `<div class="modal-in">${html}</div>`; m.hidden = false; }
function closeModal() { $("#modal").hidden = true; $("#modal").innerHTML = ""; }
function sheet(html) { const s = $("#sheet"); s.innerHTML = `<div class="sheet-in"><div class="grab"></div>${html}</div>`; s.hidden = false; }
function closeSheet() { $("#sheet").hidden = true; $("#sheet").innerHTML = ""; }
function applyTheme() {
  const t = S.settings.theme;
  if (t === "auto") document.documentElement.removeAttribute("data-theme"); else document.documentElement.setAttribute("data-theme", t);
  const bg = getComputedStyle(document.body).backgroundColor;
  const m = bg.match(/\d+/g) || [243, 244, 248];
  const hex = "#" + m.slice(0, 3).map(x => (+x).toString(16).padStart(2, "0")).join("");
  const light = (+m[0] + +m[1] + +m[2]) / 3 > 128;
  document.querySelectorAll('meta[name="theme-color"]').forEach((m, i) => { if (i) m.remove(); else { m.removeAttribute("media"); m.setAttribute("content", hex); } });
}
if (window.matchMedia) { const mq = matchMedia("(prefers-color-scheme: dark)"); mq.addEventListener && mq.addEventListener("change", () => applyTheme()); }

/* ---------------- roteamento ---------------- */
let route = "home";
const listState = { words: { lv: "all", q: "", n: 60 }, phrases: { c: "", q: "", n: 50 }, questions: { c: "", q: "", n: 40 } };
function go(r) { if (route === "session" && r !== "session") endSessionSilently(); route = r; render(); $("#view").scrollTop = 0; }
window.appBack = function () {
  if (!$("#modal").hidden) { closeModal(); return true; }
  if (!$("#sheet").hidden) { closeSheet(); return true; }
  if (route === "session") { confirmQuit(); return true; }
  if (route === "result" || route === "settings" || route === "levelup") { go(route === "settings" ? "home" : "train"); return true; }
  if (route !== "home") { go("home"); return true; }
  return false;
};
window.onAppPause = () => save();
function render() {
  const v = $("#view");
  const inSession = route === "session" || route === "levelup";
  $("#nav").hidden = inSession;
  v.classList.toggle("full", inSession);
  document.querySelectorAll(".nav-b").forEach(b => b.classList.toggle("on", b.dataset.go === route || (route === "result" && b.dataset.go === "train") || (route === "settings" && b.dataset.go === "home")));
  ({ home: renderHome, train: renderTrain, words: renderWords, phrases: renderPhrases, questions: renderQuestions, settings: renderSettings, session: renderSession, result: renderResult, levelup: renderLevelUp }[route] || renderHome)(v);
}

/* ---------------- estatísticas ---------------- */
function counts() {
  let wm = 0, fm = 0, qm = 0, fix = 0, seenW = 0;
  for (const id in S.items) {
    const s = S.items[id]; if (s.fix) fix++;
    if (id[0] === "w") { if (s.seen) seenW++; if (s.b >= 3) wm++; }
    else if (id[0] === "f") { if (s.b >= 3) fm++; }
    else if (s.b >= 3) qm++;
  }
  return { wm, fm, qm, fix, seenW };
}
function recentAcc(n) { const h = S.hist.slice(-n); return h.length ? h.reduce((a, b) => a + b, 0) / h.length : 0; }
function markDay(correct) {
  const k = todayKey(); const d = S.days[k] || (S.days[k] = { a: 0, c: 0 }); d.a++; if (correct) d.c++;
  if (S.streak.last !== k) {
    const y = new Date(); y.setDate(y.getDate() - 1);
    const yk = y.getFullYear() + "-" + String(y.getMonth() + 1).padStart(2, "0") + "-" + String(y.getDate()).padStart(2, "0");
    S.streak.n = S.streak.last === yk ? S.streak.n + 1 : 1; S.streak.last = k;
  }
}
function streakNow() {
  const k = todayKey(); const y = new Date(); y.setDate(y.getDate() - 1);
  const yk = y.getFullYear() + "-" + String(y.getMonth() + 1).padStart(2, "0") + "-" + String(y.getDate()).padStart(2, "0");
  return (S.streak.last === k || S.streak.last === yk) ? S.streak.n : 0;
}

/* ---------------- telas: início ---------------- */
function renderHome(v) {
  refreshTts();
  const c = counts(); const L = LEVELS[S.level];
  const today = S.days[todayKey()] || { a: 0, c: 0 };
  const dayIdx = Math.floor(Date.now() / 864e5);
  const wd = W[(dayIdx * 37) % 300];
  const acc = S.total.a ? Math.round(S.total.c / S.total.a * 100) : 0;
  v.innerHTML = `
  <div class="ph"><div class="ph-row"><div><p class="hello">Привет!</p><p class="sub">${new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}</p></div>
  <button class="icon-b" data-go="settings" aria-label="Configurações">${ICON.gear}</button></div></div>
  <div class="stack">
    ${installCard()}
    ${!HAS_TTS || (voicesLoaded && !ruVoices.length) ? `<div class="alert"><b>Voz russa não encontrada</b><span>O app funciona, mas não fala as palavras até você instalar a voz russa.</span><button class="btn btn-s" data-act="voice-help">Como instalar</button></div>` : ""}
    <div class="card level-card stack">
      <div class="lv-top"><div class="lv-num">${S.level}</div><div><div class="label">Seu nível</div><div class="lv-name">${L.name}</div><div class="small muted">${L.desc}</div></div></div>
      <div><div class="bar"><i style="width:${Math.max(3, S.prog)}%"></i></div><div class="small muted" style="margin-top:6px">${S.level < MAXL ? `${S.prog}% para o nível ${S.level + 1}` : "Nível máximo — continue revisando"}</div></div>
      <button class="btn btn-p" data-act="start" data-mode="adapt">${ICON.bolt}Treinar agora</button>
      ${c.fix ? `<button class="btn btn-s" data-act="start" data-mode="errors">${ICON.redo}Revisar erros (${c.fix})</button>` : ""}
    </div>
    <div class="stats">
      <div class="stat"><b>${c.wm}</b><span>palavras dominadas de 1.000</span></div>
      <div class="stat"><b>${c.fm + c.qm}</b><span>frases e perguntas dominadas</span></div>
      <div class="stat"><b>${streakNow()}</b><span>dias seguidos treinando</span></div>
      <div class="stat"><b>${acc}%</b><span>de acertos no total</span></div>
      <div class="stat"><b>${today.a}</b><span>exercícios hoje</span></div>
      <div class="stat"><b>${c.fix}</b><span>itens para corrigir</span></div>
    </div>
    <div class="card stack">
      <div class="label">Palavra do dia</div>
      <div class="wotd"><img src="${IMG(wd.i[0])}" alt=""><div style="flex:1;min-width:0"><div class="ru" style="font-size:26px">${esc(wd.w)}</div><span class="phon">${esc(wd.ph)}</span><div class="muted" style="margin-top:4px">${esc(wd.m)}</div></div>${say(wd.w)}</div>
      <div class="small"><span class="ru">${esc(wd.ru)}</span> <span class="muted">— ${esc(wd.pt)}</span></div>
    </div>
  </div>`;
}

/* ---------------- telas: treino (início) ---------------- */
let trainMode = "adapt";
function renderTrain(v) {
  const c = counts(); const L = LEVELS[S.level];
  v.innerHTML = `
  <div class="ph"><h1>Treino</h1><p class="sub">Nível ${S.level} · ${L.name}</p></div>
  <div class="stack">
    <button class="mode-card ${trainMode === "adapt" ? "on" : ""}" data-act="mode" data-mode="adapt"><img src="${IMG(D.catimg["Planos"] || W[0].i[0])}" alt=""><div><b>Treino adaptativo</b><span>Exercícios sorteados. Acertou, o nível sobe; errou, a palavra volta até você acertar.</span></div></button>
    <button class="mode-card ${trainMode === "errors" ? "on" : ""}" data-act="mode" data-mode="errors"><img src="${IMG(D.catimg["Opinião"] || W[0].i[0])}" alt=""><div><b>Revisar erros</b><span>${c.fix ? `${c.fix} ${c.fix === 1 ? "item errado espera" : "itens errados esperam"} por você.` : "Nenhum erro pendente agora."}</span></div></button>
    <div class="set-row"><div class="label">Exercícios por treino</div>
      <div class="seg">${[10, 20, 30].map(n => `<button data-act="len" data-n="${n}" class="${S.settings.len === n ? "on" : ""}">${n}</button>`).join("")}</div></div>
    <div class="card small muted">No nível ${S.level}: ${levelTypesText(S.level)}. Precisão nos últimos 20 exercícios: <b>${Math.round(recentAcc(20) * 100)}%</b>.</div>
    <button class="btn btn-p" data-act="start" data-mode="${trainMode}">${ICON.bolt}Começar</button>
  </div>`;
}
function levelTypesText(L) {
  const t = ["significado da palavra", "palavra em russo"];
  if (L >= 2) t.push("imagem certa");
  if (L >= 3) t.push("ouvir e escolher");
  if (L >= 4) t.push("completar frase", "traduzir frase");
  if (L >= 6) t.push("montar frase");
  if (L >= 7) t.push("responder perguntas");
  if (L >= 8) t.push("ouvir frases");
  return t.join(", ");
}

/* ---------------- motor do treino ---------------- */
let SES = null;
function startSession(mode) {
  const c = counts();
  if (mode === "errors" && !c.fix) { toast("Você não tem erros para revisar agora."); return; }
  SES = { mode, len: S.settings.len, i: 0, done: 0, ok: 0, retry: [], recent: [], missed: {}, startLevel: S.level, cur: null, answered: false, pts: 0 };
  route = "session"; nextEx(); render();
}
function endSessionSilently() { if (SES) save(); }
function levelPool(L) {
  const r = LEVELS[L].rank;
  return { words: W.filter(w => w.n <= r), phrases: P.filter(p => p.len <= phraseMax(L)), questions: L >= 7 ? Q.filter(q => q.len <= (L < 9 ? 6 : 99)) : [] };
}
function chooseItem() {
  const recent = SES.recent.slice(-4);
  // 1) repetição dentro do treino
  if (SES.retry.length && SES.retry[0].at <= SES.i) { const r = SES.retry.shift(); return { id: r.id, type: r.type, retry: true }; }
  const now = Date.now();
  const fixes = Object.keys(S.items).filter(id => S.items[id].fix && !recent.includes(id) && !SES.retry.some(r => r.id === id));
  if (SES.mode === "errors") {
    if (!fixes.length) { if (SES.retry.length) { const r = SES.retry.shift(); return { id: r.id, type: r.type, retry: true }; } return null; }
    fixes.sort((a, b) => S.items[a].d - S.items[b].d); return { id: fixes[0] };
  }
  if (fixes.length && Math.random() < 0.3) { fixes.sort((a, b) => S.items[a].d - S.items[b].d); return { id: fixes[rnd(Math.min(3, fixes.length))] }; }
  const pool = levelPool(S.level);
  const L = S.level;
  let kind = "w"; const r = Math.random();
  if (L >= 7) kind = r < 0.5 ? "w" : r < 0.8 ? "f" : "q";
  else if (L >= 4) kind = r < 0.68 ? "w" : "f";
  const list = kind === "w" ? pool.words : kind === "f" ? pool.phrases : pool.questions;
  const src = list.length ? list : pool.words;
  const due = src.filter(x => { const s = peek(x.id); return s && s.seen && s.b > 0 && s.d <= now && !recent.includes(x.id); });
  if (due.length && Math.random() < 0.4) { due.sort((a, b) => S.items[a.id].d - S.items[b.id].d); return { id: due[rnd(Math.min(4, due.length))].id }; }
  const unseen = src.filter(x => !(peek(x.id) && peek(x.id).seen) && !recent.includes(x.id));
  if (unseen.length && Math.random() < 0.72) return { id: unseen[rnd(Math.min(12, unseen.length))].id };
  const seen = src.filter(x => !recent.includes(x.id));
  const weak = seen.filter(x => { const s = peek(x.id); return s && s.b < 3; });
  const from = weak.length && Math.random() < 0.6 ? weak : seen;
  return { id: pick(from.length ? from : src).id };
}
function typesFor(item, L) {
  const k = item.id[0];
  if (k === "w") {
    const t = ["ru2pt", "pt2ru"];
    if (L >= 2) t.push("ru2img");
    if (L >= 3 && ttsOk()) t.push("listen");
    if (L >= 4 && blankable(item)) t.push("blank");
    return t;
  }
  if (k === "f") {
    const t = ["ruph2pt"];
    if (L >= 5) t.push("pt2ruph");
    if (L >= 6 && item.len >= 2 && item.len <= 9) t.push("build", "build");
    if (L >= 8 && ttsOk()) t.push("listenph");
    return t;
  }
  return ["qa"];
}
function blankable(w) {
  if (!w.fp || w.fp.includes(" ")) return false;
  return tokens(w.ru).some(t => plain(t) === w.fp);
}
function nextEx() {
  const limit = SES.len + 15;
  const mustEnd = (SES.done >= SES.len && !SES.retry.length) || SES.done >= limit;
  if (mustEnd) { finishSession(); return; }
  let c = chooseItem();
  if (!c) { finishSession(); return; }
  let item = byId(c.id);
  const L = SES.mode === "errors" ? Math.max(S.level, 4) : S.level;
  let types = typesFor(item, Math.max(L, c.id[0] === "f" ? 4 : c.id[0] === "q" ? 7 : 1));
  let type = c.type && types.includes(c.type) && c.retry && !c.second ? c.type : pick(types);
  SES.cur = buildEx(item, type, L);
  SES.cur.retry = !!c.retry;
  SES.answered = false; SES.picked = []; SES.i++;
  SES.recent.push(item.id);
  if (SES.cur.autoplay) SES.autoplayPending = true;
}
function distinct(arr, key) { const seen = new Set(); return arr.filter(x => { const k = key(x); if (seen.has(k)) return false; seen.add(k); return true; }); }
const meanKeys = m => new Set(String(m).toLowerCase().replace(/\(.*?\)/g, "").split(/[,;/]/).map(x => x.trim()).filter(Boolean));
function conflicts(a, b) { const A = meanKeys(a.m), B = meanKeys(b.m); for (const k of A) if (B.has(k)) return true; return false; }
function wordDistractors(w, n, L, field) {
  const ok = x => x.id !== w.id && !conflicts(x, w) && plain(x.w) !== plain(w.w) && (field !== "i" || x.i[0] !== w.i[0]);
  const lim = Math.max(LEVELS[L].rank + 60, 120);
  const tiers = [
    W.filter(x => ok(x) && Math.abs(x.n - w.n) <= 250 && x.n <= lim && (L < 9 || x.k === w.k)),
    W.filter(x => ok(x) && Math.abs(x.n - w.n) <= 400),
    W.filter(ok)
  ];
  let out = [];
  for (const t of tiers) {
    out = distinct(out.concat(shuffle(t)), x => field === "i" ? x.i[0] : plain(x[field]));
    if (out.length >= n) break;
  }
  return out.slice(0, n);
}
function phraseDistractors(p, n, field) {
  const same = shuffle(P.filter(x => x.id !== p.id && x.c === p.c && x[field] !== p[field]));
  const other = shuffle(P.filter(x => x.id !== p.id && x.c !== p.c && Math.abs(x.len - p.len) <= 2));
  return distinct(same.concat(other), x => x[field]).slice(0, n);
}
const YESNO = /^(да|нет|конечно|спасибо)(?![а-яё])/i;
function answerDistractors(q, n, L) {
  const yn = YESNO.test(q.a);
  const pool = shuffle(Q.filter(x => x.id !== q.id && x.a !== q.a && (L >= 9 ? x.c === q.c : x.c !== q.c)));
  const good = pool.filter(x => !(yn && YESNO.test(x.a)) && !(YESNO.test(x.a) && yn));
  const list = (good.length >= n ? good : pool);
  return distinct(list, x => x.a).slice(0, n);
}
function buildEx(item, type, L) {
  const ex = { item, type, id: item.id };
  const H = hints();
  if (type === "ru2pt") {
    const ds = wordDistractors(item, 3, L, "m");
    ex.kind = "Qual é o significado?";
    ex.prompt = `<div class="big" lang="ru">${esc(item.w)}</div>${H ? `<span class="phon">${esc(item.ph)}</span>` : ""}${say(item.w)}`;
    ex.opts = shuffle([{ t: esc(item.m), ok: 1 }].concat(ds.map(d => ({ t: esc(d.m) }))));
  } else if (type === "pt2ru") {
    const ds = wordDistractors(item, 3, L, "w");
    ex.kind = "Como se diz em russo?";
    ex.prompt = `${L <= 3 ? `<img src="${IMG(item.i[0])}" alt="">` : ""}<div class="pt-prompt">${esc(item.m)}</div>`;
    ex.opts = shuffle([item].concat(ds)).map(d => ({ t: `<span lang="ru">${esc(d.w)}</span>${H ? `<span class="sp">${esc(d.ph)}</span>` : ""}`, ok: d === item ? 1 : 0 }));
  } else if (type === "ru2img") {
    const ds = wordDistractors(item, 3, L, "i");
    ex.kind = "Qual imagem corresponde?"; ex.imgs = true;
    ex.prompt = `<div class="big" lang="ru">${esc(item.w)}</div>${H ? `<span class="phon">${esc(item.ph)}</span>` : ""}${say(item.w)}`;
    ex.opts = shuffle([item].concat(ds)).map(d => ({ t: `<img src="${IMG(d.i[0])}" alt=""><span class="cap" hidden>${esc(d.m)}</span>`, ok: d === item ? 1 : 0 }));
  } else if (type === "listen") {
    const ds = wordDistractors(item, 3, L, "w");
    ex.kind = "Ouça e escolha a palavra";
    ex.prompt = say(item.w, "big") + `<div class="small muted">Toque para ouvir de novo</div>`;
    ex.autoplay = item.w;
    ex.opts = shuffle([item].concat(ds)).map(d => ({ t: `<span lang="ru">${esc(d.w)}</span>`, ok: d === item ? 1 : 0 }));
  } else if (type === "blank") {
    const toks = item.ru.split(/(\s+)/);
    let done = false;
    const html = toks.map(t => { const core = t.replace(/[«»"“”.,!?…:;]/g, ""); if (!done && core && plain(core) === item.fp) { done = true; return t.replace(core, "<u>&nbsp;</u>"); } return esc(t); }).join("");
    const ds = distinct(shuffle(W.filter(x => x.id !== item.id && !conflicts(x, item) && x.k === item.k && x.n <= LEVELS[L].rank + 150 && !x.fp.includes(" ") && x.fp !== item.fp)), x => x.fp).slice(0, 3);
    ex.kind = "Complete a frase";
    ex.prompt = `<div class="blank" lang="ru">${html}</div><div class="muted">${esc(item.pt)}</div>`;
    ex.opts = shuffle([item].concat(ds)).map(d => ({ t: `<span lang="ru">${esc(d.first)}</span>`, ok: d === item ? 1 : 0 }));
  } else if (type === "ruph2pt") {
    const ds = phraseDistractors(item, 3, "pt");
    ex.kind = "O que significa a frase?";
    ex.prompt = `<div class="mid" lang="ru">${esc(item.ru)}</div>${H ? `<span class="sp">${esc(item.rp)}</span>` : ""}${say(item.ru)}`;
    ex.opts = shuffle([{ t: esc(item.pt), ok: 1 }].concat(ds.map(d => ({ t: esc(d.pt) }))));
  } else if (type === "pt2ruph") {
    const ds = phraseDistractors(item, 3, "ru");
    ex.kind = "Como se diz em russo?";
    ex.prompt = `<div class="pt-prompt">${esc(item.pt)}</div>`;
    ex.opts = shuffle([item].concat(ds)).map(d => ({ t: `<span lang="ru">${esc(d.ru)}</span>${H ? `<span class="sp">${esc(d.rp)}</span>` : ""}`, ok: d === item ? 1 : 0 }));
  } else if (type === "listenph") {
    const ds = phraseDistractors(item, 3, "ru");
    ex.kind = "Ouça e escolha a frase";
    ex.prompt = say(item.ru, "big") + `<div class="small muted">Toque para ouvir de novo</div>`;
    ex.autoplay = item.ru;
    ex.opts = shuffle([item].concat(ds)).map(d => ({ t: `<span lang="ru">${esc(d.ru)}</span>`, ok: d === item ? 1 : 0 }));
  } else if (type === "build") {
    ex.kind = "Monte a frase em russo";
    ex.target = tokens(item.ru);
    let extra = [];
    if (L >= 8) { const o = pick(P.filter(x => x.id !== item.id)); extra = shuffle(tokens(o.ru)).filter(t => !ex.target.some(z => plain(z) === plain(t))).slice(0, 2); }
    ex.tiles = shuffle(ex.target.concat(extra)).map((t, i) => ({ t, i }));
    ex.prompt = `<div class="pt-prompt">${esc(item.pt)}</div>`;
  } else if (type === "qa") {
    const ds = answerDistractors(item, 3, L);
    ex.kind = "Escolha a melhor resposta";
    ex.prompt = `<div class="mid" lang="ru">${esc(item.q)}</div>${H ? `<span class="sp">${esc(item.qr)}</span>` : ""}${say(item.q)}<details class="small muted"><summary>ver tradução</summary>${esc(item.qp)}</details>`;
    ex.opts = shuffle([{ t: `<span lang="ru">${esc(item.a)}</span>`, ok: 1 }].concat(ds.map(d => ({ t: `<span lang="ru">${esc(d.a)}</span>` }))));
  }
  return ex;
}
function answerInfo(ex) {
  const it = ex.item;
  if (it.id[0] === "w") return { ru: it.w, ph: it.ph, pt: it.m, extra: `<div class="small"><span class="ru" lang="ru">${esc(it.ru)}</span> <span class="muted">— ${esc(it.pt)}</span></div>` };
  if (it.id[0] === "f") return { ru: it.ru, ph: it.rp, pt: it.pt };
  return { ru: it.a, ph: it.ar, pt: it.ap, pre: `<div class="small muted"><span lang="ru">${esc(it.q)}</span> — ${esc(it.qp)}</div>` };
}
function grade(correct) {
  const ex = SES.cur; const id = ex.id; const s = st(id); const now = Date.now();
  SES.answered = true; SES.done++; s.seen = 1;
  S.total.a++; markDay(correct);
  S.hist.push(correct ? 1 : 0); if (S.hist.length > 40) S.hist.shift();
  let pts;
  if (correct) {
    SES.ok++; S.total.c++; s.c++; s.s++;
    s.b = Math.min(5, s.b + 1); s.d = now + INTERVAL[s.b];
    if (s.fix && s.s >= 2) s.fix = 0;
    if (s.fix) SES.retry.push({ id, type: null, at: SES.i + 3 + rnd(2) }); // precisa acertar 2 vezes seguidas
    pts = ex.retry ? 5 : 8;
  } else {
    s.w++; s.s = 0; s.b = 0; s.fix = 1; s.d = now;
    SES.missed[id] = (SES.missed[id] || 0) + 1;
    SES.retry = SES.retry.filter(r => r.id !== id);
    SES.retry.push({ id, type: ex.type, at: SES.i + 2 + rnd(2) });
    SES.retry.sort((a, b) => a.at - b.at);
    pts = -12; vib([50, 40, 50]);
  }
  SES.pts += pts;
  let up = 0;
  if (SES.mode !== "errors") {
    S.prog += pts;
    if (S.prog >= 100) { if (S.level < MAXL) { S.level++; S.prog = 10; up = 1; } else S.prog = 100; }
    if (S.prog < 0) {
      if (S.level > 1 && S.hist.length >= 10 && recentAcc(10) < 0.5) { S.level--; S.prog = 55; up = -1; }
      else S.prog = 0;
    }
  }
  save();
  return { pts, up };
}

/* ---------------- tela do exercício ---------------- */
function renderSession(v) {
  const ex = SES.cur; if (!ex) return;
  const pct = Math.min(100, Math.round(SES.done / SES.len * 100));
  const opts = ex.opts ? `<div class="opts ${ex.imgs ? "imgs" : ""}">${ex.opts.map((o, i) => `<button class="opt" data-opt="${i}">${o.t}</button>`).join("")}</div>` : "";
  const build = ex.type === "build" ? `<div class="build-area" id="barea">${SES.picked.map((ti, k) => `<button class="tile" data-unpick="${k}" lang="ru">${esc(ex.tiles[ti].t)}</button>`).join("")}</div>
    <div class="tiles">${ex.tiles.map((t, i) => `<button class="tile ${SES.picked.includes(i) ? "used" : ""}" data-tile="${i}" lang="ru">${esc(t.t)}</button>`).join("")}</div>
    <button class="btn btn-p" data-act="check" ${SES.picked.length ? "" : "disabled"}>Verificar</button>` : "";
  v.innerHTML = `
  <div class="t-top"><button class="t-close" data-act="quit" aria-label="Sair do treino">${ICON.x}</button><div class="bar ok"><i style="width:${pct}%"></i></div><span class="t-lv">${SES.mode === "errors" ? "Erros" : "Nív. " + S.level}</span></div>
  <div class="ex">
    <div class="ex-kind">${ex.retry ? "🔁 De novo · " : ""}${ex.kind}</div>
    <div class="prompt">${ex.prompt}</div>
    ${opts}${build}
    <div id="fb"></div>
  </div>`;
  if (SES.autoplayPending) { SES.autoplayPending = false; speak(SES.cur.autoplay, $(".say.big")); }
}
function showFeedback(correct, res) {
  const ex = SES.cur; const a = answerInfo(ex);
  const fb = $("#fb");
  const lvTxt = res.up === 1 ? ` · subiu para o nível ${S.level}!` : res.up === -1 ? ` · voltou para o nível ${S.level}` : "";
  fb.className = "fb " + (correct ? "ok" : "bad");
  fb.innerHTML = `<h3>${correct ? "✓ Correto!" : "✗ Resposta certa:"} <span class="pts">${SES.mode === "errors" ? "" : (res.pts > 0 ? "+" : "") + res.pts + "%" + lvTxt}</span></h3>
    ${a.pre || ""}
    <div class="ans"><div class="mid"><span class="ru" lang="ru">${esc(a.ru)}</span><span class="sp">${esc(a.ph)}</span><span class="pt">${esc(a.pt)}</span></div>${say(a.ru)}</div>
    ${a.extra || ""}
    ${!correct ? `<div class="small muted">Esse item vai voltar daqui a pouco até você acertar.</div>` : ""}
    <button class="btn ${correct ? "btn-ok" : "btn-p"}" data-act="next">Continuar</button>`;
  fb.scrollIntoView({ behavior: "smooth", block: "end" });
  if (S.settings.auto && ttsOk()) speak(a.ru, fb.querySelector(".say"));
  if (res.up === 1) SES.levelUp = true;
}
function onOpt(i) {
  if (SES.answered) return;
  const ex = SES.cur; const o = ex.opts[i]; const correct = !!o.ok;
  const btns = document.querySelectorAll(".opt");
  btns.forEach((b, k) => { if (ex.opts[k].ok) b.classList.add("ok"); else if (k === i) b.classList.add("bad"); else b.classList.add("dim"); });
  if (ex.imgs) document.querySelectorAll(".opt .cap").forEach(c => c.hidden = false);
  const res = grade(correct); showFeedback(correct, res);
}
function onCheckBuild() {
  if (SES.answered) return;
  const ex = SES.cur;
  const got = SES.picked.map(i => plain(ex.tiles[i].t));
  const want = ex.target.map(plain);
  const correct = got.length === want.length && got.every((g, k) => g === want[k]);
  const res = grade(correct); showFeedback(correct, res);
  document.querySelectorAll(".tile").forEach(t => t.disabled = true);
  const chk = document.querySelector('[data-act="check"]'); if (chk) chk.hidden = true;
}
function confirmQuit() {
  modal(`<h3>Sair do treino?</h3><p class="muted" style="margin:0">O progresso deste treino já está salvo. Os erros continuam na lista de revisão.</p>
  <button class="btn btn-p" data-act="quit-yes">Sair</button><button class="btn btn-s" data-act="close-modal">Continuar treinando</button>`);
}
function finishSession() { route = SES.levelUp ? "levelup" : "result"; SES.finished = true; save(); render(); }
function renderLevelUp(v) {
  const L = LEVELS[S.level];
  v.innerHTML = `<div class="levelup stack"><div class="lv-num">${S.level}</div><h2 style="margin:0;font-family:var(--f-display)">Novo nível!</h2><div class="lv-name">${L.name}</div><p class="muted">${L.desc}</p>
  <button class="btn btn-p" data-act="to-result">Ver resultado</button></div>`;
  vib([30, 60, 30, 60, 80]);
}
function renderResult(v) {
  if (!SES) { go("train"); return; }
  const acc = SES.done ? Math.round(SES.ok / SES.done * 100) : 0;
  const missed = Object.keys(SES.missed).map(byId);
  const c = counts();
  v.innerHTML = `
  <div class="ph"><h1>Resultado</h1><p class="sub">${SES.done} exercícios · nível ${S.level} (${LEVELS[S.level].name})</p></div>
  <div class="stack">
    <div class="card stack"><p class="res-big">${acc}%</p><p class="muted" style="text-align:center;margin:0">${SES.ok} acertos de ${SES.done}</p>
    ${SES.mode !== "errors" ? `<div class="bar"><i style="width:${Math.max(3, S.prog)}%"></i></div><div class="small muted">${S.level < MAXL ? `${S.prog}% para o nível ${S.level + 1}` : "Nível máximo"}</div>` : ""}</div>
    ${missed.length ? `<div class="label">Para revisar (${missed.length})</div><div class="list">${missed.map(it => miniRow(it)).join("")}</div>` : `<div class="card">Nenhum erro neste treino. Отлично!</div>`}
    <button class="btn btn-p" data-act="start" data-mode="adapt">${ICON.bolt}Treinar de novo</button>
    ${c.fix ? `<button class="btn btn-s" data-act="start" data-mode="errors">${ICON.redo}Revisar erros (${c.fix})</button>` : ""}
    <button class="btn btn-s" data-go="home">Voltar ao início</button>
  </div>`;
}
function miniRow(it) {
  const a = it.id[0] === "w" ? { ru: it.w, ph: it.ph, pt: it.m } : it.id[0] === "f" ? { ru: it.ru, ph: it.rp, pt: it.pt } : { ru: it.q + " — " + it.a, ph: it.qr + " — " + it.ar, pt: it.qp + " — " + it.ap };
  return `<div class="prow"><div class="mid"><span class="ru" lang="ru">${esc(a.ru)}</span><span class="sp">${esc(a.ph)}</span><span class="pt">${esc(a.pt)}</span></div>${say(it.id[0] === "q" ? it.q + ". " + it.a : a.ru)}</div>`;
}

/* ---------------- listas ---------------- */
const LVN = [{ id: "all", t: "Todas" }, { id: "1", t: "Nível 1", c: "var(--l1)" }, { id: "2", t: "Nível 2", c: "var(--l2)" }, { id: "3", t: "Nível 3", c: "var(--l3)" }, { id: "4", t: "Nível 4", c: "var(--l4)" }, { id: "book", t: "Do livro" }, { id: "fix", t: "Com erro" }, { id: "done", t: "Dominadas" }];
function searchBox(val, ph) { return `<label class="search">${ICON.search}<input id="q" type="search" value="${esc(val)}" placeholder="${ph}" autocomplete="off"></label>`; }
function renderWords(v) {
  const ls = listState.words;
  v.innerHTML = `<div class="ph"><h1>Palavras</h1><p class="sub">As 1.000 mais úteis, da mais usada para a menos usada</p>
    <div style="margin-top:10px">${searchBox(ls.q, "Buscar em russo ou português")}</div>
    <div class="chips">${LVN.map(l => `<button class="chip ${ls.lv === l.id ? "on" : ""}" data-wl="${l.id}">${l.t}</button>`).join("")}</div></div>
    <div class="list" id="list"></div><div id="more"></div>`;
  fillWords();
}
function wordFilter() {
  const ls = listState.words; const q = norm(ls.q.trim());
  return W.filter(w => {
    if (ls.lv === "book" && !w.b) return false;
    if (ls.lv === "fix" && !(peek(w.id) && peek(w.id).fix)) return false;
    if (ls.lv === "done" && !(peek(w.id) && peek(w.id).b >= 3)) return false;
    if (/^[1-4]$/.test(ls.lv) && String(w.l) !== ls.lv) return false;
    return !q || [w.w, w.m, w.ph].some(f => norm(f).includes(q));
  });
}
function fillWords() {
  const ls = listState.words; const list = wordFilter(); const el = $("#list"); if (!el) return;
  const LC = ["", "var(--l1)", "var(--l2)", "var(--l3)", "var(--l4)"];
  el.innerHTML = list.length ? list.slice(0, ls.n).map(w => { const s = peek(w.id);
    return `<div class="item" data-word="${w.n}" style="--c:${LC[w.l]}"><img src="${IMG(w.i[0])}" alt="" loading="lazy"><div class="mid"><div class="w"><span lang="ru">${esc(w.w)}</span>${s && s.b >= 3 ? '<span class="done">✓</span>' : ""}${s && s.fix ? '<span class="tag bad">erro</span>' : ""}</div><span class="phon">${esc(w.ph)}</span><div class="m">${esc(w.m)}</div></div><div style="display:flex;flex-direction:column;align-items:center;gap:6px"><span class="rk">#${w.n}</span>${say(w.w)}</div></div>`; }).join("")
    : `<p class="empty">Nada encontrado.</p>`;
  moreBtn(list.length > ls.n, () => { ls.n += 80; fillWords(); });
}
function moreBtn(show, fn) {
  const m = $("#more"); if (!m) return;
  m.innerHTML = show ? `<button class="btn btn-s" id="morebtn">Mostrar mais</button>` : "";
  if (show) {
    $("#morebtn").onclick = fn;
    if ("IntersectionObserver" in window) { const io = new IntersectionObserver(es => { if (es[0].isIntersecting) { io.disconnect(); fn(); } }, { root: $("#view"), rootMargin: "600px" }); io.observe(m); }
  }
}
function wordSheet(n) {
  const w = W[n - 1]; const s = peek(w.id);
  sheet(`<img class="detail-img" src="${IMG(w.i[0])}" alt="">
  <div class="detail-w" lang="ru">${esc(w.w)}</div>
  <div style="text-align:center;margin:6px 0 4px"><span class="phon" style="font-size:16px">${esc(w.ph)}</span></div>
  <div style="text-align:center;color:var(--muted);font-size:17px;margin-bottom:12px">${esc(w.m)}</div>
  <div style="display:flex;justify-content:center;margin-bottom:14px">${say(w.w, "big")}</div>
  <div class="card stack"><div class="label">Exemplo</div><div class="row" style="align-items:flex-start"><div style="flex:1"><div class="ru" lang="ru" style="font-size:18px">${esc(w.ru)}</div><div class="sp">${esc(w.rp)}</div><div class="muted">${esc(w.pt)}</div></div>${say(w.ru)}</div></div>
  <div class="row" style="flex-wrap:wrap;margin-top:12px;gap:6px"><span class="tag">#${w.n} mais usada</span><span class="tag">${w.k}</span>${w.b ? `<span class="tag book">Livro · lição ${w.b}</span>` : ""}${s ? `<span class="tag ok">${s.c} acertos</span><span class="tag bad">${s.w} erros</span>` : '<span class="tag">ainda não treinada</span>'}</div>`);
}
function catChips(src, cur) {
  const groups = []; src.forEach(x => { if (!groups.includes(x.c)) groups.push(x.c); });
  return `<div class="chips"><button class="chip ${!cur ? "on" : ""}" data-cat="">Todos <span class="ct">${src.length}</span></button>${groups.map(g => `<button class="chip ${cur === g ? "on" : ""}" data-cat="${esc(g)}">${D.catimg[g] ? `<img src="${IMG(D.catimg[g])}" alt="">` : ""}${esc(g)} <span class="ct">${src.filter(x => x.c === g).length}</span></button>`).join("")}</div>`;
}
function renderPhrases(v) {
  const ls = listState.phrases;
  v.innerHTML = `<div class="ph"><h1>Frases úteis</h1><p class="sub">500 frases prontas, por tema</p><div style="margin-top:10px">${searchBox(ls.q, "Buscar frase")}</div>${catChips(P, ls.c)}</div><div class="list" id="list"></div><div id="more"></div>`;
  fillPhrases();
}
function fillPhrases() {
  const ls = listState.phrases; const q = norm(ls.q.trim()); const el = $("#list"); if (!el) return;
  const list = P.filter(p => (!ls.c || p.c === ls.c) && (!q || [p.ru, p.pt, p.rp].some(f => norm(f).includes(q))));
  let html = "", last = "";
  list.slice(0, ls.n).forEach(p => {
    if (p.c !== last) { last = p.c; html += `<div class="cat-h">${D.catimg[p.c] ? `<img src="${IMG(D.catimg[p.c])}" alt="">` : ""}${esc(p.c)}</div>`; }
    const s = peek(p.id);
    html += `<div class="prow"><div class="mid"><span class="ru" lang="ru">${esc(p.ru)}${s && s.b >= 3 ? ' <span class="done">✓</span>' : ""}</span><span class="sp">${esc(p.rp)}</span><span class="pt">${esc(p.pt)}</span></div>${say(p.ru)}</div>`;
  });
  el.innerHTML = html || `<p class="empty">Nada encontrado.</p>`;
  moreBtn(list.length > ls.n, () => { ls.n += 60; fillPhrases(); });
}
function renderQuestions(v) {
  const ls = listState.questions;
  v.innerHTML = `<div class="ph"><h1>Perguntas úteis</h1><p class="sub">500 perguntas com resposta. Toque para ver a resposta.</p><div style="margin-top:10px">${searchBox(ls.q, "Buscar pergunta ou resposta")}</div>${catChips(Q, ls.c)}</div><div class="list" id="list"></div><div id="more"></div>`;
  fillQuestions();
}
function fillQuestions() {
  const ls = listState.questions; const q = norm(ls.q.trim()); const el = $("#list"); if (!el) return;
  const list = Q.filter(x => (!ls.c || x.c === ls.c) && (!q || [x.q, x.qp, x.a, x.ap].some(f => norm(f).includes(q))));
  let html = "", last = "";
  list.slice(0, ls.n).forEach(x => {
    if (x.c !== last) { last = x.c; html += `<div class="cat-h">${D.catimg[x.c] ? `<img src="${IMG(D.catimg[x.c])}" alt="">` : ""}${esc(x.c)}</div>`; }
    html += `<div class="qcard"><div class="row" style="align-items:flex-start"><div style="flex:1;display:flex;flex-direction:column;gap:3px"><span class="ru" lang="ru" style="font-size:17px">${esc(x.q)}</span><span class="sp">${esc(x.qr)}</span><span class="muted small">${esc(x.qp)}</span></div>${say(x.q)}</div>
      <button class="reveal" data-reveal>Ver resposta</button>
      <div class="ans" hidden><div style="flex:1;display:flex;flex-direction:column;gap:3px"><span class="ru" lang="ru">${esc(x.a)}</span><span class="sp">${esc(x.ar)}</span><span class="muted small">${esc(x.ap)}</span></div>${say(x.a)}</div></div>`;
  });
  el.innerHTML = html || `<p class="empty">Nada encontrado.</p>`;
  moreBtn(list.length > ls.n, () => { ls.n += 50; fillQuestions(); });
}

/* ---------------- configurações ---------------- */
function renderSettings(v) {
  const s = S.settings;
  const seg = (key, vals) => `<div class="seg">${vals.map(([val, t]) => `<button data-set="${key}" data-val="${val}" class="${String(s[key]) === String(val) ? "on" : ""}">${t}</button>`).join("")}</div>`;
  refreshTts();
  const tts = ["carregando…", "pronta", "sem voz russa instalada", "indisponível"][ttsState] || "?";
  v.innerHTML = `<div class="ph"><div class="ph-row"><button class="icon-b" data-go="home" aria-label="Voltar">${ICON.back}</button><h1 style="flex:1">Configurações</h1></div></div>
  <div class="stack">
    <div class="set-row"><div class="label">Tema</div>${seg("theme", [["auto", "Automático"], ["light", "Claro"], ["dark", "Escuro"]])}</div>
    <div class="set-row"><div class="label">Velocidade da voz</div>${seg("rate", [[0.7, "Lenta"], [0.9, "Normal"], [1.05, "Rápida"]])}</div>
    <div class="set-row"><div class="label">Pronúncia escrita nos exercícios</div>${seg("phon", [["auto", "Até o nível 5"], ["always", "Sempre"], ["never", "Nunca"]])}</div>
    <div class="set-row"><div class="label">Exercícios por treino</div>${seg("len", [[10, "10"], [20, "20"], [30, "30"]])}</div>
    <button class="switch ${s.auto ? "on" : ""}" data-act="toggle-auto"><span>Falar a resposta depois de responder</span><span class="sw"></span></button>
    <div class="card stack"><div class="label">Voz russa</div>
      <div class="small muted">${HAS_TTS ? (ruVoices.length ? `${ruVoices.length} ${ruVoices.length === 1 ? "voz encontrada" : "vozes encontradas"}` : "Nenhuma voz russa encontrada") : "Este navegador não fala textos"}</div>
      ${ruVoices.length > 1 ? `<select class="btn btn-s" id="voicesel" style="text-align:left">${ruVoices.map(v => `<option value="${esc(v.voiceURI)}" ${webVoice && webVoice.voiceURI === v.voiceURI ? "selected" : ""}>${esc(v.name)}</option>`).join("")}</select>` : ""}
      <button class="btn btn-s" data-act="test-voice">Testar: «Здравствуйте!»</button>
      <button class="btn btn-s" data-act="voice-help">Instalar uma voz melhor</button></div>
    <div class="card stack"><div class="label">Backup do progresso</div><div class="small muted">Guarde uma cópia do seu progresso ou leve para outro aparelho.</div>
      <button class="btn btn-s" data-act="backup">Copiar backup</button>
      <button class="btn btn-s" data-act="restore">Restaurar backup</button></div>
    <div class="card stack"><div class="label">Progresso</div><div class="small muted">Nível ${S.level}, ${S.total.a} exercícios feitos, ${Object.keys(S.items).length} itens já vistos.</div>
      <button class="btn btn-s" data-act="reset" style="color:var(--bad)">Zerar todo o progresso</button></div>
    <p class="small muted">Vocabulário ordenado pela frequência na fala (legendas OpenSubtitles) e no uso geral (wordfreq), com as palavras das lições 1 a 5 do livro Дорога в Россию. Ilustrações: Microsoft Fluent Emoji 3D (licença MIT). Versão web (PWA) 1.0.</p>
  </div>`;
}

/* ---------------- eventos ---------------- */
document.addEventListener("click", e => {
  const t = e.target;
  const sayB = t.closest(".say"); if (sayB) { e.stopPropagation(); speak(sayB.dataset.say, sayB); return; }
  const goB = t.closest("[data-go]"); if (goB) { closeSheet(); go(goB.dataset.go); return; }
  if (t.id === "modal") { closeModal(); return; }
  if (t.id === "sheet") { closeSheet(); return; }
  const opt = t.closest("[data-opt]"); if (opt) { onOpt(+opt.dataset.opt); return; }
  const tile = t.closest("[data-tile]");
  if (tile && !SES.answered) { const i = +tile.dataset.tile; if (!SES.picked.includes(i)) { SES.picked.push(i); renderSession($("#view")); } return; }
  const un = t.closest("[data-unpick]");
  if (un && !SES.answered) { SES.picked.splice(+un.dataset.unpick, 1); renderSession($("#view")); return; }
  const wl = t.closest("[data-wl]"); if (wl) { listState.words.lv = wl.dataset.wl; listState.words.n = 60; render(); return; }
  const cat = t.closest("[data-cat]");
  if (cat) { const ls = route === "phrases" ? listState.phrases : listState.questions; ls.c = cat.dataset.cat; ls.n = 50; render(); return; }
  const wd = t.closest("[data-word]"); if (wd) { wordSheet(+wd.dataset.word); return; }
  const rv = t.closest("[data-reveal]"); if (rv) { rv.hidden = true; rv.nextElementSibling.hidden = false; return; }
  const set = t.closest("[data-set]");
  if (set) { const k = set.dataset.set; let val = set.dataset.val; if (k === "rate" || k === "len") val = +val; S.settings[k] = val; save(); if (k === "theme") applyTheme(); render(); return; }
  const a = t.closest("[data-act]"); if (!a) return;
  const act = a.dataset.act;
  if (act === "start") { closeModal(); startSession(a.dataset.mode); }
  else if (act === "mode") { trainMode = a.dataset.mode; render(); }
  else if (act === "len") { S.settings.len = +a.dataset.n; save(); render(); }
  else if (act === "next") { if (SES.levelUp && !SES.shownUp) { SES.shownUp = true; } nextEx(); if (route === "session") { render(); $("#view").scrollTop = 0; } }
  else if (act === "check") onCheckBuild();
  else if (act === "quit") confirmQuit();
  else if (act === "quit-yes") { closeModal(); if (SES && SES.done) { route = "result"; render(); } else go("train"); }
  else if (act === "to-result") { route = "result"; render(); }
  else if (act === "close-modal") closeModal();
  else if (act === "voice-help") voiceHelp();
  else if (act === "install-app") { if (deferredInstall) { deferredInstall.prompt(); deferredInstall.userChoice.finally(() => { deferredInstall = null; render(); }); } }
  else if (act === "backup") doBackup();
  else if (act === "restore") modal(`<h3>Restaurar backup</h3><p class="muted small" style="margin:0">Cole o código do backup. O progresso atual será substituído.</p><textarea id="bk" rows="5" style="width:100%;border:1px solid var(--line);border-radius:12px;padding:10px;background:var(--surface-2);color:var(--ink);font-family:var(--f-mono);font-size:12px;user-select:text;-webkit-user-select:text"></textarea><button class="btn btn-p" data-act="restore-yes">Restaurar</button><button class="btn btn-s" data-act="close-modal">Cancelar</button>`);
  else if (act === "restore-yes") { try { const txt = $("#bk").value.trim(); const obj = JSON.parse(decodeURIComponent(escape(atob(txt)))); if (!obj || obj.v !== 1) throw 0; S = Object.assign(JSON.parse(JSON.stringify(DEF)), obj, { settings: Object.assign({}, DEF.settings, obj.settings || {}) }); save(); closeModal(); applyTheme(); toast("Progresso restaurado."); go("home"); } catch (err) { toast("Código de backup inválido."); } }
  else if (act === "toggle-auto") { S.settings.auto = !S.settings.auto; save(); render(); }
  else if (act === "test-voice") speak("Здравствуйте!", a.classList.contains("say") ? a : null);
  else if (act === "reset") modal(`<h3>Zerar o progresso?</h3><p class="muted" style="margin:0">Nível, acertos, erros e histórico voltam ao início. Não dá para desfazer.</p><button class="btn btn-p" data-act="reset-yes">Zerar</button><button class="btn btn-s" data-act="close-modal">Cancelar</button>`);
  else if (act === "reset-yes") { S = JSON.parse(JSON.stringify(DEF)); save(); closeModal(); applyTheme(); toast("Progresso zerado."); go("home"); }
});
let qT;
document.addEventListener("input", e => {
  if (e.target.id !== "q") return;
  const ls = listState[route]; if (!ls) return;
  ls.q = e.target.value; ls.n = route === "words" ? 60 : 50;
  clearTimeout(qT); qT = setTimeout(() => { route === "words" ? fillWords() : route === "phrases" ? fillPhrases() : fillQuestions(); }, 150);
});
document.addEventListener("change", e => { if (e.target.id === "voicesel") { S.settings.voice = e.target.value; save(); pickVoice(); speak("Привет!", null); } });
document.addEventListener("visibilitychange", () => { if (document.hidden) save(); });

/* ---------------- PWA: instalação, backup, botão voltar ---------------- */
let deferredInstall = null;
const standalone = () => (window.matchMedia && matchMedia("(display-mode: standalone)").matches) || navigator.standalone === true;
window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); deferredInstall = e; if (route === "home") render(); });
window.addEventListener("appinstalled", () => { deferredInstall = null; toast("App instalado!"); });
function installCard() {
  if (standalone()) return "";
  if (IS_IOS) return `<div class="card stack" style="border-color:var(--phon)"><div class="label" style="color:var(--phon)">Instale no iPhone</div><div class="small">Toque em <b>Compartilhar</b> <svg viewBox="0 0 24 24" style="width:18px;height:18px;vertical-align:-3px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round"><path d="M12 3v12M8 7l4-4 4 4"/><path d="M6 11H5v10h14V11h-1"/></svg> no Safari e depois em <b>Adicionar à Tela de Início</b>. O app passa a abrir em tela cheia e funciona sem internet.</div><div class="small muted">Use sempre o ícone instalado: o progresso fica salvo nele.</div></div>`;
  if (deferredInstall) return `<button class="btn btn-s" data-act="install-app" style="border-color:var(--phon);color:var(--phon)">Instalar o app neste aparelho</button>`;
  return "";
}
function doBackup() {
  const code = btoa(unescape(encodeURIComponent(JSON.stringify(S))));
  const show = () => modal(`<h3>Backup</h3><p class="muted small" style="margin:0">Copie e guarde este código (por exemplo, nas Notas).</p><textarea readonly rows="5" style="width:100%;border:1px solid var(--line);border-radius:12px;padding:10px;background:var(--surface-2);color:var(--ink);font-family:var(--f-mono);font-size:12px;user-select:text;-webkit-user-select:text">${code}</textarea><button class="btn btn-s" data-act="close-modal">Fechar</button>`);
  try { navigator.clipboard.writeText(code).then(() => toast("Backup copiado. Cole nas Notas para guardar."), show); } catch (e) { show(); }
}
try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch (e) { }
try { history.replaceState({ base: 1 }, ""); history.pushState({ app: 1 }, ""); } catch (e) { }
window.addEventListener("popstate", () => { if (window.appBack()) { try { history.pushState({ app: 1 }, ""); } catch (e) { } } else { try { history.back(); } catch (e) { } } });

applyTheme();
render();
