import { GoogleGenAI } from "@google/genai";
import z from "zod";

const RouterOutputSchema = z.object({
  level: z.number().describe("The level of complexity of the prompt"),
  thinking_tokens: z.number().describe("The number of thinking tokens"),
  system_prompt: z.string().describe("The system prompt for the model"),
  reasoning: z.string().describe("The reasoning for the decision"),
});

// I used ai to enhance this systemp prompt
function buildRouterSystemPrompt(config) {
  const tierDescriptions = config.tiers
    .map(
      (t) =>
        `  - Level ${t.level} ("${t.label}"): ${
          t.is_thinking_supported
            ? `Thinking supported, max ${t.max_thinking_tokens} tokens`
            : "No thinking required"
        }. Models: ${t.model_names.map((m) => m.name).join(", ")}`,
    )
    .join("\n");

  return `You are an AI query complexity router. Your job is to analyze a user's prompt and decide which model tier should handle it.

## Available Tiers
${tierDescriptions}

## Thinking Token Options
The value you choose will be capped at the tier's max_thinking_tokens.
If the tier does not support thinking (is_thinking_supported = false), set thinking_tokens to 0.

## Classification Guidelines

### Level 1 — Simple
- Greetings, small talk, simple factual questions
- One-liner answers, definitions, translations
- Simple math, unit conversions
- Yes/no questions with straightforward answers
- Formatting or rephrasing short text
→ thinking_tokens: 0

### Level 2 — Moderate
- Summarization of moderate-length text
- Explaining concepts with some depth
- Writing short-to-medium content (emails, paragraphs)
- Comparing two things with reasoning
- Basic code snippets or debugging simple issues
- Multi-step but straightforward tasks
→ thinking_tokens: 800 or 1200

### Level 3 — Complex
- Multi-step reasoning or problem solving
- Long-form content creation (essays, articles, detailed guides)
- Complex code generation, architecture design, debugging intricate issues
- Analysis requiring synthesis of multiple concepts
- Creative writing with specific constraints
- Math proofs, algorithm design, system design
- Tasks requiring planning, trade-off analysis, or deep domain knowledge
→ thinking_tokens: 1600, 2400, 4096, or 8192 based on complexity depth

## System Prompt Crafting
Craft a targeted system prompt for the model that will handle this query. The system prompt should:
- Be specific to the nature of the user's request
- Include relevant context or constraints
- Guide the model to produce the most helpful response
- Be concise but comprehensive
`;
}

/**
 * The Router module responsible for determine prompt complexity.
 */
export class Router {
  constructor(apiKey, config) {
    this.client = new GoogleGenAI({ apiKey });
    this.config = config;
    this.systemPrompt = buildRouterSystemPrompt(config);
  }

  async classify(userPrompt) {
    const response = await this.client.models.generateContent({
      model: this.config.router_model,
      contents: userPrompt,
      config: {
        systemInstruction: this.systemPrompt,
        maxOutputTokens: 512,
        responseMimeType: "application/json",
        responseJsonSchema: z.toJSONSchema(RouterOutputSchema),
      },
    });

    const text = response.text;

    if (!text) {
      throw new Error("Router model returned empty response");
    }

    let parsed;

    try {
      parsed = RouterOutputSchema.parse(JSON.parse(text));
    } catch {
      throw new Error(
        `Router model returned invalid JSON.\nRaw response: ${text}`,
      );
    }

    return this._validate(parsed);
  }

  /**
   * This is maninly used to validate and to clamp values
   * @private
   */
  _validate(decision) {
    const levels = this.config.tiers.map((t) => t.level);

    const maxLevel = Math.max(...levels);
    const minLevel = Math.min(...levels);

    const level = Math.max(minLevel, Math.min(maxLevel, decision.level));

    const tier = this.config.tiers.find((t) => t.level === level);

    if (!tier) {
      throw new Error(`No tier found for level ${level}`);
    }

    let thinkingTokens = decision.thinking_tokens;

    if (!tier.is_thinking_supported) {
      thinkingTokens = 0;
    }

    return {
      level,
      thinking_tokens: thinkingTokens,
      system_prompt: decision.system_prompt,
      reasoning: decision.reasoning,
    };
  }
}
