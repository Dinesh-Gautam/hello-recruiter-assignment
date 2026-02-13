import "dotenv/config";
import { ModelRouter } from "./core/model-router.js";

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error("Missing API key");
    process.exit(1);
  }

  const router = new ModelRouter(apiKey);

  const testPrompts = [
    {
      label: "Simple Query",
      prompt: "What is the capital of France?",
    },
    {
      label: "Moderate Query",
      prompt:
        "Write code to find the largest non duplicate number from the array of non-unique numbers",
    },
    {
      label: "Complex Query",
      prompt:
        "Design a rate-limiting system that can handle large number of conccurent requests",
    },
  ];

  console.log("Demo Started");
  console.log("_".repeat(60));

  function _logLine() {
    console.log("-".repeat(70));
  }

  for (const test of testPrompts) {
    _logLine();
    console.log(`${test.label}`);
    console.log(`Prompt: "${test.prompt}"`);
    _logLine();

    try {
      const result = await router.route(test.prompt);

      console.log(`\n Result:`);
      console.log(`Model Used: ${result.model_used}`);
      console.log(`Tier: ${result.tier.label},  Level ${result.tier.level}`);
      console.log(`Thinking Tokens: ${result.decision.thinking_tokens}`);
      console.log(`Reasoning: ${result.decision.reasoning}`);
      console.log("\nstart ===============================");
      console.log(`\nResponse:\n`);
      console.log(`${result.response}`);
      console.log("\nend ===============================\n");
    } catch (error) {
      console.error(`Error: ${error instanceof Error ? error.message : error}`);
    }
  }

  console.log(`\n${"_".repeat(70)}`);
  console.log("Demo complete!");
}

main();
