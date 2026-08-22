/*
 * Restore user messages hidden by Codex's compaction/steering render bug.
 *
 * BigPizzaV3 Codex++ user script. The script is renderer-only: it does not
 * modify Codex session files or the official application package.
 */
(() => {
  "use strict";

  const INSTALL_KEY = "__codexHiddenUserMessageVisibilityFix";
  const VERSION = "1.0.1";
  const RESTORED_SELECTOR = "[data-codex-restored-user-message]";
  const previous = window[INSTALL_KEY];

  if (previous && typeof previous.stop === "function") {
    try {
      previous.stop();
    } catch (error) {
      console.warn("[Hidden user message fix] previous cleanup failed", error);
    }
  }

  const state = {
    observer: null,
    interval: null,
    scheduled: false,
    stopped: false,
    stats: {
      scans: 0,
      affectedTurns: 0,
      restoredMessages: 0,
      lastScanAt: null,
    },
  };

  function reactFiberFor(element) {
    if (!element) return null;
    const key = Object.keys(element).find(
      (candidate) =>
        candidate.startsWith("__reactFiber$") ||
        candidate.startsWith("__reactInternalInstance$"),
    );
    return key ? element[key] : null;
  }

  function turnPropsFor(row) {
    function propsFrom(candidate) {
      let fiber = reactFiberFor(candidate);
      for (let depth = 0; fiber && depth < 50; depth += 1, fiber = fiber.return) {
        const props = fiber.memoizedProps;
        if (props?.turn?.items && props?.mcpTurn?.items) return props;
      }
      return null;
    }

    const rowProps = propsFrom(row);
    if (rowProps) return rowProps;

    for (const candidate of row.querySelectorAll(
      "button, [data-local-conversation-final-assistant], div",
    )) {
      const props = propsFrom(candidate);
      if (props) return props;
    }
    return null;
  }

  function hiddenCompactionMessages(props) {
    const renderedItems = props?.turn?.items;
    const sourceItems = props?.mcpTurn?.items;
    if (!Array.isArray(renderedItems) || !Array.isArray(sourceItems)) return [];

    const firstContentIndex = renderedItems.findIndex((item) =>
      item && !["context-compaction", "model-changed", "personality-changed"].includes(item.type),
    );
    if (firstContentIndex < 0) return [];

    const firstContent = renderedItems[firstContentIndex];
    const hasCompactionPrelude = renderedItems
      .slice(0, firstContentIndex)
      .some((item) => item?.type === "context-compaction");

    // Confirmed bug shape:
    //   context-compaction -> steered -> assistant activity
    // The source MCP turn retains the full userMessage with the same id.
    if (!hasCompactionPrelude || firstContent?.type !== "steered" || !firstContent.id) return [];

    const sourceMessage = sourceItems.find(
      (item) => item?.type === "userMessage" && item.id === firstContent.id,
    );
    return sourceMessage ? [sourceMessage] : [];
  }

  function contentToText(content) {
    if (typeof content === "string") return content;
    if (!Array.isArray(content)) return "";

    return content
      .map((part) => {
        if (!part) return "";
        if (typeof part === "string") return part;
        if (typeof part.text === "string") return part.text;
        if (part.type === "image" || part.type === "inputImage") return "[图片]";
        if (part.type === "localImage") return part.path ? `[图片] ${part.path}` : "[图片]";
        if (typeof part.name === "string") return `[${part.name}]`;
        if (typeof part.path === "string") return `[附件] ${part.path}`;
        return "";
      })
      .filter(Boolean)
      .join("\n")
      .trim();
  }

  function createRestoredMessage(turnKey, message) {
    const wrapper = document.createElement("div");
    wrapper.className = "flex flex-col";
    wrapper.dataset.codexRestoredUserMessage = message.id || turnKey || "unknown";

    const anchor = document.createElement("div");
    anchor.className = "scroll-mt-4";
    anchor.dataset.codexRestoredUserMessageAnchor = "true";

    const align = document.createElement("div");
    align.className = "flex flex-col items-end gap-2";

    const group = document.createElement("div");
    group.className = "group flex w-full flex-col items-end justify-end gap-1";

    const bubble = document.createElement("div");
    bubble.className =
      "bg-token-foreground/5 max-w-[77%] min-w-0 overflow-hidden break-words rounded-2xl px-3 py-2 text-left";
    bubble.dataset.userMessageBubble = "true";
    bubble.title = "由 Codex++ 恢复显示的原始用户消息";

    const text = document.createElement("div");
    text.className = "text-size-chat whitespace-pre-wrap";
    text.textContent = contentToText(message.content) || "[用户消息无可显示的文本内容]";

    bubble.appendChild(text);
    group.appendChild(bubble);
    align.appendChild(group);
    anchor.appendChild(align);
    wrapper.appendChild(anchor);
    return wrapper;
  }

  function removeRestored(row) {
    for (const node of row.querySelectorAll(RESTORED_SELECTOR)) node.remove();
  }

  function scan() {
    if (state.stopped) return state.stats;

    let affectedTurns = 0;
    let restoredMessages = 0;

    for (const row of document.querySelectorAll("[data-turn-key]")) {
      const props = turnPropsFor(row);
      const hiddenMessages = hiddenCompactionMessages(props);
      const nativeUserMessage = row.querySelector(
        "[data-local-conversation-user-anchor='true']:not([data-codex-restored-user-message-anchor])",
      );

      if (!hiddenMessages.length || nativeUserMessage) {
        removeRestored(row);
        continue;
      }

      affectedTurns += 1;
      const turnKey = row.getAttribute("data-turn-key") || props?.turnId || "unknown";
      const desiredIds = new Set(hiddenMessages.map((message) => message.id || turnKey));

      for (const existing of row.querySelectorAll(RESTORED_SELECTOR)) {
        if (!desiredIds.has(existing.dataset.codexRestoredUserMessage)) existing.remove();
      }

      const contentRoot = row.firstElementChild || row;
      for (const message of hiddenMessages) {
        const messageKey = message.id || turnKey;
        const escapedKey = window.CSS?.escape ? CSS.escape(messageKey) : messageKey.replace(/["\\]/g, "\\$&");
        const selector = `[data-codex-restored-user-message="${escapedKey}"]`;
        if (!row.querySelector(selector)) {
          contentRoot.insertBefore(createRestoredMessage(turnKey, message), contentRoot.firstChild);
        }
        restoredMessages += 1;
      }
    }

    state.stats.scans += 1;
    state.stats.affectedTurns = affectedTurns;
    state.stats.restoredMessages = restoredMessages;
    state.stats.lastScanAt = new Date().toISOString();
    return { ...state.stats };
  }

  function scheduleScan() {
    if (state.stopped || state.scheduled || document.hidden) return;
    state.scheduled = true;
    requestAnimationFrame(() => {
      state.scheduled = false;
      scan();
    });
  }

  function stop() {
    state.stopped = true;
    state.observer?.disconnect();
    if (state.interval) clearInterval(state.interval);
    for (const node of document.querySelectorAll(RESTORED_SELECTOR)) node.remove();
    if (window[INSTALL_KEY]?.version === VERSION) delete window[INSTALL_KEY];
  }

  state.observer = new MutationObserver(scheduleScan);
  state.observer.observe(document.documentElement, { childList: true, subtree: true });
  // Codex can swap conversation data without replacing observed DOM nodes.
  // A low-frequency visible-page scan makes navigation and virtualization
  // reliable while keeping the renderer overhead negligible.
  state.interval = setInterval(scheduleScan, 2000);

  window[INSTALL_KEY] = {
    version: VERSION,
    scan,
    stop,
    getStats: () => ({ ...state.stats }),
  };

  scan();
  console.info(`[Hidden user message fix] loaded v${VERSION}`, state.stats);
})();
