type AiMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type RunJsonArgs = {
  messages: AiMessage[];
  temperature?: number;
  maxTokens?: number;
};

type ClaudeApiError = {
  error?: {
    type?: string;
    message?: string;
  };
};

function stripJsonFences(text: string) {
  return text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function removeTrailingCommas(text: string) {
  return text.replace(/,\s*([}\]])/g, "$1");
}

function findBalancedJsonObject(text: string) {
  const clean = stripJsonFences(text);
  const firstBrace = clean.indexOf("{");
  if (firstBrace === -1) return null;

  let depth = 0;
  let inString = false;
  let escapeNext = false;

  for (let i = firstBrace; i < clean.length; i++) {
    const char = clean[i];

    if (escapeNext) {
      escapeNext = false;
      continue;
    }

    if (char === "\\") {
      escapeNext = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (char === "{") depth++;
    if (char === "}") depth--;

    if (depth === 0) return clean.slice(firstBrace, i + 1);
  }

  return null;
}

function extractJson(text: string) {
  const clean = stripJsonFences(text);

  try {
    return JSON.parse(clean);
  } catch {}

  const balanced = findBalancedJsonObject(clean);

  if (!balanced) {
    throw new Error("AI did not return a JSON object.");
  }

  try {
    return JSON.parse(balanced);
  } catch {}

  try {
    return JSON.parse(removeTrailingCommas(balanced));
  } catch (error) {
    console.error("AI_JSON_PARSE_FAILED_RAW:", text);
    console.error("AI_JSON_PARSE_FAILED_EXTRACTED:", balanced);
    throw new Error(
      error instanceof Error
        ? `AI returned invalid JSON: ${error.message}`
        : "AI returned invalid JSON."
    );
  }
}

function getClaudeModelCandidates() {
  const preferred =
    process.env.CLAUDE_MODEL ||
    process.env.ANTHROPIC_MODEL ||
    "claude-3-5-sonnet-20241022";

  return Array.from(
    new Set([
      preferred,
      "claude-3-5-sonnet-20241022",
      "claude-sonnet-4-20250514",
      "claude-sonnet-4-6",
    ])
  );
}

function isRetryableModelError(status: number, data: ClaudeApiError) {
  const message = data?.error?.message?.toLowerCase() || "";
  const type = data?.error?.type?.toLowerCase() || "";

  return (
    status === 400 &&
    (message.includes("model") ||
      message.includes("not found") ||
      message.includes("invalid") ||
      type.includes("invalid_request"))
  );
}

async function callClaudeOnce({
  apiKey,
  model,
  messages,
  temperature,
  maxTokens,
}: {
  apiKey: string;
  model: string;
  messages: AiMessage[];
  temperature: number;
  maxTokens: number;
}) {
  const systemMessage =
    messages.find((message) => message.role === "system")?.content || "";

  const chatMessages = messages
    .filter((message) => message.role !== "system")
    .map((message) => ({
      role: message.role === "assistant" ? "assistant" : "user",
      content: message.content,
    }));

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: Math.min(maxTokens, 1400),
      temperature,
      system: systemMessage,
      messages: chatMessages,
    }),
  });

  let data: any = null;

  try {
    data = await response.json();
  } catch {
    throw new Error(`Claude API returned a non-JSON response: ${response.status}`);
  }

  return { response, data };
}

export async function runClaudeJson({
  messages,
  temperature = 0.25,
  maxTokens = 4200,
}: RunJsonArgs) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error("Missing ANTHROPIC_API_KEY in .env.local or Vercel env.");
  }

  const candidates = getClaudeModelCandidates();

  for (const model of candidates) {
    const { response, data } = await callClaudeOnce({
      apiKey,
      model,
      messages,
      temperature,
      maxTokens,
    });

    if (!response.ok) {
      if (isRetryableModelError(response.status, data)) continue;

      console.error("CLAUDE_API_ERROR:", {
        status: response.status,
        data,
      });

      throw new Error(
        data?.error?.message ||
          `Claude API request failed with status ${response.status}`
      );
    }

    const text =
      data?.content
        ?.map((part: any) => {
          if (part?.type === "text") return part.text || "";
          if (part?.type === "tool_use") return JSON.stringify(part.input || {});
          return "";
        })
        .join("\n")
        .trim() || "";

    if (!text) {
      console.error("CLAUDE_NO_JSON:", data);
      throw new Error("Claude returned empty response.");
    }

    return extractJson(text);
  }

  throw new Error("No valid Claude model worked.");
}


export async function runGeminiJson({
  messages,
  temperature = 0.25,
  maxTokens = 4200,
}: RunJsonArgs) {
  const apiKey = process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    throw new Error("Missing GOOGLE_API_KEY in .env.local or Vercel env.");
  }

  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash-lite";

  const systemMessage =
    messages.find((message) => message.role === "system")?.content || "";

  const userMessages = messages
    .filter((message) => message.role !== "system")
    .map((message) => `${message.role.toUpperCase()}:\n${message.content}`)
    .join("\n\n");

  const prompt = `${systemMessage}

${userMessages}

Return only one valid JSON object. Do not include markdown.`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature,
          maxOutputTokens: Math.min(maxTokens, 4096),
          responseMimeType: "application/json",
        },
      }),
    }
  );

  let data: any = null;

  try {
    data = await response.json();
  } catch {
    throw new Error(`Gemini API returned a non-JSON response: ${response.status}`);
  }

  if (!response.ok) {
    const message = String(data?.error?.message || "").toLowerCase();
    const isQuotaOrRateLimit =
      response.status === 429 ||
      message.includes("quota") ||
      message.includes("rate limit") ||
      message.includes("resource exhausted") ||
      message.includes("too many requests");

    console.error("GEMINI_API_ERROR:", {
      status: response.status,
      data,
      fallback: isQuotaOrRateLimit ? "groq" : "none",
    });

    if (isQuotaOrRateLimit && process.env.GROQ_API_KEY) {
      console.warn("GEMINI_QUOTA_FALLBACK_TO_GROQ");
      return runGroqJson({
        messages,
        temperature,
        maxTokens,
      });
    }

    throw new Error(
      data?.error?.message ||
        `Gemini API request failed with status ${response.status}`
    );
  }

  const text =
    data?.candidates?.[0]?.content?.parts
      ?.map((part: any) => part?.text || "")
      .join("\n")
      .trim() || "";

  if (!text) {
    console.error("GEMINI_NO_JSON:", data);
    throw new Error("Gemini returned empty response.");
  }

  return extractJson(text);
}

export async function runGroqJson({
  messages,
  temperature = 0.25,
  maxTokens = 1400,
}: RunJsonArgs) {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error("Missing GROQ_API_KEY in .env.local or Vercel env.");
  }

  const model =
    process.env.GROQ_MODEL ||
    "llama-3.1-8b-instant";

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: Math.min(maxTokens, 1400),
      response_format: { type: "json_object" },
    }),
  });

  let data: any = null;

  try {
    data = await response.json();
  } catch {
    throw new Error(`Groq API returned a non-JSON response: ${response.status}`);
  }

  if (!response.ok) {
    console.error("GROQ_API_ERROR:", {
      status: response.status,
      data,
    });

    throw new Error(
      data?.error?.message ||
        `Groq API request failed with status ${response.status}`
    );
  }

  const text = data?.choices?.[0]?.message?.content || "";

  if (!text.trim()) {
    console.error("GROQ_NO_JSON:", data);
    throw new Error("Groq returned empty response.");
  }

  return extractJson(text);
}
