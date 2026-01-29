const input = document.getElementById('titleInput');
const simTitle = document.getElementById('simTitle');
const charCount = document.getElementById('charCount');
const widthSlider = document.getElementById('widthSlider');
const widthDisplay = document.getElementById('widthDisplay');
const ytMock = document.getElementById('ytMock');

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

widthSlider.addEventListener('input', (e) => setWidth(e.target.value));
input.addEventListener('input', update);

// Init
const savedWidth = localStorage.getItem('tc_width') || '360';
widthSlider.value = savedWidth;
setWidth(savedWidth);
input.value = "Bizarre Plant Doesn't Photosynthesize and Pretends to Be a Mushroom";
update();
