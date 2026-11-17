import { defineConfig } from 'vitest/config';
import { relative } from 'node:path';

// Evita que los parentesis de la carpeta de Windows se interpreten como un glob.
export default defineConfig({
  plugins: [{
    name: 'cantomoda-rutas-pruebas',
    enforce: 'post',
    config(config) {
      const normalizar = (project: any) => {
        if (project?.test?.include) {
          project.test.include = project.test.include.map((file: string) =>
            relative(project.root || config.root || process.cwd(), file).replaceAll('\\', '/'));
        }
      };
      normalizar(config);
      for (const project of config.test?.projects || []) {
        if (typeof project === 'object') normalizar(project);
      }
    },
  }],
});
