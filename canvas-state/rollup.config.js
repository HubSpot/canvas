const resolve = require('rollup-plugin-node-resolve');
const commonjs = require('rollup-plugin-commonjs');
const babel = require('rollup-plugin-babel');

const pkg = require('./package.json');

const watch = {
  include: 'src/**',
  exclude: 'node_modules/**',
};

const externals = Object.keys(pkg.dependencies);

module.exports = [
  // UMD build
  {
    input: 'src/index.js',
    output: {
      name: 'HubSpotCanvasState',
      format: 'umd',
      file: pkg.browser,
      globals: {
        'react': 'React',
        'create-react-class': 'createClass',
        'prop-types': 'PropTypes',
        'classnames': 'classnames',
      },
    },
    external: externals,
    plugins: [
      resolve(),
      babel({
        exclude: ['node_modules/**'],
        externalHelpers: false,
      }),
      commonjs({
        include: 'node_modules/**',
      }),
    ],
    watch,
  },

  // CommonJS and ES module
  {
    input: 'src/index.js',
    output: [
      { file: pkg.main, format: 'cjs' },
      { file: pkg.module, format: 'es' }
    ],
    external: externals,
    plugins: [
      resolve(),
      babel({
        exclude: ['node_modules/**'],
        externalHelpers: false,
      }),
    ],
    watch,
  },
];
