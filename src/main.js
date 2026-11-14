import './style.css'
import * as THREE from 'three'

const app = document.querySelector('#app')
app.innerHTML = `
  <div id="hud">
    <div class="title">when hampsters attack</div>
    <div class="panel">
      <div><span>Health</span><strong id="health">100</strong></div>
      <div><span>Score</span><strong id="score">0</strong></div>
      <div><span>Wave</span><strong id="wave">1</strong></div>
    </div>
    <div id="fps" class="fps">60 FPS</div>
    <div class="tips">WASD move • Shift sprint • Space jump • F slash • Drag to move</div>
  </div>
`

const hud = {
  health: document.querySelector('#health'),
  score: document.querySelector('#score'),
  wave: document.querySelector('#wave'),
  fps: document.querySelector('#fps'),
}

const pointerDrag = {
  active: false,
  dragging: false,
  moveX: 0,
  moveY: 0,
}

function getDragMoveVector() {
  if (!pointerDrag.active || !pointerDrag.dragging) return null

  const dragLen = Math.hypot(pointerDrag.moveX, pointerDrag.moveY)
  if (dragLen < 8) return null

  return {
    x: clamp(pointerDrag.moveX / 140, -1, 1),
    z: clamp(-pointerDrag.moveY / 140, -1, 1),
  }
}

window.addEventListener('pointerdown', (event) => {
  pointerDrag.active = true
  pointerDrag.dragging = false
  pointerDrag.moveX = 0
  pointerDrag.moveY = 0
  pointerDrag.lastX = event.clientX
  pointerDrag.lastY = event.clientY
})

window.addEventListener('pointermove', (event) => {
  if (!pointerDrag.active) return

  const dx = event.clientX - pointerDrag.lastX
  const dy = event.clientY - pointerDrag.lastY
  pointerDrag.lastX = event.clientX
  pointerDrag.lastY = event.clientY
  pointerDrag.moveX += dx
  pointerDrag.moveY += dy

  if (Math.hypot(pointerDrag.moveX, pointerDrag.moveY) > 12) {
    pointerDrag.dragging = true
  }
})

window.addEventListener('pointerup', () => {
  if (!pointerDrag.dragging) {
    triggerAttack()
  }

  pointerDrag.active = false
  pointerDrag.dragging = false
  pointerDrag.moveX = 0
  pointerDrag.moveY = 0
})

window.addEventListener('pointercancel', () => {
  pointerDrag.active = false
  pointerDrag.dragging = false
  pointerDrag.moveX = 0
  pointerDrag.moveY = 0
})

const scene = new THREE.Scene()
scene.background = new THREE.Color('#a3c0d8')
scene.fog = new THREE.Fog('#a3c0d8', 18, 80)

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200)
camera.position.set(0, 5.5, 12)

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.3))
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.outputColorSpace = THREE.SRGBColorSpace
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.1
app.appendChild(renderer.domElement)

const ambient = new THREE.AmbientLight('#dfeaff', 0.7)
scene.add(ambient)

const sun = new THREE.DirectionalLight('#fff0c8', 1.2)
sun.position.set(16, 22, 12)
sun.castShadow = true
sun.shadow.mapSize.set(1024, 1024)
sun.shadow.camera.left = -24
sun.shadow.camera.right = 24
sun.shadow.camera.top = 24
sun.shadow.camera.bottom = -24
scene.add(sun)

const fill = new THREE.PointLight('#ffd59a', 9, 35, 2)
fill.position.set(-12, 8, 10)
scene.add(fill)

const world = new THREE.Group()
scene.add(world)

const ground = new THREE.Mesh(
  new THREE.BoxGeometry(90, 1, 120),
  new THREE.MeshPhongMaterial({ color: '#7ea663', shininess: 10 })
)
ground.position.y = -0.6
ground.receiveShadow = true
world.add(ground)

const street = new THREE.Mesh(
  new THREE.BoxGeometry(72, 0.18, 100),
  new THREE.MeshPhongMaterial({ color: '#2a2d31', shininess: 12 })
)
street.position.y = 0.1
street.receiveShadow = true
world.add(street)

