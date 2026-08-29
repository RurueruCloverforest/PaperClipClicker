# 改善ループ10：アートワーク作成者

## 実施内容

- ロールをアートワーク作成者へ更新した。
- オートクリッパー内部の正方形作業室を生成し、`Material/interior_auto_clipper/` と `public/assets/artwork/interior-auto-clipper.webp` に保存した。
- 素材台帳へ登録し、設備アイコンを「内部をのぞく」ボタンにした。
- 正方形の内部ダイアログと回収クリップの見た目を追加した。

## 主な判断

- 作業室は机の手前を空け、回収クリップを重ねても主題が残るようにした。
- 回収クリップは既存の `paperclip_main` を円形ボタンに載せて再利用した。

## 変更ファイル

- `ROLE.md`
- `src/artwork.ts`
- `src/ui/render.ts`
- `src/style.css`
- `Material/interior_auto_clipper/`
- `public/assets/artwork/interior-auto-clipper.webp`
