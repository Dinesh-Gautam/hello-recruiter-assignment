import { Router } from "./router.js";
import { Executor } from "./executor.js";
import { DEFAULT_CONFIG } from "../config/default.js";

export class ModelRouter {
  constructor(apiKey, config) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    if (config?.tiers) {
      this.config.tiers = config.tiers;
    }

    this.router = new Router(apiKey, this.config);
    this.executor = new Executor(apiKey, this.config);
  }

  async route(prompt) {
    console.log("[Router] Classifying prompt complexity...");
    const decision = await this.router.classify(prompt);
    console.log(`[Router] Decision made:`);

    const tier = this.config.tiers.find((t) => t.level === decision.level);
    console.log(
      `[Executor] Routing to tier "${tier.label}" (${tier.model_names.map((m) => m.name).join(" → ")})...`,
    );

    const result = await this.executor.execute(prompt, decision);

    console.log(`[Executor] Response received from "${result.model_used}"`);

    return {
      decision,
      model_used: result.model_used,
      tier: result.tier,
      response: result.response,
    };
  }

  async classify(prompt) {
    return this.router.classify(prompt);
  }
}