const sidewalkLeft = new THREE.Mesh(
  new THREE.BoxGeometry(16, 0.12, 105),
  new THREE.MeshPhongMaterial({ color: '#b5bcc7', shininess: 8 })
)
sidewalkLeft.position.set(-44, 0.07, 0)
sidewalkLeft.receiveShadow = true
world.add(sidewalkLeft)

const sidewalkRight = sidewalkLeft.clone()
sidewalkRight.position.x = 44
world.add(sidewalkRight)

for (let z = -42; z <= 42; z += 12) {
  const mark = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 0.06, 0.8),
    new THREE.MeshPhongMaterial({ color: '#f0d771', shininess: 26 })
  )
  mark.position.set(0, 0.15, z)
  world.add(mark)
}

const buildingMaterial = new THREE.MeshPhongMaterial({ color: '#d5cfc9', shininess: 10 })
const windowMaterial = new THREE.MeshPhongMaterial({ color: '#f2d17d', emissive: '#a47726', emissiveIntensity: 0.35, shininess: 18 })

const obstacleRects = []

for (let bx = -2; bx <= 2; bx += 1) {
  const baseX = bx * 18 + (bx >= 0 ? 4 : -4)
  for (let bz = -42; bz <= 42; bz += 10) {
    const width = 9 + Math.random() * 4
    const depth = 7 + Math.random() * 2.5
    const height = 5 + Math.random() * 9

    const building = new THREE.Group()
    const shell = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), buildingMaterial)
    shell.position.y = height / 2
    shell.castShadow = true
    shell.receiveShadow = true
    building.add(shell)

    for (let row = 0; row < 3; row += 1) {
      for (let col = 0; col < 2; col += 1) {
        const pane = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.9, 0.2), windowMaterial)
        pane.position.set((col - 0.5) * 3.2, row * 3 + 2.1, depth / 2 + 0.12)
        building.add(pane)
      }
    }

    const x = baseX + (Math.random() > 0.5 ? 7.5 : -7.5)
    building.position.set(x, 0, bz)
    world.add(building)
    obstacleRects.push({ x, z: bz, w: width + 2, d: depth + 2 })
  }
}

function addDumpster(x, z, scale = 1) {
  const group = new THREE.Group()
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(2.2 * scale, 1.7 * scale, 2.1 * scale),
    new THREE.MeshPhongMaterial({ color: '#6d7269', shininess: 8 })
  )
  body.position.y = 0.85 * scale
  body.castShadow = true
  body.receiveShadow = true
  group.add(body)

  const lid = new THREE.Mesh(
    new THREE.BoxGeometry(2.5 * scale, 0.25 * scale, 2.3 * scale),
    new THREE.MeshPhongMaterial({ color: '#56615f', shininess: 8 })
  )
  lid.position.y = 1.75 * scale
  lid.castShadow = true
  group.add(lid)

  group.position.set(x, 0, z)
  world.add(group)
  obstacleRects.push({ x, z, w: 2.5 * scale + 0.8, d: 2.3 * scale + 0.8 })
}

for (const [x, z] of [[-11, 11], [-17, -8], [10, 20], [12, -21], [-13, 28], [15, 5], [0, -30]]) {
  addDumpster(x, z, 1)
}

