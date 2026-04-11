const CATEGORY_LABELS = {
  delete: "削除系",
  replace: "置換系",
  convert: "変換系",
  regex: "正規表現系",
};

const OPERATIONS = {
  delete: [
    {
      type: "trimLineEdges",
      label: "各行の前後空白を削除",
      description: "行頭と行末の半角スペースとタブを削除します。",
      fields: [],
    },
    {
      type: "removeBlankLines",
      label: "空行を削除",
      description: "空白だけの行も含めて取り除きます。",
      fields: [],
    },
    {
      type: "removeText",
      label: "指定文字列を削除",
      description: "一致した文字列を削除します。",
      fields: [
        {
          name: "target",
          label: "削除する文字列",
          input: "text",
          placeholder: "ex: foo",
          defaultValue: "",
        },
        {
          name: "mode",
          label: "削除回数",
          input: "select",
          defaultValue: "all",
          options: [
            { value: "all", label: "すべて" },
            { value: "first", label: "最初だけ" },
          ],
        },
        {
          name: "caseSensitive",
          label: "大文字小文字を区別する",
          input: "checkbox",
          defaultValue: true,
        },
      ],
    },
    {
      type: "removeSpaces",
      label: "半角スペースを削除",
      description: "ASCII の半角スペースだけを削除します。",
      fields: [],
    },
    {
      type: "removeTabs",
      label: "タブを削除",
      description: "タブ文字を削除します。",
      fields: [],
    },
  ],
  replace: [
    {
      type: "simpleReplace",
      label: "単純置換",
      description: "文字列をそのまま検索して置換します。",
      fields: [
        {
          name: "find",
          label: "検索文字列",
          input: "text",
          placeholder: "ex: foo",
          defaultValue: "",
        },
        {
          name: "replaceWith",
          label: "置換後",
          input: "text",
          placeholder: "ex: bar",
          defaultValue: "",
        },
        {
          name: "mode",
          label: "置換回数",
          input: "select",
          defaultValue: "all",
          options: [
            { value: "all", label: "すべて" },
            { value: "first", label: "最初だけ" },
          ],
        },
        {
          name: "caseSensitive",
          label: "大文字小文字を区別する",
          input: "checkbox",
          defaultValue: true,
        },
      ],
    },
    {
      type: "replaceLineBreaks",
      label: "改行を置換",
      description: "改行コードを任意の文字列に置換します。",
      fields: [
        {
          name: "replaceWith",
          label: "置換後",
          input: "text",
          placeholder: "ex: /",
          defaultValue: "",
          span: 2,
        },
      ],
    },
  ],
  convert: [
    {
      type: "toUpperCase",
      label: "英字を大文字化",
      description: "ASCII 英字を大文字に変換します。",
      fields: [],
    },
    {
      type: "toLowerCase",
      label: "英字を小文字化",
      description: "ASCII 英字を小文字に変換します。",
      fields: [],
    },
    {
      type: "normalizeNewlines",
      label: "改行コードをLFに統一",
      description: "CRLF / CR を LF に変換します。",
      fields: [],
    },
    {
      type: "tabsToSpaces",
      label: "タブをスペースへ変換",
      description: "タブを指定数の半角スペースに変換します。",
      fields: [
        {
          name: "count",
          label: "スペース数",
          input: "number",
          min: 1,
          max: 8,
          defaultValue: 2,
        },
      ],
    },
    {
      type: "toFullWidthAscii",
      label: "英数字・記号を全角化",
      description: "半角 ASCII を全角へ変換します。",
      fields: [],
    },
    {
      type: "toHalfWidthAscii",
      label: "英数字・記号を半角化",
      description: "全角 ASCII を半角へ変換します。",
      fields: [],
    },
  ],
  regex: [
    {
      type: "regexReplace",
      label: "正規表現置換",
      description: "キャプチャやフラグに対応した置換です。",
      fields: [
        {
          name: "pattern",
          label: "パターン",
          input: "text",
          placeholder: "ex: \\d+",
          defaultValue: "",
        },
        {
          name: "flags",
          label: "フラグ",
          input: "text",
          placeholder: "ex: gi",
          defaultValue: "g",
        },
        {
          name: "replaceWith",
          label: "置換後",
          input: "text",
          placeholder: "ex: [number]",
          defaultValue: "",
          span: 2,
        },
      ],
    },
    {
      type: "regexRemove",
      label: "正規表現で削除",
      description: "一致した部分を削除します。",
      fields: [
        {
          name: "pattern",
          label: "パターン",
          input: "text",
          placeholder: "ex: <[^>]+>",
          defaultValue: "",
        },
        {
          name: "flags",
          label: "フラグ",
          input: "text",
          placeholder: "ex: g",
          defaultValue: "g",
        },
      ],
    },
  ],
};

