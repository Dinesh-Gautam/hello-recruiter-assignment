import { GoogleGenAI } from "@google/genai";

/**
 * The Executor module responsible for running user prompts on the
 * model selected by the Router.
 */
export class Executor {
  constructor(apiKey, config) {
    this.client = new GoogleGenAI({ apiKey });
    this.config = config;
  }

  /**
   * executes the prompt on the model
   */
  async execute(userPrompt, decision) {
    const tier = this.config.tiers.find((t) => t.level === decision.level);

    if (!tier) {
      throw new Error(
        `No model tier found for level ${decision.level}.`,
        `Available levels: ${this.config.tiers.map((t) => t.level).join(", ")}`,
      );
    }

    const errors = [];

    for (const modelEntry of tier.model_names) {
      try {
        const response = await this._callModel(
          modelEntry.name,
          userPrompt,
          decision,
          tier,
        );

        return {
          response,
          model_used: modelEntry.name,
          tier,
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);

        errors.push({ model: modelEntry.name, error: errorMessage });

        console.warn(
          `[Executor] Model "${modelEntry.name}" failed: ${errorMessage}.`,
          `Trying next fallback...`,
        );
      }
    }

    throw new Error(
      `All models in tier "${tier.label}", level ${tier.level} failed.\n`,
      `Errors:\n${errors.map((e) => `- ${e.model}: ${e.error}`).join("\n")}`,
    );
  }

  /**
   * calls the model
   * this could be ehnaced, if we were to use different providers, we could use a Interface that abstracts the provider specific code
   * @private
   */
  async _callModel(modelName, userPrompt, decision, tier) {
    const generationConfig = {
      systemInstruction: decision.system_prompt,
      temperature: this._getTemperatureForLevel(tier.level),
    };

    if (tier.is_thinking_supported && decision.thinking_tokens > 0) {
      generationConfig.thinkingConfig = {
        thinkingBudget: decision.thinking_tokens,
      };
    }

    /* we coul do soemthing like this
    const provider = getProvider(modelName)
    const response = await provider.generateContent({
      model: modelName,
      contents: userPrompt,
      config: generationConfig,
    });
    */

    const response = await this.client.models.generateContent({
      model: modelName,
      contents: userPrompt,
      config: generationConfig,
    });

    const text = response.text?.trim();

    if (!text) {
      throw new Error(`Model "${modelName}" returned empty response`);
    }

    return text;
  }

  /**
   * gets the temperature
   * @private
   */
  _getTemperatureForLevel(level) {
    const temperatureMap = {
      1: 0.3,
      2: 0.7,
      3: 1.0,
    };
    return temperatureMap[level] ?? 0.7;
  }
}
