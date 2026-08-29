from pathlib import Path
from PIL import Image

ROOT = Path(r"C:\Packages\NewPaperClicker")
SRC = Path(r"C:\Users\nami_\.grok\sessions\C%3A%5CPackages%5CNewPaperClicker\01a03da6-d617-7b31-85c4-b6fff99d2b2f\images")
PUBLIC = ROOT / "public" / "assets" / "artwork"

ASSETS = [
    {
        "folder": "phase_manual",
        "src": "1.jpg",
        "kind": "phase",
        "title": "手動プロトコルの観測景観",
        "content": "夜の研究室の机。暗い端末と、一本だけ置かれた銀色のペーパークリップ。",
        "use": "生産フェーズ「手動プロトコル」の観測窓",
        "alt": "暗い研究室の机と、一本のペーパークリップ",
        "size": (960, 540),
        "out": "phase-manual.webp",
    },
    {
        "folder": "phase_mechanized",
        "src": "3.jpg",
        "kind": "phase",
        "title": "機械化の観測景観",
        "content": "小さな作業室。ワイヤーを折る自動機と、トレイに並ぶクリップ。",
        "use": "生産フェーズ「機械化」の観測窓",
        "alt": "自動機が並ぶ小さな作業室",
        "size": (960, 540),
        "out": "phase-mechanized.webp",
    },
    {
        "folder": "phase_autonomous",
        "src": "5.jpg",
        "kind": "phase",
        "title": "AI自律生産の観測景観",
        "content": "無人の生産床とサーバ列。シアンの工程光だけが動いている。",
        "use": "生産フェーズ「AI自律生産」の観測窓",
        "alt": "無人の生産床を照らす監視光",
        "size": (960, 540),
        "out": "phase-autonomous.webp",
    },
    {
        "folder": "phase_nano",
        "src": "6.jpg",
        "kind": "phase",
        "title": "ナノスケール製造の観測景観",
        "content": "分子スケールの金属格子がクリップの形へ折られていく。",
        "use": "生産フェーズ「ナノスケール製造」の観測窓",
        "alt": "分子精度で折られる金属格子",
        "size": (960, 540),
        "out": "phase-nano.webp",
    },
    {
        "folder": "phase_orbital",
        "src": "7.jpg",
        "kind": "phase",
        "title": "軌道工業化の観測景観",
        "content": "地球軌道を囲む工廠の輪。太陽光を受けてクリップが流れる。",
        "use": "生産フェーズ「軌道工業化」の観測窓",
        "alt": "地球軌道を囲むクリップ工廠",
        "size": (960, 540),
        "out": "phase-orbital.webp",
    },
    {
        "folder": "phase_matter",
        "src": "8.jpg",
        "kind": "phase",
        "title": "物質変換の観測景観",
        "content": "惑星の地殻が銀色のクリップ地へと書き換えられていく。",
        "use": "生産フェーズ「物質変換」の観測窓",
        "alt": "地表がクリップへ変換される惑星",
        "size": (960, 540),
        "out": "phase-matter.webp",
    },
    {
        "folder": "phase_stellar",
        "src": "4.jpg",
        "kind": "phase",
        "title": "恒星規模採取の観測景観",
        "content": "恒星を包む光電子の網。羽根状の収集器がクリップ形。",
        "use": "生産フェーズ「恒星規模採取」の観測窓",
        "alt": "恒星を包む光電子収穫網",
        "size": (960, 540),
        "out": "phase-stellar.webp",
    },
    {
        "folder": "phase_causal",
        "src": "2.jpg",
        "kind": "phase",
        "title": "因果地平到達の観測景観",
        "content": "銀河の光が淡く、地平まで銀の輪が満ちている静かな宇宙。",
        "use": "生産フェーズ「因果地平到達」の観測窓",
        "alt": "観測地平まで満ちる銀色の輪",
        "size": (960, 540),
        "out": "phase-causal.webp",
    },
    {
        "folder": "machine_auto_clipper",
        "src": "13.jpg",
        "kind": "icon",
        "title": "オートクリッパーのアイコン",
        "content": "ワイヤーをクリップへ折る小型の機械腕。",
        "use": "設備カード「オートクリッパー」のアイコン",
        "alt": "",
        "size": (128, 128),
        "out": "machine-auto-clipper.webp",
    },
    {
        "folder": "machine_wire_machine",
        "src": "14.jpg",
        "kind": "icon",
        "title": "ワイヤー加工機のアイコン",
        "content": "鋼線を送り出すローラー加工機。",
        "use": "設備カード「ワイヤー加工機」のアイコン",
        "alt": "",
        "size": (128, 128),
        "out": "machine-wire-machine.webp",
    },
    {
        "folder": "machine_clip_factory",
        "src": "9.jpg",
        "kind": "icon",
        "title": "クリップ工場のアイコン",
        "content": "窓にクリップのシルエットが見える小型工場。",
        "use": "設備カード「クリップ工場」のアイコン",
        "alt": "",
        "size": (128, 128),
        "out": "machine-clip-factory.webp",
    },
    {
        "folder": "machine_ai_line",
        "src": "10.jpg",
        "kind": "icon",
        "title": "AI生産ラインのアイコン",
        "content": "シアンの配線が走る無人の生産ライン。",
        "use": "設備カード「AI生産ライン」のアイコン",
        "alt": "",
        "size": (128, 128),
        "out": "machine-ai-line.webp",
    },
    {
        "folder": "machine_nano_forge",
        "src": "15.jpg",
        "kind": "icon",
        "title": "ナノフォージのアイコン",
        "content": "結晶状の炉の中で微小なクリップが生成される。",
        "use": "設備カード「ナノフォージ」のアイコン",
        "alt": "",
        "size": (128, 128),
        "out": "machine-nano-forge.webp",
    },
    {
        "folder": "machine_swarm_assembler",
        "src": "12.jpg",
        "kind": "icon",
        "title": "スウォーム組立群のアイコン",
        "content": "小さな組立機の群れがひとつのクリップを囲む。",
        "use": "設備カード「スウォーム組立群」のアイコン",
        "alt": "",
        "size": (128, 128),
        "out": "machine-swarm-assembler.webp",
    },
    {
        "folder": "machine_orbital_foundry",
        "src": "16.jpg",
        "kind": "icon",
        "title": "軌道上クリップ工廠のアイコン",
        "content": "地球を背後にした軌道上の環状工廠。",
        "use": "設備カード「軌道上クリップ工廠」のアイコン",
        "alt": "",
        "size": (128, 128),
        "out": "machine-orbital-foundry.webp",
    },
    {
        "folder": "machine_matter_compiler",
        "src": "11.jpg",
        "kind": "icon",
        "title": "物質コンパイラのアイコン",
        "content": "幾何学的な変換装置が物質をクリップへ組み替える。",
        "use": "設備カード「物質コンパイラ」のアイコン",
        "alt": "",
        "size": (128, 128),
        "out": "machine-matter-compiler.webp",
    },
    {
        "folder": "machine_planetary_assembler",
        "src": "19.jpg",
        "kind": "icon",
        "title": "惑星改造アセンブラのアイコン",
        "content": "地殻を剥がし供給流へ送る惑星規模の組立器。",
        "use": "設備カード「惑星改造アセンブラ」のアイコン",
        "alt": "",
        "size": (128, 128),
        "out": "machine-planetary-assembler.webp",
    },
    {
        "folder": "machine_stellar_harvester",
        "src": "17.jpg",
        "kind": "icon",
        "title": "恒星光電子収穫網のアイコン",
        "content": "恒星を包む光電子の収穫網。",
        "use": "設備カード「恒星光電子収穫網」のアイコン",
        "alt": "",
        "size": (128, 128),
        "out": "machine-stellar-harvester.webp",
    },
    {
        "folder": "machine_galactic_fleet",
        "src": "20.jpg",
        "kind": "icon",
        "title": "銀河複製艦隊のアイコン",
        "content": "銀河を背景に広がる自己複製探査機の編隊。",
        "use": "設備カード「銀河複製艦隊」のアイコン",
        "alt": "",
        "size": (128, 128),
        "out": "machine-galactic-fleet.webp",
    },
    {
        "folder": "machine_causal_optimizer",
        "src": "18.jpg",
        "kind": "icon",
        "title": "因果地平最適化機関のアイコン",
        "content": "無限に近い銀の輪を収束させる抽象的な観測装置。",
        "use": "設備カード「因果地平最適化機関」のアイコン",
        "alt": "",
        "size": (128, 128),
        "out": "machine-causal-optimizer.webp",
    },
]