const keys = {}
const player = {
  position: new THREE.Vector3(0, 0, 0),
  velocity: new THREE.Vector3(),
  radius: 1,
  health: 100,
  invuln: 0,
  speed: 9,
  jumpVel: 6.5,
  grounded: true,
  vy: 0,
  facing: 0,
  attackCooldown: 0,
  attackSwing: 0,
  attackTriggered: false,
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function moveWithCollisions(nextPos, radius) {
  nextPos.x = clamp(nextPos.x, -38 + radius, 38 - radius)
  nextPos.z = clamp(nextPos.z, -46 + radius, 46 - radius)

  for (const rect of obstacleRects) {
    const halfW = rect.w / 2
    const halfD = rect.d / 2
    const closestX = clamp(nextPos.x, rect.x - halfW, rect.x + halfW)
    const closestZ = clamp(nextPos.z, rect.z - halfD, rect.z + halfD)
    const dx = nextPos.x - closestX
    const dz = nextPos.z - closestZ
    const distSq = dx * dx + dz * dz
    if (distSq < radius * radius) {
      const dist = Math.sqrt(distSq) || 0.0001
      const nx = dx / dist
      const nz = dz / dist
      const overlap = radius - dist
      nextPos.x += nx * overlap
      nextPos.z += nz * overlap
    }
  }
}

function buildHero() {
  const group = new THREE.Group()

  const torso = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 1.6, 0.8),
    new THREE.MeshPhongMaterial({ color: '#1f2637', shininess: 12 })
  )
  torso.position.y = 2.2
  torso.castShadow = true
  group.add(torso)

  const head = new THREE.Mesh(
    new THREE.BoxGeometry(0.96, 1.06, 0.82),
    new THREE.MeshPhongMaterial({ color: '#f1d0af', shininess: 8 })
  )
  head.position.set(0, 3.12, 0.12)
  head.castShadow = true
  group.add(head)

  const hair = new THREE.Mesh(
    new THREE.BoxGeometry(1.02, 0.28, 0.86),
    new THREE.MeshPhongMaterial({ color: '#2a1d17', shininess: 10 })
  )
  hair.position.set(0, 3.7, 0.02)
  hair.castShadow = true
  group.add(hair)

  const leftEye = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.12, 0.04),
    new THREE.MeshPhongMaterial({ color: '#111111', shininess: 6 })
  )
  leftEye.position.set(-0.2, 3.16, 0.48)
  group.add(leftEye)

  const rightEye = leftEye.clone()
  rightEye.position.x = 0.2
  group.add(rightEye)

  const smile = new THREE.Mesh(
    new THREE.TorusGeometry(0.15, 0.02, 8, 18, Math.PI),
    new THREE.MeshPhongMaterial({ color: '#9f5d4f', shininess: 6 })
  )
  smile.position.set(0, 2.88, 0.52)
  smile.rotation.z = Math.PI
  group.add(smile)

  const leftLeg = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 1.2, 0.42),
    new THREE.MeshPhongMaterial({ color: '#58677f', shininess: 8 })
  )
  leftLeg.position.set(-0.22, 0.75, 0.05)
  leftLeg.castShadow = true
  group.add(leftLeg)

  const rightLeg = leftLeg.clone()
  rightLeg.position.x = 0.22
  group.add(rightLeg)

  const sword = new THREE.Group()
  const blade = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 2.2, 0.13),
    new THREE.MeshPhongMaterial({ color: '#ddeef7', shininess: 80 })
  )
  blade.position.y = 1.2
  sword.add(blade)

  const guard = new THREE.Mesh(
    new THREE.BoxGeometry(0.52, 0.12, 0.13),
    new THREE.MeshPhongMaterial({ color: '#bb7b2a', shininess: 18 })
  )
  guard.position.y = 0.25
  sword.add(guard)

  const handle = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 0.7, 0.1),
    new THREE.MeshPhongMaterial({ color: '#a56327', shininess: 18 })
  )
  handle.position.y = -0.25
  sword.add(handle)

  sword.position.set(0.9, 2.2, 0.2)
  sword.rotation.z = -0.8
  group.add(sword)

  return { group, sword }
}

const hero = buildHero()
scene.add(hero.group)

function triggerAttack() {
  if (player.attackCooldown > 0) return
  player.attackCooldown = 0.45
  player.attackSwing = 1
  player.attackTriggered = false
}

window.addEventListener('keydown', (event) => {
  keys[event.code] = true
  if (event.code === 'Space' && player.grounded) {
    player.vy = player.jumpVel
    player.grounded = false
  }
  if (event.code === 'KeyF' || event.code === 'KeyJ') triggerAttack()
})
window.addEventListener('keyup', (event) => {
  keys[event.code] = false
})
window.addEventListener('pointerdown', () => triggerAttack())

const enemies = []
let score = 0
let wave = 1
let spawnTimer = 0

