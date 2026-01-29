const input = document.getElementById("input");
const wordCount = document.getElementById("wordCount");
const changeCount = document.getElementById("changeCount");
const statusLabel = document.getElementById("status");
const statusDot = document.getElementById("statusDot");
const runBtn = document.getElementById("run");
const clearBtn = document.getElementById("clear");
const copyOutputBtn = document.getElementById("copyOutput");
const saveMarkdownBtn = document.getElementById("saveMarkdown");
const openIgnoredBtn = document.getElementById("openIgnored");
const ignoredModal = document.getElementById("ignoredModal");
const ignoredList = document.getElementById("ignoredList");
const saveIgnored = document.getElementById("saveIgnored");
const closeIgnored = document.getElementById("closeIgnored");

const STORAGE_KEY = "blizlab_corrector_ignored";
const alwaysCorrect = new Set(["mas"]);

const simpleCorrections = new Map([
  ["qeu", "que"],
  ["aun", "aún"],
  ["mas", "más"],
  ["solo", "sólo"],
  ["tmb", "también"],
  ["tambien", "también"],
  ["donde", "dónde"],
  ["como", "cómo"],
  ["por que", "porque"],
  ["porqué", "por qué"],
  ["haber", "a ver"],
  ["k", "que"],
  ["xq", "porque"],
  ["xq?", "¿por qué?"],
]);

let ignoredWords = loadIgnoredWords();

function setStatus(text, active = false) {
  statusLabel.textContent = text;
  statusDot.classList.toggle("active", active);
}

function normalizeWord(word) {
  return word.trim().toLowerCase();
}

function loadIgnoredWords() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return new Set();
    return new Set(list.map(item => normalizeWord(item)).filter(Boolean));
  } catch (error) {
    return new Set();
  }
}

