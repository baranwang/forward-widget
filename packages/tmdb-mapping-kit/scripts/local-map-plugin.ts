import path from "node:path";
import { generateLocalMap, readLocalMapSourceFiles } from "../src/generate-local-map";

export const localMapPlugin = () => ({
  name: "tmdb-local-map",
  setup(api: {
    transform: (
      options: { test: string },
      handler: (context: { code: string; addDependency: (dependency: string) => void }) => { code: string },
    ) => void;
    onAfterBuild: (callback: () => void) => void;
    context: { distPath: string };
  }) {
    api.transform({ test: "/src/local-map.ts$/" }, ({ code, addDependency }) => {
      for (const sourceFile of readLocalMapSourceFiles()) {
        addDependency(sourceFile.filePath);
      }
      return { code };
    });

    api.onAfterBuild(() => {
      const localMapPath = path.resolve(api.context.distPath, "local-map.js");
      generateLocalMap({ outputPath: localMapPath });
    });
  },
});
