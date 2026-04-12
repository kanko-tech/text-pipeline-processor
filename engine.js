(function (global) {
  const CATEGORY_LABELS = {
    delete: "削除系",
    replace: "置換系",
    convert: "変換系",
    regex: "正規表現",
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
            placeholder: "例：foo",
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
            placeholder: "例：foo",
            defaultValue: "",
          },
          {
            name: "replaceWith",
            label: "置換後",
            input: "text",
            placeholder: "例：bar",
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
            placeholder: "例：/",
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
        type: "regexSearch",
        label: "検索",
        description: "一致した文字を処理結果内で見つけやすく表示します。",
        fields: [
          {
            name: "pattern",
            label: "パターン",
            input: "text",
            placeholder: "例：\\d+",
            defaultValue: "",
            span: 2,
          },
          {
            name: "flags",
            label: "オプション",
            input: "multi-checkbox",
            defaultValue: ["g"],
            span: 2,
            options: [
              { value: "g", label: "g: 文中で見つかった一致箇所をすべて探す" },
              { value: "i", label: "i: アルファベットの大文字小文字を区別せずに探す" },
              { value: "m", label: "m: 複数行テキストで各行の先頭・末尾を判定できるようにする" },
              { value: "s", label: "s: 改行をまたいだ文章も 1 つながりとして一致させる" },
              { value: "u", label: "u: 日本語や記号を含む文字を安定して扱いやすくする" },
            ],
          },
        ],
      },
      {
        type: "regexRemove",
        label: "削除",
        description: "一致した部分を削除します。",
        fields: [
          {
            name: "pattern",
            label: "パターン",
            input: "text",
            placeholder: "例：<[^>]+>",
            defaultValue: "",
            span: 2,
          },
          {
            name: "flags",
            label: "オプション",
            input: "multi-checkbox",
            defaultValue: ["g"],
            span: 2,
            options: [
              { value: "g", label: "g: 文中で見つかったすべての一致箇所を削除する" },
              { value: "i", label: "i: アルファベットの大文字小文字を区別せずに探す" },
              { value: "m", label: "m: 複数行テキストで各行の先頭・末尾を判定できるようにする" },
              { value: "s", label: "s: 改行をまたいだ文章も 1 つながりとして一致させる" },
              { value: "u", label: "u: 日本語や記号を含む文字を安定して扱いやすくする" },
            ],
          },
        ],
      },
      {
        type: "regexReplace",
        label: "置換",
        description: "キャプチャやオプションに対応した置換です。",
        fields: [
          {
            name: "pattern",
            label: "パターン",
            input: "text",
            placeholder: "例：\\d+",
            defaultValue: "",
            span: 2,
          },
          {
            name: "replaceWith",
            label: "置換後",
            input: "text",
            placeholder: "例：[number]",
            defaultValue: "",
            span: 2,
          },
          {
            name: "flags",
            label: "オプション",
            input: "multi-checkbox",
            defaultValue: ["g"],
            span: 2,
            options: [
              { value: "g", label: "g: 文中で見つかったすべての一致箇所を置換する" },
              { value: "i", label: "i: アルファベットの大文字小文字を区別せずに探す" },
              { value: "m", label: "m: 複数行テキストで各行の先頭・末尾を判定できるようにする" },
              { value: "s", label: "s: 改行をまたいだ文章も 1 つながりとして一致させる" },
              { value: "u", label: "u: 日本語や記号を含む文字を安定して扱いやすくする" },
            ],
          },
        ],
      },
    ],
  };

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
        return Array.from(text, toFullWidthChar).join("");
      case "toHalfWidthAscii":
        return Array.from(text, toHalfWidthChar).join("");
      case "regexReplace":
        return text.replace(createRegExp(values.pattern, values.flags), values.replaceWith ?? "");
      case "regexRemove":
        return text.replace(createRegExp(values.pattern, values.flags), "");
      default:
        return text;
    }
  }

  function runOperations(text, operations) {
    let output = text;
    const errors = {};
    let highlights = [];

    operations.forEach((operation) => {
      if (!operation.enabled) {
        return;
      }

      try {
        if (operation.type === "regexSearch") {
          highlights = collectRegexHighlights(output, operation.values || {});
          return;
        }

        output = applyOperation(output, operation);
        highlights = [];
      } catch (error) {
        errors[operation.id] = error instanceof Error ? error.message : String(error);
      }
    });

    return { output, errors, highlights };
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

  function transformLines(text, mapper, options) {
    const nextOptions = options || {};
    const lineBreak = detectLineBreak(text);
    const normalized = text.replace(/\r\n?|\n/g, "\n");
    const lines = normalized.split("\n");
    const nextLines = [];

    lines.forEach((line) => {
      const nextLine = typeof mapper === "function" ? mapper(line) : line;
      if (nextOptions.filterBlank && nextLine.trim() === "") {
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
      case "regexSearch":
        return `/${values.pattern || ""}/${values.flags || ""} に一致する部分を強調表示`;
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

  function collectRegexHighlights(text, values) {
    const regex = createRegExp(values.pattern, ensureGlobalFlags(values.flags));
    const matches = [];
    let match;

    while ((match = regex.exec(text)) !== null) {
      const matchText = match[0] || "";
      const start = match.index;
      const end = start + matchText.length;

      if (end > start) {
        matches.push({ start, end });
      }

      if (matchText.length === 0) {
        regex.lastIndex += 1;
      }
    }

    return matches;
  }

  function ensureGlobalFlags(flags) {
    const source = flags || "";
    return source.includes("g") ? source : `g${source}`;
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

  function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  global.TppEngine = {
    CATEGORY_LABELS,
    OPERATIONS,
    applyOperation,
    runOperations,
    summarizeOperation,
    formatStats,
  };
})(window);