function saveIgnoredWords() {
  const list = Array.from(ignoredWords.values()).filter(Boolean).sort();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function isIgnoredWord(word) {
  const key = normalizeWord(word);
  if (!key) return false;
  if (alwaysCorrect.has(key)) return false;
  return ignoredWords.has(key);
}

function addIgnoredWord(word) {
  const key = normalizeWord(word);
  if (!key || alwaysCorrect.has(key)) return;
  ignoredWords.add(key);
  saveIgnoredWords();
}

function removeIgnoredWord(word) {
  const key = normalizeWord(word);
  if (!key) return;
  ignoredWords.delete(key);
  saveIgnoredWords();
}

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function applySimpleCorrections(text) {
  const edits = [];
  simpleCorrections.forEach((value, key) => {
    const regex = new RegExp(`\\b${key}\\b`, "gi");
    let match;
    while ((match = regex.exec(text)) !== null) {
      const original = match[0];
      const originalKey = normalizeWord(original);
      const replacement = original === original.toUpperCase() ? value.toUpperCase() : value;
      if (original !== replacement && (!isIgnoredWord(original) || alwaysCorrect.has(originalKey))) {
        edits.push({ offset: match.index, length: original.length, replacement, original });
      }
    }
  });

  let corrected = text;
  edits
    .sort((a, b) => b.offset - a.offset)
    .forEach(edit => {
      corrected =
        corrected.slice(0, edit.offset) +
        edit.replacement +
        corrected.slice(edit.offset + edit.length);
    });

  return { corrected, edits };
}

function buildOutputHtml(original, edits, ignoredRanges = []) {
  const ranges = [...ignoredRanges].sort((a, b) => a.start - b.start);
  const orderedEdits = [...edits].sort((a, b) => a.offset - b.offset);
  let cursor = 0;
  let html = "";

  orderedEdits.forEach(edit => {
    const before = original.slice(cursor, edit.offset);
    html += wrapSegment(before, cursor, ranges);
    const originalEncoded = encodeURIComponent(edit.original || "");
    const correctedEncoded = encodeURIComponent(edit.replacement || "");
    html += `<span class="change" data-original="${originalEncoded}" data-corrected="${correctedEncoded}">${escapeHtml(edit.replacement)}</span>`;
    cursor = edit.offset + edit.length;
  });

  html += wrapSegment(original.slice(cursor), cursor, ranges);
  return html || "";
}

function wrapSegment(segmentText, segmentStart, ranges) {
  if (!segmentText) return "";
  let html = "";
  let index = 0;
  const segmentEnd = segmentStart + segmentText.length;

  ranges.forEach(range => {
    const start = Math.max(range.start, segmentStart);
    const end = Math.min(range.end, segmentEnd);
    if (end <= start) return;
    const relStart = start - segmentStart;
    const relEnd = end - segmentStart;
    html += escapeHtml(segmentText.slice(index, relStart));
    html += `<span class="flag">${escapeHtml(segmentText.slice(relStart, relEnd))}</span>`;
    index = relEnd;
  });

  html += escapeHtml(segmentText.slice(index));
  return html;
}

function editsOverlap(a, b) {
  const aStart = a.offset;
  const aEnd = a.offset + a.length;
  const bStart = b.offset;
  const bEnd = b.offset + b.length;

  if (a.length === 0 && b.length === 0) return aStart === bStart;
  if (a.length === 0) return aStart >= bStart && aStart < bEnd;
  if (b.length === 0) return bStart >= aStart && bStart < aEnd;
  return aStart < bEnd && bStart < aEnd;
}

function mergeEdits(primary, additional) {
  const combined = [...primary];
  additional.forEach(edit => {
    const hasOverlap = combined.some(existing => editsOverlap(existing, edit));
    if (!hasOverlap) combined.push(edit);
  });
  return combined;
}

function applyEdits(text, edits) {
  let corrected = text;
  [...edits]
    .sort((a, b) => b.offset - a.offset)
    .forEach(edit => {
      corrected =
        corrected.slice(0, edit.offset) +
        edit.replacement +
        corrected.slice(edit.offset + edit.length);
    });
  return corrected;
}

async function runCorrection() {
  const original = input.textContent || "";
  if (!original.trim()) {
    input.textContent = "";
    changeCount.textContent = "0 cambios";
    return;
  }

  setStatus("Corrigiendo…", true);
  runBtn.disabled = true;

  let ignoredRanges = [];
  let edits = [];

  try {
    const response = await fetch("https://api.languagetool.org/v2/check", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        text: original,
        language: "es",
        enabledOnly: "false",
      }),
    });
    if (!response.ok) throw new Error("HTTP error");
    const data = await response.json();
    const result = applyLanguageToolFixes(original, data.matches || []);
    ignoredRanges = result.ignoredRanges;
    edits = result.edits;
  } catch (error) {
    const result = applySimpleCorrections(original);
    edits = result.edits;
    ignoredRanges = [];
  }

  const forcedEdits = findForcedEdits(original);
  const combinedEdits = mergeEdits(edits, forcedEdits);

  input.innerHTML = buildOutputHtml(original, combinedEdits, ignoredRanges);
  changeCount.textContent = `${combinedEdits.length} cambios`;
  setStatus("Listo", false);
  runBtn.disabled = false;
}

function shouldIgnoreCorrection(text, match) {
  const original = text.slice(match.offset, match.offset + match.length);
  const replacement = match.replacements?.[0]?.value || "";
  const prevChar = match.offset > 0 ? text[match.offset - 1] : "";
  const atSentenceStart = match.offset === 0 || /[.!?\n\r]/.test(prevChar);
  const startsWithUpper = /^[A-ZÁÉÍÓÚÑ]/.test(original);
  const originalAllCaps = /^[A-ZÁÉÍÓÚÑ]+$/.test(original);
  const replacementAllCaps = /^[A-ZÁÉÍÓÚÑ]+$/.test(replacement);
  const originalAsciiWord = /^[A-Za-z]+$/.test(original);
  const replacementHasNonAscii = /[^\x00-\x7F]/.test(replacement);

  if (startsWithUpper && !atSentenceStart) return true;
  if (replacementAllCaps && !originalAllCaps) return true;
  if (originalAsciiWord && replacementHasNonAscii) return true;
  if (isIgnoredWord(original)) return true;
  return false;
}

