# 改善ループ6：アートワーク作成者

## 実施内容

- 現在のロールをアートワークデザイナからアートワーク作成者へ更新した。
- 8フェーズの観測景観と12種の設備アイコンを実際に画像生成した。
- 元素材を `Material/` の各フォルダへ `original.jpg` として保存し、`MATERIAL.md` を書いた。
- ゲーム用に WebP へ軽量化し、`public/assets/artwork/` へ配置した。
- `src/artwork.ts` の素材台帳へ全20点を登録した。
- 生産パネルへ観測窓を追加し、設備カードの記号をアイコン画像へ置き換えた。

## 主な判断

- 景観は 960×540、設備アイコンは 128×128 の WebP とした。
- 観測窓は手動生産ボタンと次の目標の間に横長で置き、操作対象にはしていない。
- 設備アイコンは装飾画像とし、読み込み失敗時は既存の記号文字へ戻す。
- 過去巡のように生成依頼だけで終えず、実画像をゲームへ組み込んだ。

## 変更ファイル

- `ROLE.md`
- `src/artwork.ts`
- `src/game/progression.ts`
- `src/ui/render.ts`
- `src/style.css`
- `scripts/process-cycle6-artwork.py`
- `Material/phase_*`
- `Material/machine_*`
- `public/assets/artwork/`

## 引き継ぎ

実装者はフェーズ到達補正の付与、保存、既存セーブの再付与防止、試用ビルドへの画像埋め込み、テストとビルドを行う。
