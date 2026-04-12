const { CATEGORY_LABELS, OPERATIONS, formatStats, runOperations, summarizeOperation } = window.TppEngine;

const state = {
  operations: [],
  errors: {},
  editorLayout: "vertical",
  leftWidthPercent: 33,
  outputText: "",
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
  layoutToggleButton: document.getElementById("layoutToggleButton"),
  previewPanel: document.querySelector(".preview-panel"),
  workspace: document.querySelector(".workspace"),
  workspaceResizer: document.getElementById("workspaceResizer"),
};

init();

function init() {
  populateCategorySelect();
  syncOperationSelect();
  renderDynamicFields();
  bindEvents();
  applyEditorLayout();
  applyWorkspaceWidth();
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
  refs.afterText.addEventListener("click", selectAfterText);
  refs.afterText.addEventListener("focus", selectAfterText);
  refs.copyButton.addEventListener("click", copyAfterText);
  refs.layoutToggleButton.addEventListener("click", toggleEditorLayout);

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

  if (refs.workspaceResizer) {
    refs.workspaceResizer.addEventListener("pointerdown", startWorkspaceResize);
  }
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
  refs.dynamicFields.dataset.category = refs.categorySelect.value || "";
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

  if (field.input === "multi-checkbox") {
    const defaultValues = Array.isArray(field.defaultValue) ? field.defaultValue : [];
    return `
      <fieldset class="${fieldClass}">
        <legend class="field-label">${label}</legend>
        <div class="field-checkbox-group">
          ${field.options
            .map((option, index) => {
              const optionId = `${fieldId}-${index}`;
              const checked = defaultValues.includes(option.value) ? "checked" : "";
              return `
                <label class="field-checkbox option-checkbox" for="${optionId}">
                  <input
                    id="${optionId}"
                    type="checkbox"
                    name="${field.name}"
                    value="${escapeAttribute(option.value)}"
                    ${checked}
                  >
                  <span>${escapeHtml(option.label)}</span>
                </label>
              `;
            })
            .join("")}
        </div>
      </fieldset>
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
    if (field.input === "checkbox") {
      const input = refs.dynamicFields.querySelector(`[name="${field.name}"]`);
      if (!input) {
        return;
      }
      values[field.name] = input.checked;
      return;
    }

    if (field.input === "multi-checkbox") {
      const checkedInputs = refs.dynamicFields.querySelectorAll(`[name="${field.name}"]:checked`);
      values[field.name] = Array.from(checkedInputs)
        .map((input) => input.value)
        .join("");
      return;
    }

    if (field.input === "number") {
      const input = refs.dynamicFields.querySelector(`[name="${field.name}"]`);
      if (!input) {
        return;
      }
      values[field.name] = Number(input.value);
      return;
    }

    const input = refs.dynamicFields.querySelector(`[name="${field.name}"]`);
    if (!input) {
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
        <p>ここに追加した処理が上から順に適用されます。</p>
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

  const toggleLabel = operation.enabled ? "有効" : "無効";

  return `
    <li class="${itemClassName}">
      <div class="stack-item-top">
        <span class="category-badge">${escapeHtml(CATEGORY_LABELS[operation.category])}</span>
        <button type="button" class="chip-button ${operation.enabled ? "is-active" : ""}" data-action="toggle" data-id="${operation.id}">${toggleLabel}</button>
      </div>
      <div class="stack-item-head">
        <h3 class="stack-item-title">${index + 1}. ${escapeHtml(operation.label)}</h3>
      </div>
      <p class="stack-item-summary">${escapeHtml(summarizeOperation(operation))}</p>
      <div class="stack-item-actions">
        <button type="button" class="chip-button" data-action="move-up" data-id="${operation.id}">上へ</button>
        <button type="button" class="chip-button" data-action="move-down" data-id="${operation.id}">下へ</button>
        <button type="button" class="chip-button" data-action="remove" data-id="${operation.id}">削除</button>
      </div>
      ${error ? `<div class="stack-item-error">${escapeHtml(error)}</div>` : ""}
    </li>
  `;
}

function recompute() {
  const { output, errors, highlights } = runOperations(refs.beforeText.value, state.operations);
  state.errors = errors;
  state.outputText = output;
  renderAfterText(output, highlights);
  refs.beforeStats.textContent = formatStats(refs.beforeText.value);
  refs.afterStats.textContent = formatStats(output);
  renderStack();
}

function toggleEditorLayout() {
  state.editorLayout = state.editorLayout === "vertical" ? "horizontal" : "vertical";
  applyEditorLayout();
}

function applyEditorLayout() {
  const isVertical = state.editorLayout === "vertical";
  refs.previewPanel.classList.toggle("is-horizontal", !isVertical);
  refs.layoutToggleButton.textContent = isVertical ? "左右表示に切替" : "上下表示に切替";
}

function applyWorkspaceWidth() {
  refs.workspace.style.setProperty("--workspace-left", `${state.leftWidthPercent}%`);
}

function startWorkspaceResize(event) {
  if (window.innerWidth <= 980) {
    return;
  }

  event.preventDefault();
  refs.workspaceResizer.setPointerCapture(event.pointerId);

  const handleMove = (moveEvent) => {
    const bounds = refs.workspace.getBoundingClientRect();
    const nextPercent = ((moveEvent.clientX - bounds.left) / bounds.width) * 100;
    state.leftWidthPercent = Math.max(20, Math.min(50, nextPercent));
    applyWorkspaceWidth();
  };

  const handleUp = () => {
    refs.workspaceResizer.removeEventListener("pointermove", handleMove);
    refs.workspaceResizer.removeEventListener("pointerup", handleUp);
    refs.workspaceResizer.removeEventListener("pointercancel", handleUp);
  };

  refs.workspaceResizer.addEventListener("pointermove", handleMove);
  refs.workspaceResizer.addEventListener("pointerup", handleUp);
  refs.workspaceResizer.addEventListener("pointercancel", handleUp);
}

async function copyAfterText() {
  const text = state.outputText;

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      selectAfterText();
      document.execCommand("copy");
      window.getSelection().removeAllRanges();
      refs.beforeText.focus();
    }
    setCopyFeedback("after をコピーしました。", true);
  } catch (error) {
    setCopyFeedback("コピーに失敗しました。", false);
  }
}

function selectAfterText() {
  refs.afterText.focus();
  const selection = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(refs.afterText);
  selection.removeAllRanges();
  selection.addRange(range);
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

function renderAfterText(text, highlights) {
  refs.afterText.classList.toggle("is-empty", text.length === 0);

  if (!text.length) {
    refs.afterText.innerHTML = "";
    return;
  }

  if (!highlights || !highlights.length) {
    refs.afterText.textContent = text;
    return;
  }

  const fragments = [];
  let cursor = 0;

  highlights.forEach((highlight) => {
    if (highlight.start > cursor) {
      fragments.push(escapeHtml(text.slice(cursor, highlight.start)));
    }

    fragments.push(`<mark class="search-hit">${escapeHtml(text.slice(highlight.start, highlight.end))}</mark>`);
    cursor = highlight.end;
  });

  if (cursor < text.length) {
    fragments.push(escapeHtml(text.slice(cursor)));
  }

  refs.afterText.innerHTML = fragments.join("");
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
