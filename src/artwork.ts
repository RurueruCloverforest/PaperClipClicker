import type { MachineId } from './state';

export interface ArtworkDefinition {
  id: string;
  src: string;
  sourceMaterial: string;
  width: number;
  height: number;
  alt: {
    standalone: string;
    decorative: '';
  };
}

const publicAsset = (path: string): string => path;

function defineArtwork(
  id: string,
  src: string,
  sourceMaterial: string,
  width: number,
  height: number,
  standalone: string,
): ArtworkDefinition {
  return {
    id,
    src: publicAsset(src),
    sourceMaterial,
    width,
    height,
    alt: { standalone, decorative: '' },
  };
}

/**
 * ゲーム内で使用する画像の台帳。
 * UIから画像パスを直接参照せず、必ずこの定義を経由する。
 */
export const ARTWORK = {
  paperclipMain: defineArtwork(
    'paperclip-main',
    'assets/artwork/paperclip-main.webp',
    'Material/paperclip_main',
    512,
    512,
    '青い反射光を帯びた銀色のペーパークリップ',
  ),
  interiorAutoClipper: defineArtwork(
    'interior-auto-clipper',
    'assets/artwork/interior-auto-clipper.webp',
    'Material/interior_auto_clipper',
    768,
    768,
    'ワイヤーを折る機械腕がある小さな無人作業室',
  ),
  phaseManual: defineArtwork(
    'phase-manual',
    'assets/artwork/phase-manual.webp',
    'Material/phase_manual',
    960,
    540,
    '暗い研究室の机と、一本のペーパークリップ',
  ),
  phaseMechanized: defineArtwork(
    'phase-mechanized',
    'assets/artwork/phase-mechanized.webp',
    'Material/phase_mechanized',
    960,
    540,
    '自動機が並ぶ小さな作業室',
  ),
  phaseAutonomous: defineArtwork(
    'phase-autonomous',
    'assets/artwork/phase-autonomous.webp',
    'Material/phase_autonomous',
    960,
    540,
    '無人の生産床を照らす監視光',
  ),
  phaseNano: defineArtwork(
    'phase-nano',
    'assets/artwork/phase-nano.webp',
    'Material/phase_nano',
    960,
    540,
    '分子精度で折られる金属格子',
  ),
  phaseOrbital: defineArtwork(
    'phase-orbital',
    'assets/artwork/phase-orbital.webp',
    'Material/phase_orbital',
    960,
    540,
    '地球軌道を囲むクリップ工廠',
  ),
  phaseMatter: defineArtwork(
    'phase-matter',
    'assets/artwork/phase-matter.webp',
    'Material/phase_matter',
    960,
    540,
    '地表がクリップへ変換される惑星',
  ),
  phaseStellar: defineArtwork(
    'phase-stellar',
    'assets/artwork/phase-stellar.webp',
    'Material/phase_stellar',
    960,
    540,
    '恒星を包む光電子収穫網',
  ),
  phaseCausal: defineArtwork(
    'phase-causal',
    'assets/artwork/phase-causal.webp',
    'Material/phase_causal',
    960,
    540,
    '観測地平まで満ちる銀色の輪',
  ),
  machineAutoClipper: defineArtwork(
    'machine-auto-clipper',
    'assets/artwork/machine-auto-clipper.webp',
    'Material/machine_auto_clipper',
    128,
    128,
    '',
  ),
  machineWireMachine: defineArtwork(
    'machine-wire-machine',
    'assets/artwork/machine-wire-machine.webp',
    'Material/machine_wire_machine',
    128,
    128,
    '',
  ),
  machineClipFactory: defineArtwork(
    'machine-clip-factory',
    'assets/artwork/machine-clip-factory.webp',
    'Material/machine_clip_factory',
    128,
    128,
    '',
  ),
  machineAiLine: defineArtwork(
    'machine-ai-line',
    'assets/artwork/machine-ai-line.webp',
    'Material/machine_ai_line',
    128,
    128,
    '',
  ),
  machineNanoForge: defineArtwork(
    'machine-nano-forge',
    'assets/artwork/machine-nano-forge.webp',
    'Material/machine_nano_forge',
    128,
    128,
    '',
  ),
  machineSwarmAssembler: defineArtwork(
    'machine-swarm-assembler',
    'assets/artwork/machine-swarm-assembler.webp',
    'Material/machine_swarm_assembler',
    128,
    128,
    '',
  ),
  machineOrbitalFoundry: defineArtwork(
    'machine-orbital-foundry',
    'assets/artwork/machine-orbital-foundry.webp',
    'Material/machine_orbital_foundry',
    128,
    128,
    '',
  ),
  machineMatterCompiler: defineArtwork(
    'machine-matter-compiler',
    'assets/artwork/machine-matter-compiler.webp',
    'Material/machine_matter_compiler',
    128,
    128,
    '',
  ),
  machinePlanetaryAssembler: defineArtwork(
    'machine-planetary-assembler',
    'assets/artwork/machine-planetary-assembler.webp',
    'Material/machine_planetary_assembler',
    128,
    128,
    '',
  ),
  machineStellarHarvester: defineArtwork(
    'machine-stellar-harvester',
    'assets/artwork/machine-stellar-harvester.webp',
    'Material/machine_stellar_harvester',
    128,
    128,
    '',
  ),
  machineGalacticFleet: defineArtwork(
    'machine-galactic-fleet',
    'assets/artwork/machine-galactic-fleet.webp',
    'Material/machine_galactic_fleet',
    128,
    128,
    '',
  ),
  machineCausalOptimizer: defineArtwork(
    'machine-causal-optimizer',
    'assets/artwork/machine-causal-optimizer.webp',
    'Material/machine_causal_optimizer',
    128,
    128,
    '',
  ),
} as const satisfies Record<string, ArtworkDefinition>;

export type ArtworkId = keyof typeof ARTWORK;

export const PHASE_ARTWORK = {
  manual: ARTWORK.phaseManual,
  mechanized: ARTWORK.phaseMechanized,
  autonomous: ARTWORK.phaseAutonomous,
  nano: ARTWORK.phaseNano,
  orbital: ARTWORK.phaseOrbital,
  matter: ARTWORK.phaseMatter,
  stellar: ARTWORK.phaseStellar,
  causal: ARTWORK.phaseCausal,
} as const satisfies Record<string, ArtworkDefinition>;

export const MACHINE_ARTWORK = {
  autoClipper: ARTWORK.machineAutoClipper,
  wireMachine: ARTWORK.machineWireMachine,
  clipFactory: ARTWORK.machineClipFactory,
  aiLine: ARTWORK.machineAiLine,
  nanoForge: ARTWORK.machineNanoForge,
  swarmAssembler: ARTWORK.machineSwarmAssembler,
  orbitalFoundry: ARTWORK.machineOrbitalFoundry,
  matterCompiler: ARTWORK.machineMatterCompiler,
  planetaryAssembler: ARTWORK.machinePlanetaryAssembler,
  stellarHarvester: ARTWORK.machineStellarHarvester,
  galacticFleet: ARTWORK.machineGalacticFleet,
  causalOptimizer: ARTWORK.machineCausalOptimizer,
} as const satisfies Record<MachineId, ArtworkDefinition>;