function createHamster() {
  const group = new THREE.Group()

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 0.9, 1.1),
    new THREE.MeshPhongMaterial({ color: '#ba723f', shininess: 10 })
  )
  body.position.y = 0.8
  body.castShadow = true
  group.add(body)

  const belly = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 0.5, 0.8),
    new THREE.MeshPhongMaterial({ color: '#dcc39e', shininess: 8 })
  )
  belly.position.set(0, 1.05, 0.2)
  group.add(belly)

  const head = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 0.7, 0.7),
    new THREE.MeshPhongMaterial({ color: '#d08849', shininess: 10 })
  )
  head.position.set(0, 1.55, 0.3)
  group.add(head)

  const hair = new THREE.Mesh(
    new THREE.BoxGeometry(0.82, 0.18, 0.72),
    new THREE.MeshPhongMaterial({ color: '#5b3622', shininess: 8 })
  )
  hair.position.set(0, 1.96, 0.25)
  group.add(hair)

  const snout = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 0.2, 0.22),
    new THREE.MeshPhongMaterial({ color: '#eed0a5', shininess: 8 })
  )
  snout.position.set(0, 1.5, 0.8)
  group.add(snout)

  const leftEye = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.08, 0.08),
    new THREE.MeshPhongMaterial({ color: '#111111', shininess: 6 })
  )
  leftEye.position.set(-0.15, 1.72, 0.82)
  group.add(leftEye)

  const rightEye = leftEye.clone()
  rightEye.position.x = 0.15
  group.add(rightEye)

  const tail = new THREE.Mesh(
    new THREE.BoxGeometry(0.15, 0.15, 0.6),
    new THREE.MeshPhongMaterial({ color: '#8a5538', shininess: 8 })
  )
  tail.position.set(0, 0.8, -0.95)
  tail.rotation.x = 0.6
  group.add(tail)

  return { group, hp: 2, attackCooldown: 0, hitFlash: 0 }
}

function spawnHamster() {
  const enemy = createHamster()
  const edge = 28 + Math.random() * 10
  const side = Math.random() * 4

  if (side < 1) {
    enemy.group.position.set(Math.random() * 28 - 14, 0, -edge)
  } else if (side < 2) {
    enemy.group.position.set(Math.random() * 28 - 14, 0, edge)
  } else if (side < 3) {
    enemy.group.position.set(-edge, 0, Math.random() * 34 - 17)
  } else {
    enemy.group.position.set(edge, 0, Math.random() * 34 - 17)
  }

  scene.add(enemy.group)
  enemies.push(enemy)
}

function damagePlayer(amount) {
  if (player.invuln > 0) return
  player.health = Math.max(0, player.health - amount)
  player.invuln = 0.4
  if (player.health <= 0) {
    score = 0
    wave = 1
    player.health = 100
    while (enemies.length > 0) {
      const enemy = enemies.pop()
      scene.remove(enemy.group)
    }
    spawnHamster()
  }
}

function applyAttack() {
  const attackRadius = 3.2
  const forwardX = Math.sin(player.facing)
  const forwardZ = Math.cos(player.facing)

  for (const enemy of enemies) {
    const dx = enemy.group.position.x - player.position.x
    const dz = enemy.group.position.z - player.position.z
    const dist = Math.hypot(dx, dz)
    if (dist <= attackRadius) {
      const dot = (dx * forwardX + dz * forwardZ) / (dist || 1)
      if (dot > -0.1) {
        enemy.hp -= 1
        enemy.hitFlash = 0.25
        enemy.group.position.x += (dx / (dist || 1)) * 0.8
        enemy.group.position.z += (dz / (dist || 1)) * 0.8
        if (enemy.hp <= 0) {
          scene.remove(enemy.group)
          const index = enemies.indexOf(enemy)
          if (index >= 0) enemies.splice(index, 1)
          score += 10
        }
      }
    }
  }
}

let lastFpsTime = performance.now()
let lastFrameDelta = 0
let fpsBuffer = []

function updateFps(now) {
  const delta = now - lastFpsTime
  lastFpsTime = now
  lastFrameDelta = delta
  fpsBuffer.push(1000 / Math.max(delta, 1))
  if (fpsBuffer.length > 60) fpsBuffer.shift()

  const avg = fpsBuffer.reduce((sum, value) => sum + value, 0) / fpsBuffer.length
  hud.fps.textContent = avg > 59.5 ? '60 FPS' : `${Math.round(avg)} FPS`
}

