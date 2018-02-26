const rollup = require('rollup');
const { config, outputOptions, paths } = require('./config');

const build = async () => {
  try {
    const bundle = await rollup.rollup(config);
    const chunkNames = Object.keys(bundle.chunks)
      .join(', ')
      .replace(/^\.\//g, '');
    console.log('\nGenerating chunks:', chunkNames, '\n');

    await bundle.write(outputOptions);
  } catch (e) {
    console.error("Couldn't build project:", e.message);
  }
};

build();
