/**
 * 3D garden layout (generated from the wallpaper by image matching).
 * left/top/width/height: % of the wallpaper. depth: distance from the camera
 * in world units (bigger = farther). kind: how the figure appears and lives.
 */

export type GardenKind = 'popup' | 'tree' | 'roses' | 'cloud' | 'fountain' | 'restingLion' | 'walkingLion' | 'bird' | 'butterfly'

export type GardenPiece = { name: string; left: number; top: number; width: number; height: number; depth: number; kind: GardenKind; delay: number }

export const GARDEN_RATIO = 3508 / 2480
export const GROUND_DEPTH = 48

export const GARDEN_PIECES: GardenPiece[] = [
    { name: 'cloud-a', left: 34.66, top: 5.00, width: 17.33, height: 9.84, depth: 44, kind: 'cloud', delay: 0.0 },
    { name: 'cloud-b', left: 49.71, top: 4.35, width: 18.53, height: 10.48, depth: 44, kind: 'cloud', delay: 0.3 },
    { name: 'gate', left: 12.20, top: 2.98, width: 70.41, height: 49.60, depth: 40, kind: 'popup', delay: 0.2 },
    { name: 'tree-mid', left: 26.51, top: 24.35, width: 15.68, height: 21.29, depth: 36, kind: 'tree', delay: 0.7 },
    { name: 'lion-rest', left: 23.77, top: 42.98, width: 14.77, height: 15.73, depth: 31, kind: 'restingLion', delay: 1.6 },
    { name: 'tea-table', left: 64.99, top: 40.97, width: 19.95, height: 23.15, depth: 27, kind: 'popup', delay: 1.4 },
    { name: 'fountain', left: 38.54, top: 42.02, width: 24.12, height: 25.65, depth: 24, kind: 'fountain', delay: 1.0 },
    { name: 'tree-left', left: 0.00, top: 0.00, width: 33.30, height: 54.19, depth: 16, kind: 'tree', delay: 0.5 },
    { name: 'lion-walk', left: 48.75, top: 60.24, width: 24.86, height: 26.45, depth: 14, kind: 'walkingLion', delay: 1.2 },
    { name: 'macaron-tower', left: 11.46, top: 55.40, width: 14.20, height: 36.94, depth: 12.5, kind: 'popup', delay: 1.9 },
    { name: 'cake-table', left: 23.66, top: 60.65, width: 20.98, height: 32.98, depth: 12, kind: 'popup', delay: 1.7 },
    { name: 'butterfly', left: 70.64, top: 62.18, width: 5.76, height: 6.94, depth: 13, kind: 'butterfly', delay: 2.9 },
    { name: 'roses', left: 71.09, top: 0.00, width: 28.91, height: 49.03, depth: 10, kind: 'roses', delay: 0.9 },
    { name: 'lion-branch', left: 62.20, top: 49.92, width: 37.80, height: 50.00, depth: 9.5, kind: 'popup', delay: 2.2 },
    { name: 'flowers', left: 0.00, top: 61.53, width: 18.30, height: 38.39, depth: 9, kind: 'tree', delay: 1.3 },
    { name: 'bird', left: 68.19, top: 5.40, width: 3.76, height: 4.35, depth: 38, kind: 'bird', delay: 2.6 },
]
