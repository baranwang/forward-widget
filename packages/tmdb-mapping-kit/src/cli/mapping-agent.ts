import { runMappingAgentCli } from "../mapping-agent.ts";

runMappingAgentCli(process.argv.slice(2)).catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
