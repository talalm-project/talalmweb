const DEFAULT_CONTEXT_WINDOW_TOKENS = 4096;
const APPROX_CHARS_PER_TOKEN = 4;

const positiveNumber = (value) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) && numericValue > 0 ? numericValue : null;
};

export const connectorContextWindow = (connector) => {
  return (
    positiveNumber(connector?.data?.metadata?.inference?.limits?.context_window_tokens) ||
    positiveNumber(connector?.data?.metadata?.inference?.model_options?.n_ctx) ||
    positiveNumber(connector?.data?.model_options?.n_ctx) ||
    positiveNumber(connector?.data?.context_window_tokens) ||
    DEFAULT_CONTEXT_WINDOW_TOKENS
  );
};

export const estimateTextTokens = (value) => {
  const text = String(value || "").trim();
  if (!text) {
    return 0;
  }

  return Math.ceil(text.length / APPROX_CHARS_PER_TOKEN);
};

export const contextWindowUsage = (connector, messages, prompt, renderResponse) => {
  const contextWindow = connectorContextWindow(connector);
  const visibleMessages = Array.isArray(messages) ? messages : [];
  const draftPrompt = String(prompt || "").trim();
  const messageTexts = visibleMessages.map((message) => {
    const role = message.role === "user" ? "User" : "Assistant";
    return `${role}: ${renderResponse(message.content)}`;
  });

  if (draftPrompt) {
    messageTexts.push(`User: ${draftPrompt}`);
  }

  const contentTokens = estimateTextTokens(messageTexts.join("\n\n"));
  const messageOverheadTokens = Math.max(messageTexts.length * 4, 0);
  const usedTokens = Math.min(contextWindow, contentTokens + messageOverheadTokens);
  const remainingTokens = Math.max(contextWindow - usedTokens, 0);
  const remainingPercent = Math.max(0, Math.round((remainingTokens / contextWindow) * 100));
  const level = remainingPercent <= 10 ? "critical" : remainingPercent <= 25 ? "low" : "ok";

  return {
    contextWindow,
    level,
    remainingPercent,
    remainingTokens,
    usedTokens,
  };
};