function applyLanguageToolFixes(text, matches) {
  const ignoredRanges = [];
  const edits = matches
    .filter(match => match.replacements && match.replacements.length)
    .filter(match => {
      if (shouldIgnoreCorrection(text, match)) {
        ignoredRanges.push({ start: match.offset, end: match.offset + match.length });
        return false;
      }
      return true;
    })
    .map(match => ({
      offset: match.offset,
      length: match.length,
      replacement: match.replacements[0].value,
      original: text.slice(match.offset, match.offset + match.length),
    }))
    .sort((a, b) => b.offset - a.offset);

  return { ignoredRanges, edits };
}

function findForcedEdits(text) {
  const edits = [];
  const regex = /\bmas\b/gi;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const original = match[0];
    const replacement = original === original.toUpperCase() ? "MÁS" : "más";
    if (original !== replacement) {
      edits.push({ offset: match.index, length: original.length, replacement, original });
    }
  }
  return edits;
}

function updateWordCount() {
  const text = input.textContent || "";
  wordCount.textContent = `${text.trim() ? text.trim().split(/\s+/).length : 0} palabras`;
}

function htmlToMarkdown(html) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const { body } = doc;

  function normalizeInlineText(text) {
    return text
      .replace(/\u00a0/g, " ")
      .replace(/\s+/g, " ");
  }

  function textFrom(node, options = {}) {
    if (node.nodeType === Node.TEXT_NODE) return normalizeInlineText(node.textContent || "");
    if (node.nodeType !== Node.ELEMENT_NODE) return "";
    const tag = node.tagName.toLowerCase();
    if (tag === "br") return "\n";
    if (tag === "strong" || tag === "b") {
      return options.stripBold ? childrenText(node, options) : `**${childrenText(node, options)}**`;
    }
    if (tag === "em" || tag === "i") return `*${childrenText(node, options)}*`;
    if (tag === "code") return `\`${childrenText(node, options)}\``;
    if (tag === "a") {
      const href = node.getAttribute("href") || "";
      const label = childrenText(node, options) || href;
      return href ? `[${label}](${href})` : label;
    }
    if (tag === "h1") return `# ${childrenText(node, { ...options, stripBold: true })}\n\n`;
    if (tag === "h2") return `## ${childrenText(node, { ...options, stripBold: true })}\n\n`;
    if (tag === "h3") return `### ${childrenText(node, { ...options, stripBold: true })}\n\n`;
    if (tag === "h4") return `#### ${childrenText(node, { ...options, stripBold: true })}\n\n`;
    if (tag === "h5") return `##### ${childrenText(node, { ...options, stripBold: true })}\n\n`;
    if (tag === "h6") return `###### ${childrenText(node, { ...options, stripBold: true })}\n\n`;
    if (tag === "p") return `${childrenText(node, options)}\n\n`;
    if (tag === "blockquote") return `> ${childrenText(node, options).replace(/\n/g, "\n> ")}\n\n`;
    if (tag === "ul") return `${listText(node, "- ")}\n`;
    if (tag === "ol") return `${listText(node, "1. ")}\n`;
    return childrenText(node, options);
  }

  function childrenText(node, options = {}) {
    let result = "";
    node.childNodes.forEach(child => {
      result += textFrom(child, options);
    });
    return result;
  }

  function listText(listNode, prefix) {
    let result = "";
    const items = Array.from(listNode.children).filter(el => el.tagName.toLowerCase() === "li");
    items.forEach((item, index) => {
      const actualPrefix = prefix === "1. " ? `${index + 1}. ` : prefix;
      const text = childrenText(item).trim();
      result += `${actualPrefix}${text}\n`;
    });
    return result;
  }

  return childrenText(body)
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function insertTextAtCursor(text) {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    input.textContent += text;
    return;
  }
  const range = selection.getRangeAt(0);
  range.deleteContents();
  const node = document.createTextNode(text);
  range.insertNode(node);
  range.setStartAfter(node);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
}

