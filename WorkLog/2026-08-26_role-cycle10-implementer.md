# 改善ループ10：実装者

## 実施内容

- ロールを実装者へ更新した。
- 設備内部の開閉、オートクリッパーの回収セッション、報酬、累計回収の保存を接続した。
- 所有数1以上でのみ内部を開けるようにした。
- `npm run test:logic`、`npm run build`、`npm run build:trial` が成功した。試用HTMLへ内部景観を含む WebP 22点を埋め込んだ。

## 変更ファイル

- `ROLE.md`
- `src/state.ts`
- `src/save.ts`
- `src/main.ts`
- `src/game/interior.ts`
- `scripts/test-game.mjs`
