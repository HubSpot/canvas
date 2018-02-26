const replace = require('rollup-plugin-re');
const path = require('path');

const base = path.join(__dirname, '..');
const paths = {
  canvas: path.join(base, 'canvas-core', 'src'),
  mirror: path.join(base, '..', 'UIComponents', 'static', 'js', 'canvas'),
};

const [_, moduleConfig] = require('../canvas-core/rollup.config');

const inputOptions = {
  ...moduleConfig,
  input: [path.join(paths.canvas, 'components', 'badge', 'Badge.js')],
  experimentalCodeSplitting: true,
  experimentalDynamicImport: true,
  plugins: [
    ...moduleConfig.plugins,
    replace({
      exclude: 'node_modules/**',
      patterns: [
        {
          test: 'classnames',
          replace: 'react-utils/classNames',
        },
      ],
    }),
  ],
};

const outputOptions = {
  dir: path.join(paths.mirror),
  format: 'es',
  banner: "'use es6';",
};

const config = {
  ...inputOptions,
  output: [outputOptions],
  watch: {
    include: 'src/**',
    exclude: 'node_modules/**',
    chokidar: {
      paths: 'src/**',
    },
  },
};

module.exports = {
  config,
  outputOptions,
  paths
};