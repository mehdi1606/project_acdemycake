import React, { useEffect, useRef, useState } from 'react'
import { asset } from './heroShared'

/**
 * A three-tier couture cake built live in WebGL (three.js, loaded only when
 * this hero is shown). The stand appears, the tiers drop in one after another,
 * gold drips run down, pearls pop on and sugar roses crown it; then it turns
 * slowly and leans toward the mouse. Falls back to a photo without WebGL.
 */

const easeOutBack = (t: number) => { const c1 = 1.4, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2) }
const clamp = (v: number) => Math.min(1, Math.max(0, v))

const Cake3D: React.FC<{ reduced: boolean }> = ({ reduced }) => {
    const hostRef = useRef<HTMLDivElement>(null)
    const [failed, setFailed] = useState(false)

    useEffect(() => {
        const host = hostRef.current
        if (!host) return
        let disposed = false
        let cleanup = () => {}

        import('three').then(THREE => {
            if (disposed) return
            let renderer: import('three').WebGLRenderer
            try {
                renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
            } catch {
                setFailed(true)
                return
            }
            renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
            renderer.outputColorSpace = THREE.SRGBColorSpace
            renderer.toneMapping = THREE.ACESFilmicToneMapping
            renderer.toneMappingExposure = 1.05
            host.appendChild(renderer.domElement)
            renderer.domElement.style.width = '100%'
            renderer.domElement.style.height = '100%'
            renderer.domElement.setAttribute('aria-hidden', 'true')

            const scene = new THREE.Scene()
            const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100)
            camera.position.set(0, 3.7, 12.6)
            camera.lookAt(0, 2.2, 0)

            // Light: warm key, gold rim, soft fill
            scene.add(new THREE.HemisphereLight(0xfff1dc, 0x4a1425, 1.1))
            const key = new THREE.DirectionalLight(0xffe8c4, 2.4); key.position.set(4, 7, 6); scene.add(key)
            const rim = new THREE.PointLight(0xc5912c, 40, 20); rim.position.set(-4, 4, -3); scene.add(rim)
            const fill = new THREE.PointLight(0xffd9e0, 14, 20); fill.position.set(3, 1, 5); scene.add(fill)

            // Materials
            const gold = new THREE.MeshStandardMaterial({ color: 0xd4a24c, metalness: 1, roughness: 0.28 })
            const goldDrip = new THREE.MeshStandardMaterial({ color: 0xe0b45a, metalness: 0.95, roughness: 0.2 })
            const ivory = new THREE.MeshPhysicalMaterial({ color: 0xf6efe4, roughness: 0.55, sheen: 0.4, sheenColor: new THREE.Color(0xffffff) })
            const blush = new THREE.MeshPhysicalMaterial({ color: 0xf1cfd2, roughness: 0.5, sheen: 0.4, sheenColor: new THREE.Color(0xffffff) })
            const burgundy = new THREE.MeshStandardMaterial({ color: 0x7a1f38, roughness: 0.45 })
            const pearlMat = new THREE.MeshStandardMaterial({ color: 0xfff7ea, metalness: 0.3, roughness: 0.15 })
            const leafMat = new THREE.MeshStandardMaterial({ color: 0xc5912c, metalness: 0.9, roughness: 0.3, side: THREE.DoubleSide })

            const cake = new THREE.Group()
            scene.add(cake)

            // Stand
            const stand = new THREE.Group()
            const plate = new THREE.Mesh(new THREE.CylinderGeometry(2.25, 2.15, 0.12, 96), gold)
            plate.position.y = 0.9
            const lip = new THREE.Mesh(new THREE.TorusGeometry(2.22, 0.05, 12, 96), gold)
            lip.rotation.x = Math.PI / 2; lip.position.y = 0.96
            const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.38, 0.9, 32), gold)
            stem.position.y = 0.42
            const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.05, 0.1, 64), gold)
            foot.position.y = 0.02
            stand.add(plate, lip, stem, foot)
            cake.add(stand)

            type Tier = { group: import('three').Group; restY: number; drips: import('three').Mesh[]; pearls: import('three').InstancedMesh }
            const tiers: Tier[] = []
            const tierSpecs = [
                { r: 1.75, h: 1.05, mat: ivory, ribbon: true },
                { r: 1.3, h: 0.95, mat: blush, ribbon: false },
                { r: 0.88, h: 0.85, mat: ivory, ribbon: false },
            ]
            let base = 0.96
            tierSpecs.forEach((s, ti) => {
                const g = new THREE.Group()
                const body = new THREE.Mesh(new THREE.CylinderGeometry(s.r, s.r, s.h, 96, 1), s.mat)
                body.position.y = s.h / 2
                g.add(body)
                if (s.ribbon) {
                    const ribbon = new THREE.Mesh(new THREE.CylinderGeometry(s.r + 0.012, s.r + 0.012, 0.16, 96, 1, true), burgundy)
                    ribbon.position.y = 0.22
                    g.add(ribbon)
                }
                // gold band at the base
                const band = new THREE.Mesh(new THREE.TorusGeometry(s.r, 0.035, 10, 96), gold)
                band.rotation.x = Math.PI / 2; band.position.y = 0.03
                g.add(band)
                // drip ring at the top edge + drips running down
                const ring = new THREE.Mesh(new THREE.TorusGeometry(s.r - 0.02, 0.07, 12, 96), goldDrip)
                ring.rotation.x = Math.PI / 2; ring.position.y = s.h - 0.02
                g.add(ring)
                const drips: import('three').Mesh[] = []
                const n = Math.round(s.r * 14)
                for (let i = 0; i < n; i++) {
                    const a = (i / n) * Math.PI * 2 + ti
                    const len = 0.18 + ((i * 37) % 11) / 11 * (s.h * 0.45)
                    const drip = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, len, 4, 10), goldDrip)
                    const pivot = new THREE.Group()
                    pivot.position.set(Math.cos(a) * (s.r + 0.012), s.h, Math.sin(a) * (s.r + 0.012))
                    drip.position.y = -len / 2
                    pivot.add(drip)
                    pivot.scale.y = 0
                    g.add(pivot)
                    drips.push(pivot as unknown as import('three').Mesh)
                }
                // pearls around the base
                const pc = Math.round(s.r * 26)
                const pearls = new THREE.InstancedMesh(new THREE.SphereGeometry(0.055, 12, 10), pearlMat, pc)
                const m = new THREE.Matrix4()
                for (let i = 0; i < pc; i++) {
                    const a = (i / pc) * Math.PI * 2
                    m.makeTranslation(Math.cos(a) * (s.r + 0.03), 0.09, Math.sin(a) * (s.r + 0.03))
                    pearls.setMatrixAt(i, m)
                }
                pearls.scale.setScalar(0.0001)
                g.add(pearls)

                g.position.y = base
                tiers.push({ group: g, restY: base, drips, pearls })
                cake.add(g)
                base += s.h
            })

            // Sugar roses + gold leaves on top
            const topper = new THREE.Group()
            const roseAt = (x: number, z: number, sc: number) => {
                const rose = new THREE.Group()
                for (let i = 0; i < 9; i++) {
                    const petal = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12, 0, Math.PI), burgundy)
                    const a = i * 2.4
                    const rr = 0.04 + i * 0.012
                    petal.position.set(Math.cos(a) * rr, 0.06 + i * 0.006, Math.sin(a) * rr)
                    petal.rotation.set(-0.9 + i * 0.05, a, 0)
                    petal.scale.setScalar(0.55 + i * 0.06)
                    rose.add(petal)
                }
                rose.position.set(x, 0, z)
                rose.scale.setScalar(sc)
                topper.add(rose)
            }
            roseAt(0, 0.04, 1.9); roseAt(0.5, 0.2, 1.3); roseAt(-0.46, 0.24, 1.25)
            for (let i = 0; i < 6; i++) {
                const leaf = new THREE.Mesh(new THREE.CircleGeometry(0.16, 16), leafMat)
                const a = (i / 6) * Math.PI * 2
                leaf.scale.set(0.55, 1.2, 1)
                leaf.position.set(Math.cos(a) * 0.48, 0.05, Math.sin(a) * 0.48)
                leaf.rotation.set(-1.1, a, 0.4)
                topper.add(leaf)
            }
            topper.position.y = base
            topper.scale.setScalar(0.0001)
            cake.add(topper)

            // Floating gold dust
            const dustCount = 120
            const dustGeo = new THREE.BufferGeometry()
            const pos = new Float32Array(dustCount * 3)
            for (let i = 0; i < dustCount; i++) {
                const a = Math.random() * Math.PI * 2, r = 2.4 + Math.random() * 2.2
                pos[i * 3] = Math.cos(a) * r; pos[i * 3 + 1] = Math.random() * 5; pos[i * 3 + 2] = Math.sin(a) * r
            }
            dustGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
            const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: 0xf4dfa9, size: 0.045, transparent: true, opacity: 0.8, depthWrite: false }))
            scene.add(dust)

            // Size to the host
            const resize = () => {
                const w = host.clientWidth, h = host.clientHeight
                if (!w || !h) return
                renderer.setSize(w, h, false)
                camera.aspect = w / h
                camera.updateProjectionMatrix()
            }
            const ro = new ResizeObserver(resize)
            ro.observe(host)
            resize()

            // Mouse lean
            let mx = 0, my = 0, lx = 0, ly = 0
            const onMove = (e: MouseEvent) => {
                mx = e.clientX / window.innerWidth - 0.5
                my = e.clientY / window.innerHeight - 0.5
            }
            window.addEventListener('mousemove', onMove)

            // Only animate while visible
            let visible = true
            const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting })
            io.observe(host)

            const start = performance.now()
            let raf = 0
            const frame = (now: number) => {
                raf = requestAnimationFrame(frame)
                if (!visible) return
                const tt = reduced ? 99 : (now - start) / 1000

                stand.scale.setScalar(Math.max(0.0001, easeOutBack(clamp(tt / 0.6))))
                tiers.forEach((tier, i) => {
                    const k = clamp((tt - 0.5 - i * 0.55) / 0.75)
                    tier.group.position.y = tier.restY + (1 - easeOutBack(k)) * 5
                    tier.group.visible = k > 0
                    const dk = clamp((tt - 2.4 - i * 0.25) / 1.1)
                    tier.drips.forEach((d, j) => { d.scale.y = Math.max(0.0001, clamp(dk * 1.3 - (j % 4) * 0.08)) })
                    tier.pearls.scale.setScalar(Math.max(0.0001, easeOutBack(clamp((tt - 3.0 - i * 0.2) / 0.5))))
                })
                topper.scale.setScalar(Math.max(0.0001, easeOutBack(clamp((tt - 3.6) / 0.7))))

                lx += (mx - lx) * 0.05; ly += (my - ly) * 0.05
                cake.rotation.y = (reduced ? 0.4 : tt * 0.22) + lx * 0.6
                cake.rotation.x = ly * 0.12
                dust.rotation.y = -tt * 0.05
                renderer.render(scene, camera)
            }
            raf = requestAnimationFrame(frame)

            cleanup = () => {
                cancelAnimationFrame(raf)
                window.removeEventListener('mousemove', onMove)
                ro.disconnect(); io.disconnect()
                scene.traverse(o => {
                    const mesh = o as import('three').Mesh
                    mesh.geometry?.dispose?.()
                    const mat = mesh.material as import('three').Material | import('three').Material[] | undefined
                    if (Array.isArray(mat)) mat.forEach(x => x.dispose()); else mat?.dispose?.()
                })
                renderer.dispose()
                renderer.domElement.remove()
            }
        }).catch(() => setFailed(true))

        return () => { disposed = true; cleanup() }
    }, [reduced])

    if (failed) {
        return (
            <div className="hv-arch" style={{ width: '70%', margin: '0 auto', aspectRatio: '3 / 4.2', border: '2px solid #C5912C' }}>
                <img src={asset('/assets/img/hero/wedding.webp')} alt="Couture wedding cake by Saralöwe"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </div>
        )
    }
    return <div ref={hostRef} style={{ width: '100%', height: '100%' }} />
}

export default Cake3D
