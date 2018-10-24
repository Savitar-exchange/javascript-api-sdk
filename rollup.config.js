import fs         from 'fs';
import pkg        from './package.json'
import resolve    from 'rollup-plugin-node-resolve';
import commonjs   from 'rollup-plugin-commonjs';
import { uglify } from 'rollup-plugin-uglify';
import replace    from 'rollup-plugin-replace';
import { eslint } from "rollup-plugin-eslint";

// Import env from .ENV.json file.
process.env.ENV = process.env.ENV === undefined ? 'development' : process.env.ENV;

const env = JSON.parse(fs.readFileSync('./.'+ process.env.ENV  +'.json'));

let targets = [
  {
    input: 'src/index.js',
    output: [
      { file: pkg.main, exports: 'named', format: 'cjs' },
      { file: pkg.module, exports: 'named', format: 'es' },
    ],
    plugins: [
      replace(env),
      process.env.ENV === 'production' ? eslint() : null,
      resolve(),
      commonjs()
    ],
    external: ['isomorphic-unfetch', 'secure-random', 'jsrsasign', 'inherits']
  },
]

if (process.env.ENV === 'production') {
  targets = targets.concat([
    {
      input: 'src/index.js',
      output: {
        file: 'dist/savitar.min.js',
        name: 'savitar',
        exports: 'named',
        format: 'iife'
      },
      plugins: [
        replace(env),
        resolve({
          browser: true,
         }),
        commonjs(),
        uglify(),
      ]
    },
    {
      input: 'src/index.js',
      output: {
        file: 'dist/savitar.js',
        exports: 'named',
        name: 'savitar',
        format: 'iife'
      },
      plugins: [
        replace(env),
        resolve({
          browser: true,
         }),
        commonjs()
      ]
    },
  ]);
}

export default targets;
