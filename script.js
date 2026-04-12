const { CATEGORY_LABELS, OPERATIONS, formatStats, runOperations, summarizeOperation } = window.TppEngine;

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
  const { output, errors } = runOperations(refs.beforeText.value, state.operations);
  state.errors = errors;
  refs.afterText.value = output;
  refs.beforeStats.textContent = formatStats(refs.beforeText.value);
  refs.afterStats.textContent = formatStats(output);
  renderStack();
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