const state = {
  operations: [],
  errors: {},
};

const refs = {
  composerForm: document.getElementById("composerForm"),
  categorySelect: document.getElementById("categorySelect"),
  operationSelect: document.getElementById("operationSelect"),
  dynamicFields: document.getElementById("dynamicFields"),
  stackList: document.getElementById("stackList"),
  stackMeta: document.getElementById("stackMeta"),
  errorMeta: document.getElementById("errorMeta"),
  beforeText: document.getElementById("beforeText"),
  afterText: document.getElementById("afterText"),
  beforeStats: document.getElementById("beforeStats"),
  afterStats: document.getElementById("afterStats"),
  copyButton: document.getElementById("copyButton"),
  copyFeedback: document.getElementById("copyFeedback"),
  clearStackButton: document.getElementById("clearStackButton"),
  clearInputButton: document.getElementById("clearInputButton"),
};

init();

function init() {
  populateCategorySelect();
  syncOperationSelect();
  renderDynamicFields();
  bindEvents();
  renderStack();
  recompute();
}

function bindEvents() {
  refs.categorySelect.addEventListener("change", () => {
    syncOperationSelect();
    renderDynamicFields();
  });

  refs.operationSelect.addEventListener("change", renderDynamicFields);

  refs.composerForm.addEventListener("submit", (event) => {
    event.preventDefault();
    addOperationFromForm();
  });

  refs.stackList.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) {
      return;
    }
    handleStackAction(button.dataset.id, button.dataset.action);
  });

  refs.beforeText.addEventListener("input", recompute);
  refs.copyButton.addEventListener("click", copyAfterText);

  refs.clearStackButton.addEventListener("click", () => {
    state.operations = [];
    state.errors = {};
    renderStack();
    recompute();
  });

  refs.clearInputButton.addEventListener("click", () => {
    refs.beforeText.value = "";
    recompute();
  });
}

function populateCategorySelect() {
  refs.categorySelect.innerHTML = Object.entries(CATEGORY_LABELS)
    .map(([value, label]) => `<option value="${value}">${label}</option>`)
    .join("");
}

function syncOperationSelect() {
  const category = refs.categorySelect.value || "delete";
  refs.operationSelect.innerHTML = OPERATIONS[category]
    .map((operation) => `<option value="${operation.type}">${escapeHtml(operation.label)}</option>`)
    .join("");
}

function getSelectedDefinition() {
  const category = refs.categorySelect.value || "delete";
  const type = refs.operationSelect.value;
  return OPERATIONS[category].find((item) => item.type === type) || null;
}

function renderDynamicFields() {
  const definition = getSelectedDefinition();
  if (!definition) {
    refs.dynamicFields.innerHTML = "";
    return;
  }

  if (!definition.fields.length) {
    refs.dynamicFields.innerHTML = `
      <div class="field span-2">
        <span class="field-label">内容</span>
        <div class="field-help">${escapeHtml(definition.description)}</div>
      </div>
    `;
    return;
  }

  refs.dynamicFields.innerHTML = definition.fields.map(renderField).join("");
}

