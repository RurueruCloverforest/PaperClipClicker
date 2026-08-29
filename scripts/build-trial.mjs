import { cp, readdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const trialDirectory = resolve('trial');
const javascriptPath = resolve(trialDirectory, 'assets/game.js');
const stylesheetPath = resolve(trialDirectory, 'assets/game.css');
const publicArtwork = resolve('public/assets/artwork');
const trialArtwork = resolve(trialDirectory, 'assets/artwork');
const outputPath = resolve(trialDirectory, 'index.html');

await cp(publicArtwork, trialArtwork, { recursive: true });

const [javascriptSource, stylesheetSource, artworkFiles] = await Promise.all([
  readFile(javascriptPath, 'utf8'),
  readFile(stylesheetPath, 'utf8'),
  readdir(trialArtwork),
]);

let inlinedJavascript = javascriptSource;
for (const file of artworkFiles.filter((name) => name.endsWith('.webp'))) {
  const imageBuffer = await readFile(resolve(trialArtwork, file));
  const imageDataUrl = `data:image/webp;base64,${imageBuffer.toString('base64')}`;
  const token = `assets/artwork/${file}`;
  if (!inlinedJavascript.includes(token)) {
    throw new Error(`Trial image reference was not found in the JavaScript bundle: ${token}`);
  }
  inlinedJavascript = inlinedJavascript.replaceAll(token, imageDataUrl);
}
inlinedJavascript = inlinedJavascript.replaceAll('</script', '<\\/script');
const inlinedStylesheet = stylesheetSource.replaceAll('</style', '<\\/style');

const html = `<!doctype html>
<html lang="ja">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#111820" />
    <meta name="description" content="AIとともにペーパークリップ生産を最大化する放置クリッカーゲーム" />
    <title>Paperclip Protocol - Trial Build</title>
    <style>${inlinedStylesheet}</style>
  </head>
  <body>
    <div id="app"></div>
    <script>${inlinedJavascript}</script>
  </body>
</html>
`;

await writeFile(outputPath, html, 'utf8');
console.log(`Self-contained trial written: ${outputPath}`);