function update(dt) {
  const keyboardX = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0)
  const keyboardZ = (keys.KeyS || keys.ArrowDown ? 1 : 0) - (keys.KeyW || keys.ArrowUp ? 1 : 0)
  const drag = getDragMoveVector()

  let moveX = keyboardX
  let moveZ = keyboardZ

  if (drag) {
    moveX = drag.x
    moveZ = -drag.z
  }

  if (moveX !== 0 || moveZ !== 0) {
    const len = Math.hypot(moveX, moveZ) || 1
    const dirX = moveX / len
    const dirZ = moveZ / len
    const speed = keys.Shift ? 10.5 : 7.5
    player.velocity.x = dirX * speed
    player.velocity.z = dirZ * speed
    player.facing = Math.atan2(dirX, dirZ)
  } else {
    player.velocity.x *= 0.8
    player.velocity.z *= 0.8
  }

  const nextPos = player.position.clone()
  nextPos.x += player.velocity.x * dt
  nextPos.z += player.velocity.z * dt
  moveWithCollisions(nextPos, player.radius)
  player.position.copy(nextPos)

  player.vy -= 16 * dt
  player.position.y += player.vy * dt
  if (player.position.y <= 0) {
    player.position.y = 0
    player.vy = 0
    player.grounded = true
  }

  player.attackCooldown = Math.max(0, player.attackCooldown - dt)
  player.invuln = Math.max(0, player.invuln - dt)

  if (player.attackSwing > 0) {
    player.attackSwing = Math.max(0, player.attackSwing - dt * 3.5)
    const swing = 1 - player.attackSwing
    hero.sword.rotation.z = -0.8 + Math.sin(swing * Math.PI) * 1.8
    hero.sword.rotation.x = Math.sin(swing * Math.PI) * 1.2
    if (swing > 0.5 && !player.attackTriggered) {
      applyAttack()
      player.attackTriggered = true
    }
  } else {
    hero.sword.rotation.z = -0.8
    hero.sword.rotation.x = 0
  }

  hero.group.position.copy(player.position)
  hero.group.rotation.y = player.facing

  for (const enemy of enemies) {
    const toPlayer = player.position.clone().sub(enemy.group.position)
    const dist = toPlayer.length()
    if (dist > 0.001) {
      const dir = toPlayer.normalize().multiplyScalar((1.3 + wave * 0.1) * dt)
      enemy.group.position.add(dir)
      enemy.group.rotation.y = Math.atan2(dir.x, dir.z)
      moveWithCollisions(enemy.group.position, 0.9)
    }

    if (dist < 1.4) {
      enemy.attackCooldown -= dt
      if (enemy.attackCooldown <= 0) {
        damagePlayer(8 + wave * 0.5)
        enemy.attackCooldown = 1.1
      }
    }

    if (enemy.hitFlash > 0) {
      enemy.hitFlash = Math.max(0, enemy.hitFlash - dt)
      enemy.group.scale.setScalar(1 + enemy.hitFlash * 0.7)
    } else {
      enemy.group.scale.setScalar(1)
    }
  }

  spawnTimer -= dt
  if (spawnTimer <= 0) {
    spawnHamster()
    spawnTimer = Math.max(0.8, 2.4 - wave * 0.15)
  }

  wave = 1 + Math.floor(score / 100)
  hud.health.textContent = Math.round(player.health)
  hud.score.textContent = score
  hud.wave.textContent = wave
}

for (let i = 0; i < 4; i += 1) spawnHamster()

let lastTime = performance.now()
function animate() {
  const now = performance.now()
  const delta = Math.min((now - lastTime) / 1000, 0.033)
  lastTime = now
  updateFps(now)
  update(delta)

  const target = new THREE.Vector3(player.position.x, 5.6, player.position.z + 9.5)
  camera.position.lerp(target, 0.08)
  camera.lookAt(player.position.x, 1.6, player.position.z)

  renderer.render(scene, camera)
  requestAnimationFrame(animate)
}

requestAnimationFrame(animate)

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})
