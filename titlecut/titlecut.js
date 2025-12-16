const input = document.getElementById('titleInput');
const simTitle = document.getElementById('simTitle');
const charCount = document.getElementById('charCount');
const wLabel = document.getElementById('wLabel');

const btnEN = document.getElementById('btn-en');
const btnES = document.getElementById('btn-es');

const elSubtitle   = document.getElementById('tcSubtitle');
const elLabelTitle = document.getElementById('tcLabelTitle');
const elLabelSim   = document.getElementById('tcLabelSim');
const elCharsWord  = document.getElementById('tcCharsWord');
const elWidthWord  = document.getElementById('tcWidthWord');
const elMetaLine   = document.getElementById('tcMetaLine');

const elInfoTitle  = document.getElementById('tcInfoTitle');
const elChipFact   = document.getElementById('tcChipFact');
const elChipConseq = document.getElementById('tcChipConseq');
const elResult     = document.getElementById('tcResult');

const elChecklistTitle = document.getElementById('tcChecklistTitle');
const elCutsTitle      = document.getElementById('tcCutsTitle');
const elChecklist      = document.getElementById('tcChecklist');
const elCuts           = document.getElementById('tcCuts');

const i18n = {
  es: {
    subtitle: "Simula cómo se corta tu título en YouTube mobile (2 líneas + …).",
    labelTitle: "Título",
    labelSim: "Simulador móvil (2 líneas + …)",
    charsWord: "caracteres",
    widthWord: "ancho",
    placeholder: "Pega tu título aquí...",
    metaLine: "Channel Name · 1.2M views · 2 days ago",

    infoTitle: "Fórmula “Zeigarnik Cut”",
    chipFact: "Hecho concreto",
    chipConseq: "Consecuencia incompleta",
    result: "Curiosidad + clic",

    checklistTitle: "Checklist rápida",
    cutsTitle: "Cortes que suelen funcionar",

    checklist: [
      "La parte visible crea una imagen clara (qué pasó).",
      "El corte cae antes del “resultado” o la revelación.",
      "La primera parte no cierra la idea.",
      "Evita frases tipo “no vas a creer…”."
    ],
    cuts: [
      ["Consecuencia", "“...and now I can’t …”"],
      ["Revelación", "“The real reason was …”"],
      ["Contradicción", "“It wasn’t cruel. It was …”"],
      ["Causa sin efecto", "“This depended on the …”"]
    ]
  },

  en: {
    subtitle: "Simulate how your title gets truncated on YouTube mobile (2 lines + …).",
    labelTitle: "Title",
    labelSim: "Mobile simulator (2 lines + …)",
    charsWord: "characters",
    widthWord: "width",
    placeholder: "Paste your title here...",
    metaLine: "Channel Name · 1.2M views · 2 days ago",

    infoTitle: "“Zeigarnik Cut” formula",
    chipFact: "Concrete fact",
    chipConseq: "Incomplete consequence",
    result: "Curiosity + click",

    checklistTitle: "Quick checklist",
    cutsTitle: "Cuts that often work",

    checklist: [
      "The visible part creates a clear image (what happened).",
      "The cut happens before the “outcome” or reveal.",
      "The first part does not close the idea.",
      "Avoid cliché clickbait phrasing (“you won’t believe…”)."
    ],
    cuts: [
      ["Consequence", "“...and now I can’t …”"],
      ["Reveal", "“The real reason was …”"],
      ["Contradiction", "“It wasn’t cruel. It was …”"],
      ["Cause without effect", "“This depended on the …”"]
    ]
  }
};

function norm(s){
  return (s || '')
    .replace(/\u00A0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function update(){
  const t = norm(input.value);
  simTitle.textContent = t || ' ';
  charCount.textContent = t.length;

  const w = getComputedStyle(document.documentElement)
    .getPropertyValue('--mobileWidth').trim();
  wLabel.textContent = w || '—';
}

function fillList(ul, items){
  ul.innerHTML = '';
  for (const it of items){
    const li = document.createElement('li');
    if (Array.isArray(it)){
      li.innerHTML = `<strong>${it[0]}:</strong> ${it[1]}`;
    } else {
      li.textContent = it;
    }
    ul.appendChild(li);
  }
}

function setLang(lang){
  const t = i18n[lang] || i18n.es;

  document.documentElement.lang = lang;

  elSubtitle.textContent = t.subtitle;
  elLabelTitle.textContent = t.labelTitle;
  elLabelSim.textContent = t.labelSim;
  elCharsWord.textContent = t.charsWord;
  elWidthWord.textContent = t.widthWord;
  input.placeholder = t.placeholder;
  elMetaLine.textContent = t.metaLine;

  elInfoTitle.textContent = t.infoTitle;
  elChipFact.textContent = t.chipFact;
  elChipConseq.textContent = t.chipConseq;
  elResult.textContent = t.result;

  elChecklistTitle.textContent = t.checklistTitle;
  elCutsTitle.textContent = t.cutsTitle;

  fillList(elChecklist, t.checklist);
  fillList(elCuts, t.cuts);

  // botones
  btnEN.classList.toggle('active', lang === 'en');
  btnES.classList.toggle('active', lang === 'es');

  localStorage.setItem('titlecut_lang', lang);
}

btnEN?.addEventListener('click', () => setLang('en'));
btnES?.addEventListener('click', () => setLang('es'));

input.addEventListener('input', update);

// Init
const savedLang = localStorage.getItem('titlecut_lang') || 'en';
setLang(savedLang);

input.value = '"It smelled funny while I was welding and now I can’t breathe…"';
update();