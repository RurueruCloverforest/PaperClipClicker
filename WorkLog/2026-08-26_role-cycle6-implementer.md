# 改善ループ6：実装者

## 実施内容

- 現在のロールをアートワーク作成者から実装者へ更新した。
- フェーズ到達補正 `max(100, 毎秒生産量 × 90)` を `src/game/observation.ts` に実装した。
- 付与済みフェーズIDをセーブ対象にし、フィールドがない既存セーブは到達済みフェーズを付与済みとして復元する。
- フェーズ移行時に `VIEW` ログと通知を追加した。
- 試用ビルドが全21点の WebP を単一HTMLへ埋め込むよう `scripts/build-trial.mjs` を更新した。
- 観測補正の単体テストを追加した。

## 確認結果

- `npm run test:logic` 成功
- `npm run build` 成功。`dist/assets/artwork/` に景観8枚と設備アイコン12枚がある
- `npm run build:trial` 成功。試用HTMLへ WebP 21点を data URL として埋め込んだ
- プレビューサーバーへ HTTP 確認し、観測画像と設備アイコンが 200 で返ることを確認した
- ブラウザ自動操作環境がないため、クリックからフェーズ切替までの人手操作は未実施

## 変更ファイル

- `ROLE.md`
- `src/state.ts`
- `src/save.ts`
- `src/main.ts`
- `src/game/observation.ts`
- `src/style.css`
- `scripts/build-trial.mjs`
- `scripts/test-game.mjs`
