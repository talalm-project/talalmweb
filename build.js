import esbuild from 'esbuild';
import {sassPlugin} from 'esbuild-sass-plugin';
import postcss from 'postcss';
import autoprefixer from 'autoprefixer';
import "dotenv/config";
import fs from 'fs';

const port = 8000;
const args = process.argv.slice(2);
const watch = args.includes("--watch");
const dev = args.includes("--dev");

const watchPlugin = {
  name: 'watch-plugin',
  setup(build) {
    build.onStart(() => {
      console.log(`Build starting: ${new Date(Date.now()).toLocaleString()}`);
    });

    build.onEnd((result) => {
      if(result.errors.length > 0) {
        console.log(`Build finished, with errors ${new Date(Date.now()).toLocaleString()}`);
        console.log(result.errors);
      } else {
        console.log(`Build finished successfully: ${new Date(Date.now()).toLocaleString()}`)
      }
    });
  }
}

let commonSettings = {
  logLevel: 'debug',
  metafile: true,
  entryPoints: [
    'src/styles/index.scss',
    'src/index.js'
  ],
  outdir: 'public/assets',
  bundle: true,
  loader: { 
    '.js': 'jsx',
    ".png": "dataurl",
    ".woff": "dataurl",
    ".woff2": "dataurl",
    ".eot": "dataurl",
    ".ttf": "dataurl",
    ".svg": "dataurl",
  },
  plugins: [
    sassPlugin({
      async transform(source) {
        const { css } = await postcss([autoprefixer]).process(
          source
        );
        return css;
      },
    }),
    watchPlugin
  ],
  define: {
    'API_BASE_URL': JSON.stringify(process.env.API_BASE_URL),
    'TOKEN_BEARER': JSON.stringify(process.env.TOKEN_BEARER),
    'CURRENT_USER': JSON.stringify(process.env.CURRENT_USER),
    'API_VERSION': JSON.stringify(process.env.API_VERSION)
  }
}

let debugSettings = {}
let productionSettings = {}

if(watch ||  dev) {
  // override settings here for debugSettings
  debugSettings = {
    ...commonSettings,
    logLevel: "debug",
    sourcemap: "linked"
  }

  let debugMode = await esbuild.context(debugSettings)
  console.log("Watching for changes...");

  // watch and dev
  if (watch) {
    console.log("Watching for changes...");
    debugMode.watch();
  }

  if(dev) {
    console.log("Debug Mode with" , debugSettings);
    await debugMode.rebuild();   // ensure JS + CSS exist

    injectAssets({
      js: 'assets/index.js',
      css: 'assets/styles/index.css'
    });
    debugMode.serve({
      servedir: 'public',
      port: port,
      fallback: 'index.html'
    });
  }
} else {
  productionSettings = {
    ...commonSettings,
    entryNames: '[name].[hash]',
    assetNames: '[name].[hash]',
    metafile: true
  }

  console.log("Building with" , productionSettings);

  esbuild.build(productionSettings).then((result) => {
    let js, css;
    for (const [outfile, meta] of Object.entries(result.metafile.outputs)) {
      if (meta.entryPoint?.endsWith('src/index.js')) {
        js = outfile.replace('public/', '');
      }
      if (meta.entryPoint?.endsWith('src/styles/index.scss')) {
        css = outfile.replace('public/', '');
      }
    }

    injectAssets({ js, css });
    console.log("Deployment build completed.");
  }).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

function injectAssets({ js, css }) {
  let html = fs.readFileSync('public/index.template.html', 'utf-8');

  html = html.replace(
    '<!-- CSS_PLACEHOLDER -->',
    css ? `<link rel="stylesheet" href="/${css}">` : ''
  );

  html = html.replace(
    '<!-- JS_PLACEHOLDER -->',
    `<script src="/${js}" defer></script>`
  );

  fs.writeFileSync('public/index.html', html);
}