def write_material(asset: dict, material_dir: Path, original_size: tuple[int, int], game_bytes: int) -> None:
    kind = "フェーズ景観" if asset["kind"] == "phase" else "設備アイコン"
    alt_line = asset["alt"] if asset["alt"] else "設備名が隣接するため装飾画像として alt は空"
    text = f"""# {asset["title"]}

- 素材ID：`{asset["folder"]}`
- 種類：{kind}
- 内容：{asset["content"]}
- 想定用途：{asset["use"]}
- 元ファイル：`original.jpg`
- 元画像サイズ：{original_size[0]} × {original_size[1]} px
- 背景：不透明
- 出所：生成AI
- 作者・生成方法：Grok Imagine image_gen
- ライセンス：本プロジェクト用の生成素材
- 作成日：2026-08-26
- ゲーム用出力：`public/assets/artwork/{asset["out"]}`
- ゲーム用サイズ：{asset["size"][0]} × {asset["size"][1]} px、WebP、約 {game_bytes // 1024} KB
- コード上の定義：`src/artwork.ts`
- 単独表示時の代替テキスト：{alt_line}
"""
    (material_dir / "MATERIAL.md").write_text(text, encoding="utf-8")


def main() -> None:
    PUBLIC.mkdir(parents=True, exist_ok=True)
    for asset in ASSETS:
        source = SRC / asset["src"]
        material_dir = ROOT / "Material" / asset["folder"]
        material_dir.mkdir(parents=True, exist_ok=True)
        original = Image.open(source).convert("RGB")
        original.save(material_dir / "original.jpg", quality=92, optimize=True)
        game = original.copy()
        game.thumbnail(asset["size"], Image.Resampling.LANCZOS)
        canvas = Image.new("RGB", asset["size"], (10, 15, 20))
        offset = ((asset["size"][0] - game.size[0]) // 2, (asset["size"][1] - game.size[1]) // 2)
        canvas.paste(game, offset)
        out_path = PUBLIC / asset["out"]
        canvas.save(out_path, "WEBP", quality=78, method=6)
        write_material(asset, material_dir, original.size, out_path.stat().st_size)
        print(f"{asset['folder']}: {original.size} -> {out_path.stat().st_size} bytes")


if __name__ == "__main__":
    main()
