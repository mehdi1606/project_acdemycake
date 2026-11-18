/**
 * Where every figure of the Moroccan-garden wallpaper (Landscape.jpeg) sits,
 * as % of the wallpaper (left / top / width), and how it enters.
 *
 * `n` pieces are the Saralöwe toile drawings (Graphics Elements-NN.svg), found
 * in the wallpaper by image matching. `src` pieces are the parts that have no
 * separate drawing (big tree, roses, the lion on the branch, flowers, a bird,
 * the butterfly), cut out of the wallpaper itself as transparent images.
 * Listed back to front (paint order).
 */

export const WALLPAPER_RATIO = 3508 / 2480

export type WallpaperPiece = {
    n?: number
    src?: string
    left: number
    top: number
    width: number
    flip?: boolean
    enter: 'walkLeft' | 'walkRight' | 'rise' | 'grow' | 'swing' | 'drop' | 'driftLeft' | 'driftRight' | 'fly' | 'flutter'
    delay: number
}

const cut = (name: string) => `/assets/img/hero/garden/${name}.webp`

export const WALLPAPER_PIECES: WallpaperPiece[] = [
    // sky
    { n: 14, left: 34.66, top: 5.03, width: 17.35, enter: 'driftLeft', delay: 0.1 },
    { n: 13, left: 49.73, top: 4.33, width: 18.55, enter: 'driftRight', delay: 0.3 },
    // courtyard and gate rise from the horizon
    { n: 4, left: 12.19, top: 3.01, width: 70.41, enter: 'rise', delay: 0.0 },
    { n: 12, left: 26.5, top: 24.38, width: 15.66, enter: 'grow', delay: 0.6 },
    // the big tree grows, the rose branch swings in
    { src: cut('tree-left'), left: 0, top: 0, width: 33.3, enter: 'grow', delay: 0.4 },
    { src: cut('roses'), left: 71.09, top: 0, width: 28.91, enter: 'swing', delay: 0.8 },
    // fountain rises, tables drop in
    { n: 5, left: 38.53, top: 42.05, width: 24.1, enter: 'rise', delay: 1.0 },
    { n: 7, left: 65.01, top: 40.97, width: 19.98, enter: 'drop', delay: 1.5 },
    // the resting lion walks in from the right, the standing one from the left
    { n: 2, left: 23.75, top: 42.96, width: 14.75, enter: 'walkRight', delay: 1.2 },
    { n: 8, left: 11.48, top: 55.38, width: 14.21, enter: 'drop', delay: 2.0 },
    { n: 6, left: 23.67, top: 60.62, width: 20.97, enter: 'drop', delay: 1.75 },
    { n: 3, left: 48.76, top: 60.27, width: 24.87, enter: 'walkLeft', delay: 1.6 },
    // foreground
    { src: cut('flowers'), left: 0, top: 61.53, width: 18.3, enter: 'grow', delay: 1.3 },
    { src: cut('lion-branch'), left: 62.2, top: 49.92, width: 37.8, enter: 'rise', delay: 2.2 },
    // birds and the butterfly arrive last
    { n: 26, left: 68.19, top: 5.44, width: 3.79, enter: 'fly', delay: 2.6 },
    { src: cut('bird'), left: 26.17, top: 4.35, width: 4.9, enter: 'fly', delay: 2.9 },
    { src: cut('butterfly'), left: 70.64, top: 62.18, width: 5.76, enter: 'flutter', delay: 3.1 },
]
