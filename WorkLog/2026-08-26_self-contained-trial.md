# 試用版の単一HTML化

## 実施内容

- `trial/index.html` を直接開けるよう、CSS、JavaScript、WebP画像を単一HTMLへ埋め込む処理を追加した。
- `scripts/build-trial.mjs` を追加し、試用ビルド後の自動インライン化に対応した。
- `npm run build:trial` に単一HTML生成処理を組み込んだ。
- `file://` でエラー候補となっていたブランド部分のページ内リンクを通常要素へ変更した。
- Web版では従来どおり外部の軽量画像を読み込む構成を維持した。
- ローカルサーバー用の `START_TRIAL.cmd` は、直接起動を制限するブラウザ向けのフォールバックとして残した。

## 確認結果

- TypeScript型チェック、試用ビルド、Web版ビルドが成功した。
- `trial/index.html` にインラインCSS、クラシックJavaScript、Base64 WebPが含まれることを確認した。
- ES Module指定とページ内ハッシュリンクが含まれていないことを確認した。
- Web版が相対パスで軽量WebPを参照することを確認した。
- 今回の作業に未完了項目はないため、`WorkingTask/` に個別記録は作成していない。