function getCurrentText() {
  return input.textContent || "";
}

function getTitleFromMarkdown(text) {
  const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  if (!lines.length) return "";
  const firstLine = lines[0].replace(/^#+\s*/, "");
  const safe = firstLine
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!safe) return "";
  return safe.slice(0, 30);
}

function openIgnoredModal() {
  ignoredList.value = Array.from(ignoredWords).sort().join("\n");
  ignoredModal.classList.add("open");
  ignoredModal.setAttribute("aria-hidden", "false");
}

function closeIgnoredModal() {
  ignoredModal.classList.remove("open");
  ignoredModal.setAttribute("aria-hidden", "true");
}

input.addEventListener("input", () => {
  updateWordCount();
  changeCount.textContent = `${input.querySelectorAll(".change").length} cambios`;
});

input.addEventListener("paste", (event) => {
  const html = event.clipboardData?.getData("text/html");
  if (html) {
    event.preventDefault();
    const markdown = htmlToMarkdown(html);
    insertTextAtCursor(markdown);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }
});

function toggleAllMatches(original, toState) {
  const normalized = normalizeWord(original);
  const nodes = input.querySelectorAll("[data-original]");
  nodes.forEach(node => {
    const nodeOriginal = decodeURIComponent(node.dataset.original || "");
    if (normalizeWord(nodeOriginal) !== normalized) return;
    const nodeCorrected = decodeURIComponent(node.dataset.corrected || "");
    if (toState === "reverted") {
      node.textContent = nodeOriginal;
      node.classList.remove("change");
      node.classList.add("reverted");
    } else {
      node.textContent = nodeCorrected || node.textContent;
      node.classList.remove("reverted");
      node.classList.add("change");
    }
  });
}

input.addEventListener("click", (event) => {
  const target = event.target.closest(".change, .reverted");
  if (!target) return;
  const original = decodeURIComponent(target.dataset.original || "");
  if (!original) return;

  if (target.classList.contains("change")) {
    toggleAllMatches(original, "reverted");
    addIgnoredWord(original);
  } else {
    toggleAllMatches(original, "change");
    removeIgnoredWord(original);
  }

  changeCount.textContent = `${input.querySelectorAll(".change").length} cambios`;
});

runBtn.addEventListener("click", runCorrection);

clearBtn.addEventListener("click", () => {
  input.textContent = "";
  changeCount.textContent = "0 cambios";
  updateWordCount();
  setStatus("Listo", false);
});

copyOutputBtn.addEventListener("click", async () => {
  const text = getCurrentText();
  if (!text.trim()) return;
  try {
    await navigator.clipboard.writeText(text);
    setStatus("Copiado", true);
    setTimeout(() => setStatus("Listo", false), 1200);
  } catch (error) {
    setStatus("No se pudo copiar", false);
  }
});

saveMarkdownBtn.addEventListener("click", () => {
  const text = getCurrentText();
  if (!text.trim()) return;
  const title = getTitleFromMarkdown(text);
  const filename = title ? `${title}.md` : "texto-corregido.md";
  const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
});

openIgnoredBtn.addEventListener("click", openIgnoredModal);
closeIgnored.addEventListener("click", closeIgnoredModal);

saveIgnored.addEventListener("click", () => {
  const lines = ignoredList.value.split(/\r?\n/);
  ignoredWords = new Set(lines.map(line => normalizeWord(line)).filter(Boolean));
  saveIgnoredWords();
  closeIgnoredModal();
});

ignoredModal.addEventListener("click", (event) => {
  if (event.target === ignoredModal) closeIgnoredModal();
});

updateWordCount();
