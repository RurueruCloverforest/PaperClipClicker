# 試用版のローカルサーバー起動対応

## 実施内容

- `file://` 固有オリジン制限を回避するため、`trial/START_TRIAL.cmd` を追加した。
- Windows標準PowerShellで動く簡易HTTPサーバー `trial/serve-trial.ps1` を追加した。
- 起動後に `http://localhost:4173/` を既定ブラウザで自動的に開くようにした。
- パストラバーサルを防ぎ、`trial/` 内のファイルだけを配信するようにした。
- 主要なHTML、JavaScript、CSS、画像形式へ適切なContent-Typeを設定した。
- `TECHNICAL_DESIGN.md` の試用方法をローカルHTTPサーバー方式へ更新した。

## 確認結果

- PowerShellスクリプトの構文解析が成功した。
- 試用ビルド後もランチャーとサーバースクリプトが保持されることを確認した。
- 試用版のJavaScript、CSS、画像が生成されていることを確認した。
- 今回の作業に未完了項目はないため、`WorkingTask/` に個別記録は作成していない。
