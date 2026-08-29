# ダブルクリック用試用ビルド

## 実施内容

- `trial/index.html` を追加し、サーバーなしで試用できる入口を作成した。
- ES Modulesを使わないIIFE形式の `trial/assets/game.js` を生成した。
- 試用版用CSSを `trial/assets/game.css` として生成した。
- `vite.trial.config.ts` と `npm run build:trial` を追加した。
- `TECHNICAL_DESIGN.md` に通常版と試用版の起動方法を追記した。

## 確認結果

- TypeScript型チェックが成功した。
- 試用ビルドが成功した。
- `trial/index.html` が参照するCSSとJavaScriptが存在することを確認した。
- JavaScriptが `file://` で制限されるES Modulesではなく、クラシックIIFE形式であることを確認した。
- 今回の作業に未完了項目はないため、`WorkingTask/` に個別記録は作成していない。
