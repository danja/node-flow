import { build, serve, BuildOptions } from 'esbuild';

const buildOptsWeb: BuildOptions = {
  entryPoints: ['./src/index.ts'],
  outfile: './dist/web/NodeFlow.js',
  platform: 'browser',
  target: ['esNext'],
  //   format: 'cjs',
  bundle: true,
  sourcemap: true,
  minify: true,
  treeShaking: true,
};

const serveOpts = { servedir: './' };
const flags = process.argv.filter(arg => /--[^=].*/.test(arg));
const enableWatch = (flags.includes('--watch'));

if (enableWatch) {
  buildOptsWeb.watch = {
    onRebuild: (error, result) => {
      if (error) { console.error('watch web development build failed:', error); }
      else { console.log('watch web development build succeeded:', result); }
    }
  };

  serve(serveOpts, {}).then((result) => {
    console.log(`serving extension from "${serveOpts.servedir}" at "http://${result.host}:${result.port}"`);
  });
}

build(buildOptsWeb).then(() => enableWatch ? console.log("watching web development build...") : null);