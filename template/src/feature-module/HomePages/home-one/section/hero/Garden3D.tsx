import React, { useEffect, useRef, useState } from 'react'
import type * as THREE_NS from 'three'
import { asset, useReducedMotion } from './heroShared'
import { GARDEN_PIECES, GARDEN_RATIO, GROUND_DEPTH, GardenPiece } from './garden3dLayout'

/**
 * The Moroccan-garden wallpaper as a living 3D pop-up book (three.js / WebGL).
 *
 * Every figure of the wallpaper is a cut-out (taken from the wallpaper itself)
 * standing at its own depth. Seen from the resting camera they line up exactly
 * like today's wallpaper; when the camera glides in and follows the mouse, the
 * near and far figures move against each other like a real 3D scene.
 *
 * The garden opens like a pop-up book — each figure springs up from the ground
 * — then stays alive: water flows from the fountain into the basin with
 * ripples, trees and roses sway in the breeze, the standing lion walks in on
 * its four legs, the resting lion breathes and looks around, birds beat their
 * wings across the sky and the butterfly flutters.
 */

type T = typeof THREE_NS
const FOV = 32
const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)
const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2
/** A soft spring settling at 1 (pop-up overshoot). */
const spring = (t: number) => (t <= 0 ? 0 : 1 - Math.exp(-4.2 * t) * Math.cos(6.2 * t))

/** A rectangle of a texture as a unit-space plane (u/v measured from the texture's top-left). */
function rectMesh(THREE: T, mat: THREE_NS.Material, u0: number, v0: number, u1: number, v1: number) {
    const g = new THREE.PlaneGeometry(u1 - u0, v1 - v0)
    const uv = g.attributes.uv as THREE_NS.BufferAttribute
    for (let i = 0; i < uv.count; i++) {
        uv.setXY(i, u0 + uv.getX(i) * (u1 - u0), (1 - v1) + uv.getY(i) * (v1 - v0))
    }
    const m = new THREE.Mesh(g, mat)
    // local space of a piece: x ∈ [-0.5, 0.5], y ∈ [0, 1] (bottom-centre origin)
    m.position.set((u0 + u1) / 2 - 0.5, 1 - (v0 + v1) / 2, 0)
    return m
}

/** Several rects of one texture rotating together around a pivot (u/v of the pivot). */
function partGroup(THREE: T, mat: THREE_NS.Material, rects: [number, number, number, number][], pu: number, pv: number) {
    const g = new THREE.Group()
    g.position.set(pu - 0.5, 1 - pv, 0)
    rects.forEach(([u0, v0, u1, v1]) => {
        const m = rectMesh(THREE, mat, u0, v0, u1, v1)
        m.position.x -= pu - 0.5
        m.position.y -= 1 - pv
        g.add(m)
    })
    return g
}

