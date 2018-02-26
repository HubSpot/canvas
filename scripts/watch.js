const rollup = require('rollup');
const watchman = require('fb-watchman');
const { config, outputOptions, paths } = require('./config');

// rollup doesn't (yet) support `watch` with code-splitting :/
// This file is a temporary workaround, until we find a
// solution to: https://github.com/rollup/rollup/issues/1950
// ---
// This stopgap uses facebook's watchman to trigger rebuilds:
// https://facebook.github.io/watchman/docs/nodejs.html
function subscribeToFutureChanges(client, watch, relative_path) {
  client.command(['clock', watch], function(error, resp) {
    if (error) {
      console.error('Failed to query clock:', error);
      return;
    }

    sub = {
      expression: ['allof', ['match', '*.js']],
      fields: ['name', 'size', 'exists', 'type'],
      since: resp.clock,
    };

    if (relative_path) {
      sub.relative_root = relative_path;
    }

    client.command(['subscribe', watch, 'canvas-core-changes', sub]);
  });
}

const runBuild = async () => {
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

const watch = async () => {
  const watcher = new watchman.Client();
  watcher.capabilityCheck(
    { optional: [], required: ['relative_root'] },
    async function(error, resp) {
      if (error) {
        console.log(error);
        watcher.end();
        return;
      }

      watcher.command(['watch-project', paths.canvas], async function(
        error,
        resp
      ) {
        if (error) {
          console.error('Error initiating watch:', error);
          return;
        }

        if ('warning' in resp) {
          console.log('warning: ', resp.warning);
        }

        console.log(
          `watch established on ${resp.watch} relative_path ${
            resp.relative_path
          }`
        );

        subscribeToFutureChanges(watcher, resp.watch, resp.relative_path);

        watcher.on('subscription', async function(resp) {
          if (resp.subscription !== 'canvas-core-changes') return;

          resp.files.forEach(async function(file) {
            // convert Int64 instance to javascript integer
            console.log('file changed: ' + file.name, +file.mtime_ms);
            const out = await runBuild();
            console.log('Built ==>', file.name);
          });
        });
      });
    }
  );
};

watch();
