export const DEFAULT_CONFIG = {
  router_model: "gemini-flash-lite-latest",

  tiers: [
    {
      level: 1,
      label: "Simple",
      // using an array because their might be fallbacks, that could execute if one fails or we could pass something like is_enabled, this could also be fetched from a database
      model_names: [
        { name: "gemini-flash-lite-latest" },
        { name: "gemini-flash-latest" },
      ],
      // the reason for providing this, is to allow the lightweight ai to generate the thinking tokens based on the complexity of the user prompt, we use this as the limit.
      max_thinking_tokens: 0,
      // we could provied other options too. what if the provider is different, I am only using gemini here, but if we had diversity in providers, they could have different apis
      is_thinking_supported: false,
    },
    {
      level: 2,
      label: "Moderate",
      model_names: [{ name: "gemini-3-flash-preview" }],
      max_thinking_tokens: 1600,
      is_thinking_supported: true,
    },
    {
      level: 3,
      label: "Complex",
      model_names: [
        // using flash for now, since 3 pro is not supproted on free tier.
        { name: "gemini-3-flash-preview" },
        { name: "gemini-3-pro-preview" },
      ],
      max_thinking_tokens: 8192,
      is_thinking_supported: true,
    },
  ],
};