function renderField(field) {
  const fieldId = `field-${field.name}`;
  const fieldClass = field.span === 2 ? "field span-2" : "field";
  const label = escapeHtml(field.label);

  if (field.input === "checkbox") {
    return `
      <label class="${fieldClass}">
        <span class="field-label">${label}</span>
        <span class="field-checkbox">
          <input
            id="${fieldId}"
            type="checkbox"
            name="${field.name}"
            ${field.defaultValue ? "checked" : ""}
          >
          <span>${label}</span>
        </span>
      </label>
    `;
  }

  if (field.input === "select") {
    return `
      <label class="${fieldClass}" for="${fieldId}">
        <span class="field-label">${label}</span>
        <select id="${fieldId}" name="${field.name}">
          ${field.options
            .map((option) => {
              const selected = option.value === field.defaultValue ? "selected" : "";
              return `<option value="${option.value}" ${selected}>${escapeHtml(option.label)}</option>`;
            })
            .join("")}
        </select>
      </label>
    `;
  }

  if (field.input === "number") {
    return `
      <label class="${fieldClass}" for="${fieldId}">
        <span class="field-label">${label}</span>
        <input
          id="${fieldId}"
          type="number"
          name="${field.name}"
          min="${field.min ?? 0}"
          max="${field.max ?? 999}"
          value="${field.defaultValue ?? 0}"
        >
      </label>
    `;
  }

  return `
    <label class="${fieldClass}" for="${fieldId}">
      <span class="field-label">${label}</span>
      <input
        id="${fieldId}"
        type="text"
        name="${field.name}"
        value="${escapeAttribute(field.defaultValue ?? "")}"
        placeholder="${escapeAttribute(field.placeholder ?? "")}"
      >
    </label>
  `;
}

function addOperationFromForm() {
  const definition = getSelectedDefinition();
  if (!definition) {
    return;
  }

  state.operations.push({
    id: createId(),
    category: refs.categorySelect.value,
    type: definition.type,
    label: definition.label,
    description: definition.description,
    enabled: true,
    values: collectFieldValues(definition.fields),
  });

  renderStack();
  recompute();
}

function collectFieldValues(fields) {
  const values = {};

  fields.forEach((field) => {
    const input = refs.dynamicFields.querySelector(`[name="${field.name}"]`);
    if (!input) {
      return;
    }

    if (field.input === "checkbox") {
      values[field.name] = input.checked;
      return;
    }

    if (field.input === "number") {
      values[field.name] = Number(input.value);
      return;
    }

    values[field.name] = input.value;
  });

  return values;
}

function handleStackAction(id, action) {
  const index = state.operations.findIndex((item) => item.id === id);
  if (index === -1) {
    return;
  }

  if (action === "toggle") {
    state.operations[index].enabled = !state.operations[index].enabled;
  } else if (action === "remove") {
    state.operations.splice(index, 1);
  } else if (action === "move-up" && index > 0) {
    swapOperations(index, index - 1);
  } else if (action === "move-down" && index < state.operations.length - 1) {
    swapOperations(index, index + 1);
  }

  renderStack();
  recompute();
}

function swapOperations(a, b) {
  const temp = state.operations[a];
  state.operations[a] = state.operations[b];
  state.operations[b] = temp;
}

function renderStack() {
  refs.stackMeta.textContent = `${state.operations.length} 個の処理`;

  const errorCount = Object.keys(state.errors).length;
  if (errorCount > 0) {
    refs.errorMeta.hidden = false;
    refs.errorMeta.textContent = `${errorCount} 件の処理でエラーがあります。該当の処理はスキップしています。`;
  } else {
    refs.errorMeta.hidden = true;
  }

  if (!state.operations.length) {
    refs.stackList.innerHTML = `
      <li class="empty-state">
        <strong>まだ処理がありません。</strong>
        <p>上のフォームから処理を追加すると、ここに順番つきで表示されます。</p>
      </li>
    `;
    return;
  }

  refs.stackList.innerHTML = state.operations.map(renderStackItem).join("");
}

