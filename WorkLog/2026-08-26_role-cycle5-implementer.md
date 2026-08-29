# 改善ループ5：実装者

## 実施内容

- `REQUIREMENT.md` 16節（自動購入コア）を実装した。
- `src/state.ts`：`UpgradeId` に `autoBuyCore` を追加、`GameState` に `autoBuyEnabled: Record<MachineId, boolean>` を追加、初期値を全設備OFFにした。
- `src/game/definitions.ts`：`autoBuyCore` アップグレード（累計5,000,000クリップで解放、価格1,000,000クリップ）を追加した。
- `src/game/clips.ts`：`isAutoBuyUnlocked` と `autoBuyTick`（ONかつ解放済みの設備を価格の安い順に1台ずつ購入）を追加した。
- `src/save.ts`：`autoBuyEnabled` の保存・復元（欠損時は全OFFにフォールバック）を追加した。
- `src/main.ts`：1秒アキュムレータでゲームループへ `autoBuyTick` を接続し、自動購入で設備マイルストーンへ到達した場合は既存の通知・ログ・カード発光をそのまま適用するようにした。`toggleAutoBuy`／`setAllAutoBuy` アクションと、自動購入コア購入時のみ `AUTO` ログを出す分岐を追加した。リセット時にアキュムレータも初期化した。
- `scripts/test-game.mjs`：`isAutoBuyUnlocked`／`autoBuyTick`（未解放時は購入しない、解放後は安い設備から1台ずつ購入する、未解放設備は対象外）と `autoBuyEnabled` の保存復元（欠損キーは false 補完）のテストを追加した。

## 確認結果

- ゲームロジックテスト（`node scripts/test-game.mjs`）：成功
- TypeScript型チェック＋Webデプロイ用ビルド（`npm run build`）：成功
- 自己完結型試用版ビルド（`npm run build:trial`）：成功
- ブラウザでの動作確認：`localStorage` を直接書き換えて累計5,000,000クリップ相当の状態を再現し、以下を確認した。
  - 自動購入コア未購入時は設備カードのトグル行と一括操作ボタンが `hidden` で非表示（DOM上は存在するがプロパティ・属性とも非表示）
  - 自動購入コアの購入で `AUTO` システムログと通知が発生し、トグル行・一括ボタンが表示される
  - トグルON操作が即座に `localStorage` へ保存され、ON設備のカードに左端の静的ラインが付く
  - ページ再読み込み後も自動購入コアの解放状態と設備ごとのON/OFFが正しく復元される
  - モバイル幅（375px）でトグル行と購入ボタンが重ならないことを座標計算で確認した
  - 実際の自動購入（1秒ごとの購入tick）はブラウザ操作環境で `requestAnimationFrame` が発火しない（タブが常に `document.hidden = true` として扱われる）ため、ライブ実行では確認できなかった。該当ロジック（`autoBuyTick`）自体は `scripts/test-game.mjs` のユニットテストで別途検証済み。

## 変更ファイル

- `src/state.ts`
- `src/game/definitions.ts`
- `src/game/clips.ts`
- `src/save.ts`
- `src/main.ts`
- `src/ui/render.ts`
- `src/style.css`
- `scripts/test-game.mjs`
- `trial/index.html` およびビルド成果物

## 補足

- 自動購入コアは既存のアップグレード購入経路（`buyUpgrade`）をそのまま使い、専用の保存フラグを追加していない（`state.upgrades` に含まれるかどうかで判定）。
- 自動購入はまとめ買い数量（`×1`/`×10`/`MAX`）に関わらず常に1台ずつ購入する。
