const input = document.getElementById('titleInput');
const simTitle = document.getElementById('simTitle');
const charCount = document.getElementById('charCount');
const widthSlider = document.getElementById('widthSlider');
const widthDisplay = document.getElementById('widthDisplay');
const ytMock = document.getElementById('ytMock');

const i18n = {
    en: {
        title: "Video Title", chars: "characters", sim: "Mobile Simulation (iPhone)",
        formula: "Zeigarnik Formula", 
        tips: ["Visible part shows 'what happened'.", "The cut (...) hides the reveal.", "Don't finish the idea."]
    },
    es: {
        title: "Título del Video", chars: "caracteres", sim: "Simulador Móvil (iPhone)",
        formula: "Fórmula Zeigarnik",
        tips: ["La parte visible muestra 'qué pasó'.", "El corte (...) oculta la revelación.", "No cierres la idea."]
    }
};

function update() {
    const text = input.value.trim();
    simTitle.textContent = text || "Type your title to see simulation...";
    charCount.textContent = text.length;
}

function setWidth(val) {
    ytMock.style.width = val + 'px';
    widthDisplay.textContent = val + 'px';
    localStorage.setItem('tc_width', val);
}

function setLang(lang) {
    const t = i18n[lang];
    document.getElementById('lbl-title').textContent = t.title;
    document.getElementById('lbl-chars').textContent = t.chars;
    document.getElementById('lbl-sim').textContent = t.sim;
    document.getElementById('lbl-formula-title').textContent = t.formula;
    
    const list = document.getElementById('tc-tips-list');
    list.innerHTML = "";
    t.tips.forEach(tip => {
        const li = document.createElement('li');
        li.textContent = tip;
        list.appendChild(li);
    });

    document.querySelectorAll('.tc-lang button').forEach(b => 
        b.classList.toggle('active', b.id.includes(lang))
    );
}

widthSlider.addEventListener('input', (e) => setWidth(e.target.value));
input.addEventListener('input', update);
document.getElementById('btn-en').onclick = () => setLang('en');
document.getElementById('btn-es').onclick = () => setLang('es');

// Init
const savedWidth = localStorage.getItem('tc_width') || '360';
widthSlider.value = savedWidth;
setWidth(savedWidth);
setLang('en');
input.value = "Bizarre Plant Doesn't Photosynthesize and Pretends to Be a Mushroom";
update();