function renderStackItem(operation, index) {
  const error = state.errors[operation.id];
  const itemClassName = [
    "stack-item",
    operation.enabled ? "" : "is-disabled",
    error ? "has-error" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const toggleLabel = operation.enabled ? "無効化" : "有効化";

  return `
    <li class="${itemClassName}">
      <div class="stack-item-top">
        <span class="category-badge">${escapeHtml(CATEGORY_LABELS[operation.category])}</span>
        <span class="status-badge">${operation.enabled ? "ON" : "OFF"}</span>
      </div>
      <div class="stack-item-head">
        <h3 class="stack-item-title">${index + 1}. ${escapeHtml(operation.label)}</h3>
      </div>
      <p class="stack-item-summary">${escapeHtml(summarizeOperation(operation))}</p>
      <div class="stack-item-actions">
        <button type="button" class="chip-button" data-action="toggle" data-id="${operation.id}">${toggleLabel}</button>
        <button type="button" class="chip-button" data-action="move-up" data-id="${operation.id}">上へ</button>
        <button type="button" class="chip-button" data-action="move-down" data-id="${operation.id}">下へ</button>
        <button type="button" class="chip-button" data-action="remove" data-id="${operation.id}">削除</button>
      </div>
      ${error ? `<div class="stack-item-error">${escapeHtml(error)}</div>` : ""}
    </li>
  `;
}

function recompute() {
  let output = refs.beforeText.value;
  const nextErrors = {};

  state.operations.forEach((operation) => {
    if (!operation.enabled) {
      return;
    }

    try {
      output = applyOperation(output, operation);
    } catch (error) {
      nextErrors[operation.id] = error instanceof Error ? error.message : String(error);
    }
  });

  state.errors = nextErrors;
  refs.afterText.value = output;
  refs.beforeStats.textContent = formatStats(refs.beforeText.value);
  refs.afterStats.textContent = formatStats(output);
  renderStack();
}

function applyOperation(text, operation) {
  const values = operation.values || {};

  switch (operation.type) {
    case "trimLineEdges":
      return transformLines(text, (line) => line.replace(/^[ \t]+|[ \t]+$/g, ""));
    case "removeBlankLines":
      return transformLines(text, null, { filterBlank: true });
    case "removeText":
      return replacePlainText(text, values.target, "", values.mode, values.caseSensitive);
    case "removeSpaces":
      return text.replace(/ /g, "");
    case "removeTabs":
      return text.replace(/\t/g, "");
    case "simpleReplace":
      return replacePlainText(text, values.find, values.replaceWith, values.mode, values.caseSensitive);
    case "replaceLineBreaks":
      return text.replace(/\r\n?|\n/g, values.replaceWith ?? "");
    case "toUpperCase":
      return text.toUpperCase();
    case "toLowerCase":
      return text.toLowerCase();
    case "normalizeNewlines":
      return text.replace(/\r\n?|\n/g, "\n");
    case "tabsToSpaces":
      return text.replace(/\t/g, " ".repeat(Math.max(1, Number(values.count) || 1)));
    case "toFullWidthAscii":
      return [...text].map(toFullWidthChar).join("");
    case "toHalfWidthAscii":
      return [...text].map(toHalfWidthChar).join("");
    case "regexReplace":
      return text.replace(createRegExp(values.pattern, values.flags), values.replaceWith ?? "");
    case "regexRemove":
      return text.replace(createRegExp(values.pattern, values.flags), "");
    default:
      return text;
  }
}

function replacePlainText(text, find, replaceWith, mode, caseSensitive) {
  if (!find) {
    return text;
  }

  const nextValue = replaceWith ?? "";

  if (caseSensitive) {
    if (mode === "first") {
      const index = text.indexOf(find);
      if (index === -1) {
        return text;
      }
      return text.slice(0, index) + nextValue + text.slice(index + find.length);
    }

    return text.split(find).join(nextValue);
  }

  const flags = mode === "first" ? "i" : "gi";
  return text.replace(new RegExp(escapeRegExp(find), flags), nextValue);
}

function createRegExp(pattern, flags) {
  if (!pattern) {
    throw new Error("パターンが空です。");
  }
  return new RegExp(pattern, flags || "");
}

function transformLines(text, mapper, options = {}) {
  const lineBreak = detectLineBreak(text);
  const normalized = text.replace(/\r\n?|\n/g, "\n");
  const lines = normalized.split("\n");
  const nextLines = [];

  lines.forEach((line) => {
    const nextLine = typeof mapper === "function" ? mapper(line) : line;
    if (options.filterBlank && nextLine.trim() === "") {
      return;
    }
    nextLines.push(nextLine);
  });

  return nextLines.join(lineBreak);
}

function detectLineBreak(text) {
  if (text.includes("\r\n")) {
    return "\r\n";
  }
  if (text.includes("\r")) {
    return "\r";
  }
  return "\n";
}

function summarizeOperation(operation) {
  const values = operation.values || {};

  switch (operation.type) {
    case "removeText":
      return `${safePreview(values.target)} を削除 / ${values.mode === "first" ? "最初だけ" : "すべて"} / ${values.caseSensitive ? "大小区別あり" : "大小区別なし"}`;
    case "simpleReplace":
      return `${safePreview(values.find)} -> ${safePreview(values.replaceWith)} / ${values.mode === "first" ? "最初だけ" : "すべて"} / ${values.caseSensitive ? "大小区別あり" : "大小区別なし"}`;
    case "replaceLineBreaks":
      return `\\n -> ${safePreview(values.replaceWith)}`;
    case "tabsToSpaces":
      return `tab -> ${Number(values.count) || 1} spaces`;
    case "regexReplace":
      return `/${values.pattern || ""}/${values.flags || ""} -> ${safePreview(values.replaceWith)}`;
    case "regexRemove":
      return `/${values.pattern || ""}/${values.flags || ""} に一致する部分を削除`;
    default:
      return operation.description;
  }
}

function safePreview(value) {
  if (value === undefined || value === null || value === "") {
    return "(空文字)";
  }

  return String(value)
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t");
}

function formatStats(text) {
  const lineCount = text.length === 0 ? 0 : text.replace(/\r\n?|\n/g, "\n").split("\n").length;
  return `${text.length} chars / ${lineCount} lines`;
}

async function copyAfterText() {
  const text = refs.afterText.value;

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      refs.afterText.focus();
      refs.afterText.select();
      document.execCommand("copy");
      refs.afterText.setSelectionRange(0, 0);
      refs.beforeText.focus();
    }
    setCopyFeedback("after をコピーしました。", true);
  } catch (error) {
    setCopyFeedback("コピーに失敗しました。", false);
  }
}

function setCopyFeedback(message, isSuccess) {
  refs.copyFeedback.textContent = message;
  refs.copyFeedback.classList.toggle("is-success", isSuccess);
  refs.copyFeedback.classList.toggle("is-error", !isSuccess);

  window.clearTimeout(setCopyFeedback.timerId);
  setCopyFeedback.timerId = window.setTimeout(() => {
    refs.copyFeedback.textContent = "";
    refs.copyFeedback.classList.remove("is-success", "is-error");
  }, 2400);
}

function toFullWidthChar(char) {
  if (char === " ") {
    return "　";
  }

  const code = char.charCodeAt(0);
  if (code >= 0x21 && code <= 0x7e) {
    return String.fromCharCode(code + 0xfee0);
  }
  return char;
}

function toHalfWidthChar(char) {
  if (char === "　") {
    return " ";
  }

  const code = char.charCodeAt(0);
  if (code >= 0xff01 && code <= 0xff5e) {
    return String.fromCharCode(code - 0xfee0);
  }
  return char;
}

function createId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