const Garden3D: React.FC = () => {
    const reduced = useReducedMotion()
    const hostRef = useRef<HTMLDivElement>(null)
    const [failed, setFailed] = useState(false)

    useEffect(() => {
        const host = hostRef.current
        if (!host) return
        let disposed = false
        let cleanup = () => {}

        import('three').then(THREE => {
            if (disposed) return
            let renderer: THREE_NS.WebGLRenderer
            try {
                renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' })
            } catch {
                setFailed(true)
                return
            }
            renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75))
            renderer.outputColorSpace = THREE.SRGBColorSpace
            renderer.setClearColor(0xfad6f3, 1)
            const canvas = renderer.domElement
            canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block'
            canvas.setAttribute('aria-hidden', 'true')
            host.appendChild(canvas)

            const scene = new THREE.Scene()
            const camera = new THREE.PerspectiveCamera(FOV, 1, 0.5, 200)
            const loader = new THREE.TextureLoader()
            const textures: THREE_NS.Texture[] = []
            const tex = (name: string, ext = 'webp') => {
                const t = loader.load(asset(`/assets/img/hero/garden3d/${name}.${ext}`))
                t.colorSpace = THREE.SRGBColorSpace
                t.anisotropy = 4
                textures.push(t)
                return t
            }
            const matFor = (t: THREE_NS.Texture) => new THREE.MeshBasicMaterial({
                map: t, transparent: true, depthWrite: false, side: THREE.DoubleSide,
            })

            // ── the empty garden (paper + petals), far behind everything ──
            const ground = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: tex('ground', 'jpg') }))
            ground.renderOrder = -1000
            scene.add(ground)

            type Live = {
                p: GardenPiece
                root: THREE_NS.Group          // positioned at the piece's anchor, scaled to world size
                pop: THREE_NS.Group           // pop-up / sway rotation
                mats: THREE_NS.MeshBasicMaterial[]
                update?: (time: number, local: number) => void
                anchorTop?: boolean
                startX?: number
                worldW?: number
            }
            const lives: Live[] = []

            // ── water for the fountain (points + ripples), in the fountain's unit space ──
            const waterSprite = (() => {
                const c = document.createElement('canvas'); c.width = c.height = 32
                const g = c.getContext('2d')!
                const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16)
                gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.45, 'rgba(255,255,255,0.85)'); gr.addColorStop(1, 'rgba(255,255,255,0)')
                g.fillStyle = gr; g.fillRect(0, 0, 32, 32)
                const t = new THREE.CanvasTexture(c); textures.push(t); return t
            })()

            const SPOUT = { x: 0, y: 0.84 }, RIM = { y: 0.73, r: 0.17, rz: 0.05 }, BASIN = { y: 0.45, r: 0.3, rz: 0.08 }
            const N = 520
            const wPos = new Float32Array(N * 3)
            const wVel = new Float32Array(N * 3)
            const wState = new Uint8Array(N)                 // 0 = jet, 1 = overflow
            const G = 1.25
            const spawnJet = (i: number) => {
                wState[i] = 0
                wPos.set([SPOUT.x + (Math.random() - 0.5) * 0.01, SPOUT.y, (Math.random() - 0.5) * 0.01], i * 3)
                wVel.set([(Math.random() - 0.5) * 0.16, 0.22 + Math.random() * 0.12, (Math.random() - 0.5) * 0.12], i * 3)
            }
            const spawnOverflow = (i: number) => {
                wState[i] = 1
                const a = Math.random() * Math.PI * 2
                wPos.set([Math.cos(a) * RIM.r, RIM.y, Math.sin(a) * RIM.rz], i * 3)
                wVel.set([Math.cos(a) * (0.05 + Math.random() * 0.05), -0.02, Math.sin(a) * 0.03], i * 3)
            }
            for (let i = 0; i < N; i++) {
                if (i % 3 === 0) spawnJet(i); else spawnOverflow(i)
                wPos[i * 3 + 1] -= Math.random() * 0.25   // stagger the first frame
            }
            const waterGeo = new THREE.BufferGeometry()
            waterGeo.setAttribute('position', new THREE.BufferAttribute(wPos, 3))
            const waterMat = new THREE.PointsMaterial({
                map: waterSprite, color: 0x8fcaf5, size: 0.1, transparent: true, opacity: 0, depthWrite: false, sizeAttenuation: true,
            })
            const water = new THREE.Points(waterGeo, waterMat)
            const ripples: THREE_NS.Mesh[] = []

            // ── build every figure ──
            GARDEN_PIECES.forEach(p => {
                const t = tex(p.name)
                const mat = matFor(t)
                const root = new THREE.Group()
                const pop = new THREE.Group()
                root.add(pop)
                root.renderOrder = -p.depth
                const live: Live = { p, root, pop, mats: [mat] }
                const order = (o: THREE_NS.Object3D) => o.traverse(c => { c.renderOrder = -p.depth })

                if (p.kind === 'walkingLion') {
                    const lion = new THREE.Group()
                    const body = partGroup(THREE, mat, [[0, 0, 1, 0.46], [0.25, 0.46, 1, 0.64]], 0.5, 0.5)
                    const tail = partGroup(THREE, mat, [[0, 0.46, 0.25, 0.655], [0, 0.655, 0.175, 0.93]], 0.23, 0.47)
                    const legs = [
                        partGroup(THREE, mat, [[0.27, 0.645, 0.39, 0.93]], 0.33, 0.65),   // back, far
                        partGroup(THREE, mat, [[0.53, 0.635, 0.613, 0.9]], 0.57, 0.64),   // front, far
                        partGroup(THREE, mat, [[0.175, 0.655, 0.27, 0.93]], 0.22, 0.66),  // back, near
                        partGroup(THREE, mat, [[0.613, 0.635, 0.7, 0.9]], 0.65, 0.64),    // front, near
                    ]
                    lion.add(legs[0], legs[1], body, legs[2], legs[3], tail)
                    pop.add(lion)
                    live.update = (time, local) => {
                        // walk in from the left at a natural pace, then stop
                        const w = clamp01(local / 4.6)
                        const travel = easeInOutSine(w)
                        const wW = live.worldW || 1
                        const startX = live.startX ?? 0
                        root.position.x = (root.userData.baseX as number) + (1 - travel) * startX
                        const moving = w < 1 ? Math.min(1, Math.sin(Math.PI * Math.min(w, 0.97)) * 3) : 0
                        const distance = travel * Math.abs(startX) / wW            // in lion widths
                        const phase = distance * Math.PI * 2 / 0.32
                        const swing = 0.26 * moving
                        legs[0].rotation.z = Math.sin(phase + Math.PI) * swing
                        legs[3].rotation.z = Math.sin(phase + Math.PI) * swing
                        legs[1].rotation.z = Math.sin(phase) * swing
                        legs[2].rotation.z = Math.sin(phase) * swing
                        lion.position.y = Math.abs(Math.sin(phase)) * 0.012 * moving
                        body.rotation.z = Math.sin(phase * 2) * 0.006 * moving
                        tail.rotation.z = Math.sin(time * 1.6) * 0.09 + 0.03
                        lion.scale.y = 1 + Math.sin(time * 1.5) * 0.006 * (1 - moving)
                        mat.opacity = clamp01(local * 2)
                    }
                } else if (p.kind === 'restingLion') {
                    const head = partGroup(THREE, mat, [[0.167, 0.12, 0.558, 0.59]], 0.38, 0.56)
                    const rest = partGroup(THREE, mat, [[0, 0, 1, 0.12], [0, 0.12, 0.167, 0.59], [0.558, 0.12, 1, 0.59], [0, 0.59, 1, 1]], 0.5, 1)
                    const lion = new THREE.Group(); lion.add(rest, head); pop.add(lion)
                    live.update = (time, local) => {
                        head.rotation.z = Math.sin(time * 0.45) * 0.05 + Math.sin(time * 0.17) * 0.03
                        lion.scale.y = 1 + Math.sin(time * 1.3) * 0.012
                        mat.opacity = clamp01(local * 1.5)
                        pop.rotation.x = (1 - spring(local)) * -1.4
                    }
                } else if (p.kind === 'bird') {
                    const flap = partGroup(THREE, mat, [[0.3, 0.03, 0.7, 0.62]], 0.55, 0.62)
                    const body = partGroup(THREE, mat, [[0, 0, 0.3, 1], [0.7, 0, 1, 1], [0.3, 0.62, 0.7, 1]], 0.5, 1)
                    pop.add(body, flap)
                    live.update = (time, local) => {
                        flap.rotation.x = Math.sin(time * 11 + p.left) * 1.05
                        mat.opacity = clamp01(local * 2)
                    }
                } else if (p.kind === 'butterfly') {
                    const left = partGroup(THREE, mat, [[0, 0, 0.5, 1]], 0.5, 0.5)
                    const right = partGroup(THREE, mat, [[0.5, 0, 1, 1]], 0.5, 0.5)
                    pop.add(left, right)
                    live.update = (time, local) => {
                        const f = 0.15 + 1.05 * Math.abs(Math.sin(time * 13))
                        left.rotation.y = f; right.rotation.y = -f
                        pop.position.set(Math.sin(time * 0.6) * 0.9 + Math.sin(time * 1.7) * 0.2, Math.cos(time * 0.8) * 0.45 + 0.1, 0)
                        pop.rotation.z = Math.sin(time * 0.9) * 0.25
                        mat.opacity = clamp01(local * 2)
                    }
                } else {
                    pop.add(rectMesh(THREE, mat, 0, 0, 1, 1))
                    if (p.kind === 'fountain') {
                        pop.add(water)
                        for (let i = 0; i < 4; i++) {
                            const rm = new THREE.MeshBasicMaterial({ color: 0x7fbff0, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide })
                            const ring = new THREE.Mesh(new THREE.RingGeometry(0.92, 1, 48), rm)
                            ring.rotation.x = -Math.PI / 2
                            ring.position.y = BASIN.y + 0.004
                            ring.userData.offset = i / 4
                            ring.userData.x = (Math.random() - 0.5) * 0.24
                            ripples.push(ring); pop.add(ring)
                        }
                    }
                    live.update = (time, local) => {
                        const s = spring(local)
                        mat.opacity = clamp01(local * 3)
                        if (p.kind === 'cloud') {
                            const dir = p.name === 'cloud-a' ? -1 : 1
                            pop.position.x = (1 - easeOutCubic(clamp01(local / 3))) * dir * 1.2 + Math.sin(time * 0.12 + p.left) * 0.04
                            pop.position.y = Math.sin(time * 0.3 + p.left) * 0.03
                        } else if (p.kind === 'roses') {
                            pop.rotation.z = (1 - s) * -0.55 + Math.sin(time * 0.8) * 0.012
                        } else if (p.kind === 'tree') {
                            pop.rotation.x = (1 - s) * -1.45
                            pop.rotation.z = Math.sin(time * 0.7 + p.left) * 0.01
                        } else {
                            pop.rotation.x = (1 - s) * -1.45
                        }
                        if (p.kind === 'fountain') {
                            waterMat.opacity = clamp01((local - 1.1) * 1.5)
                            ripples.forEach(r => {
                                const k = ((time * 0.45 + (r.userData.offset as number)) % 1)
                                const sc = 0.02 + k * 0.12
                                r.scale.set(sc, sc, 1)
                                r.position.x = r.userData.x as number
                                ;(r.material as THREE_NS.MeshBasicMaterial).opacity = (1 - k) * 0.8 * clamp01((local - 1.3) * 1.5)
                            })
                        }
                    }
                }
                if (p.kind === 'roses') live.anchorTop = true
                order(root)
                scene.add(root)
                lives.push(live)
            })

            // ── layout: put every piece where it sits in the wallpaper, at its depth ──
            const tanY = Math.tan((FOV * Math.PI) / 360)
            const layout = () => {
                const cw = host.clientWidth, ch = host.clientHeight
                if (!cw || !ch) return
                renderer.setSize(cw, ch, false)
                camera.aspect = cw / ch
                camera.updateProjectionMatrix()
                const imgW = Math.max(cw, ch * GARDEN_RATIO), imgH = imgW / GARDEN_RATIO
                const offX = (cw - imgW) / 2, offY = (ch - imgH) / 2
                const toWorld = (fx: number, fy: number, D: number) => {
                    const px = offX + fx * imgW, py = offY + fy * imgH
                    const nx = (px / cw) * 2 - 1, ny = 1 - (py / ch) * 2
                    return { x: nx * D * tanY * camera.aspect, y: ny * D * tanY }
                }
                const sizeAt = (fw: number, fh: number, D: number) => ({
                    w: (fw * imgW / ch) * 2 * D * tanY, h: (fh * imgH / ch) * 2 * D * tanY,
                })
                // ground: centred, a little larger so camera moves never show an edge
                const gs = sizeAt(1, 1, GROUND_DEPTH)
                const gc = toWorld(0.5, 0.5, GROUND_DEPTH)
                ground.position.set(gc.x, gc.y, -GROUND_DEPTH)
                ground.scale.set(gs.w * 1.18, gs.h * 1.18, 1)

                lives.forEach(l => {
                    const { p } = l
                    const D = p.depth
                    const s = sizeAt(p.width / 100, p.height / 100, D)
                    const anchor = toWorld((p.left + p.width / 2) / 100, (p.top + p.height) / 100, D)
                    l.root.scale.set(s.w, s.h, s.w)
                    l.root.position.set(anchor.x, anchor.y, -D)
                    l.root.userData.baseX = anchor.x
                    l.worldW = s.w
                    if (l.anchorTop) {
                        // hang the rose branch from its top-right corner so it swings naturally
                        l.pop.position.set(0.5, 1, 0)
                        l.pop.children.forEach(c => { c.position.x -= 0.5; c.position.y -= 1 })
                        l.anchorTop = false
                    }
                    if (p.kind === 'walkingLion') {
                        const leftEdge = -D * tanY * camera.aspect
                        l.startX = (leftEdge - s.w * 0.7) - anchor.x
                    }
                    if (p.kind === 'fountain') waterMat.size = s.w * 0.02
                })
            }
            const ro = new ResizeObserver(layout)
            ro.observe(host)
            layout()

            // ── birds fly across the sky (the bird piece is reused twice) ──
            const birdLive = lives.find(l => l.p.kind === 'bird')
            const bird2 = birdLive ? birdLive.root.clone(true) : null
            if (bird2 && birdLive) {
                // share the material so it fades in with the first bird
                scene.add(bird2)
            }

            // ── camera: glides in, then breathes and follows the mouse ──
            let mx = 0, my = 0, lx = 0, ly = 0
            const onMove = (e: MouseEvent) => { mx = e.clientX / window.innerWidth - 0.5; my = e.clientY / window.innerHeight - 0.5 }
            window.addEventListener('mousemove', onMove)
            let visible = true
            const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting })
            io.observe(host)

            const start = performance.now()
            let raf = 0
            const lookTarget = new THREE.Vector3()
            const frame = (now: number) => {
                raf = requestAnimationFrame(frame)
                if (!visible) return
                const time = reduced ? 30 : (now - start) / 1000
                const intro = reduced ? 1 : easeOutCubic(clamp01(time / 4.2))

                lx += (mx - lx) * 0.04; ly += (my - ly) * 0.04
                camera.position.set(
                    lx * 1.1 + Math.sin(time * 0.13) * 0.25,
                    -ly * 0.6 + (1 - intro) * -1.6 + Math.sin(time * 0.11) * 0.12,
                    (1 - intro) * -5.5,
                )
                lookTarget.set(lx * 0.4, (1 - intro) * 0.8, -30)
                camera.lookAt(lookTarget)

                lives.forEach(l => {
                    const local = reduced ? 30 : time - l.p.delay
                    l.root.visible = local > 0 || reduced
                    l.update?.(time, local)
                })

                // birds: fly across, loop forever
                if (birdLive) {
                    const D = birdLive.p.depth
                    const half = D * tanY * camera.aspect + (birdLive.worldW || 1)
                    const fly = (b: THREE_NS.Object3D, period: number, offset: number, yOff: number) => {
                        const k = ((time + offset) / period) % 1
                        b.position.x = -half + k * half * 2
                        b.position.y = (birdLive.root.userData.baseY ?? birdLive.root.position.y) + yOff + Math.sin(time * 1.3 + offset) * 0.25
                    }
                    if (birdLive.root.userData.baseY === undefined) birdLive.root.userData.baseY = birdLive.root.position.y
                    fly(birdLive.root, 17, 2, 0)
                    if (bird2) {
                        bird2.scale.copy(birdLive.root.scale).multiplyScalar(0.8)
                        bird2.position.z = birdLive.root.position.z
                        bird2.visible = birdLive.root.visible
                        fly(bird2, 24, 11, -1.2)
                        const wing = (bird2.children[0] as THREE_NS.Group).children[1]
                        if (wing) wing.rotation.x = Math.sin(time * 9.5) * 1.05
                    }
                }

                // fountain water
                if (waterMat.opacity > 0) {
                    const dt = 1 / 60
                    for (let i = 0; i < N; i++) {
                        const j = i * 3
                        wVel[j + 1] -= G * dt
                        wPos[j] += wVel[j] * dt; wPos[j + 1] += wVel[j + 1] * dt; wPos[j + 2] += wVel[j + 2] * dt
                        if (wState[i] === 0 && wPos[j + 1] < RIM.y && wVel[j + 1] < 0) {
                            if (Math.abs(wPos[j]) < RIM.r) spawnOverflow(i); else spawnJet(i)
                        } else if (wState[i] === 1 && wPos[j + 1] < BASIN.y) {
                            spawnJet(i)
                        }
                    }
                    ;(waterGeo.attributes.position as THREE_NS.BufferAttribute).needsUpdate = true
                }

                renderer.render(scene, camera)
            }
            raf = requestAnimationFrame(frame)

            cleanup = () => {
                cancelAnimationFrame(raf)
                window.removeEventListener('mousemove', onMove)
                ro.disconnect(); io.disconnect()
                scene.traverse(o => {
                    const m = o as THREE_NS.Mesh
                    m.geometry?.dispose?.()
                    const mt = m.material as THREE_NS.Material | THREE_NS.Material[] | undefined
                    if (Array.isArray(mt)) mt.forEach(x => x.dispose()); else mt?.dispose?.()
                })
                textures.forEach(t => t.dispose())
                renderer.dispose()
                canvas.remove()
            }
        }).catch(() => setFailed(true))

        return () => { disposed = true; cleanup() }
    }, [reduced])

    return (
        <div ref={hostRef} aria-hidden="true" style={{
            position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 0, background: '#FAD6F3',
            ...(failed ? { backgroundImage: `url(${asset('/assets/img/Landscape.jpeg')})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}),
        }} />
    )
}

export default Garden3D
