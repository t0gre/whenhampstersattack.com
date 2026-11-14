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
    <div class="tips">WASD move • Shift sprint • Space jump • F slash</div>
  </div>
`

const scene = new THREE.Scene()
scene.background = new THREE.Color('#a8c5db')
scene.fog = new THREE.Fog('#a8c5db', 18, 90)

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200)
camera.position.set(0, 7, 12)

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.outputColorSpace = THREE.SRGBColorSpace
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.2
app.appendChild(renderer.domElement)

const hemiLight = new THREE.HemisphereLight('#dfe9ff', '#2a2e36', 1.3)
scene.add(hemiLight)

const sun = new THREE.DirectionalLight('#fff2cb', 1.5)
sun.position.set(18, 20, 10)
sun.castShadow = true
sun.shadow.mapSize.set(2048, 2048)
sun.shadow.camera.left = -30
sun.shadow.camera.right = 30
sun.shadow.camera.top = 30
sun.shadow.camera.bottom = -30
scene.add(sun)

const ambientFill = new THREE.PointLight('#ffc27a', 16, 45, 2)
ambientFill.position.set(-12, 8, 12)
scene.add(ambientFill)

const world = new THREE.Group()
scene.add(world)

const roadMaterial = new THREE.MeshStandardMaterial({
  color: '#2d3038',
  roughness: 0.92,
  metalness: 0.06,
})

const sidewalkMaterial = new THREE.MeshStandardMaterial({
  color: '#b0b7c3',
  roughness: 0.95,
})

const ground = new THREE.Mesh(new THREE.BoxGeometry(80, 1, 120), new THREE.MeshStandardMaterial({ color: '#7aa36c', roughness: 1 }))
ground.position.y = -0.6
ground.receiveShadow = true
world.add(ground)

const streetStripGeometry = new THREE.BoxGeometry(80, 0.08, 10)
const laneMarkGeometry = new THREE.BoxGeometry(2, 0.05, 0.5)

for (let z = -45; z <= 45; z += 12) {
  const road = new THREE.Mesh(streetStripGeometry, roadMaterial)
  road.position.set(0, 0, z)
  road.receiveShadow = true
  world.add(road)

  const laneMark = new THREE.Mesh(laneMarkGeometry, new THREE.MeshStandardMaterial({ color: '#f3db7c', emissive: '#5c4e1f', emissiveIntensity: 0.25 }))
  laneMark.position.set(0, 0.05, z)
  world.add(laneMark)
}

const buildingMaterial = new THREE.MeshStandardMaterial({
  color: '#d7d0c7',
  roughness: 0.9,
  metalness: 0.08,
})

const windowMaterial = new THREE.MeshStandardMaterial({
  color: '#f5d07b',
  emissive: '#a77a1f',
  emissiveIntensity: 0.55,
  roughness: 0.5,
})

for (let block = -2; block <= 2; block += 1) {
  const x = block * 18
  for (let z = -44; z <= 44; z += 10) {
    const height = 4 + Math.random() * 12
    const building = new THREE.Group()
    const shell = new THREE.Mesh(new THREE.BoxGeometry(11, height, 8), buildingMaterial)
    shell.position.y = height / 2
    shell.castShadow = true
    shell.receiveShadow = true
    building.add(shell)

    for (let row = 0; row < 3; row += 1) {
      for (let col = 0; col < 2; col += 1) {
        const windowMesh = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.8, 0.3), windowMaterial)
        windowMesh.position.set(col * 3.5 - 2.2, row * 3 + 2.5, 4.15)
        building.add(windowMesh)
      }
    }

    building.position.set(x + (Math.random() > 0.5 ? 10 : -10), 0, z)
    world.add(building)
  }
}

const dumpsterMaterial = new THREE.MeshStandardMaterial({ color: '#6d7a6b', roughness: 0.92 })
const obstaclePositions = [
  [-10, 8], [-15, -10], [9, 20], [14, -25], [-13, 28], [12, 6],
]

const obstacles = []
for (const [x, z] of obstaclePositions) {
  const dumpster = new THREE.Group()
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.8, 2), dumpsterMaterial)
  body.position.y = 0.9
  body.castShadow = true
  body.receiveShadow = true
  dumpster.add(body)

  const lid = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.3, 2.2), new THREE.MeshStandardMaterial({ color: '#5e695d', roughness: 1 }))
  lid.position.y = 1.8
  lid.castShadow = true
  dumpster.add(lid)

  dumpster.position.set(x, 0, z)
  world.add(dumpster)
  obstacles.push({ x, z, radius: 1.8 })
}

function createHero() {
  const group = new THREE.Group()

  const hoodie = new THREE.Mesh(
    new THREE.BoxGeometry(1.1, 1.5, 0.8),
    new THREE.MeshStandardMaterial({ color: '#1d2333', roughness: 0.9 })
  )
  hoodie.position.y = 1.35
  hoodie.castShadow = true
  group.add(hoodie)

  const face = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 0.8, 0.6),
    new THREE.MeshStandardMaterial({ color: '#f2d3b6', roughness: 1 })
  )
  face.position.set(0, 2.3, 0.1)
  face.castShadow = true
  group.add(face)

  const hair = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.25, 0.8),
    new THREE.MeshStandardMaterial({ color: '#2b1e14', roughness: 1 })
  )
  hair.position.set(0, 2.8, 0.05)
  hair.castShadow = true
  group.add(hair)

  const legs = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 1.2, 0.5),
    new THREE.MeshStandardMaterial({ color: '#516174', roughness: 1 })
  )
  legs.position.set(0, 0.2, 0.05)
  legs.castShadow = true
  group.add(legs)

  const sword = new THREE.Group()
  const blade = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 2.1, 0.2),
    new THREE.MeshStandardMaterial({ color: '#dfeaf2', metalness: 0.9, roughness: 0.25 })
  )
  blade.position.y = 1.3
  blade.castShadow = true
  sword.add(blade)

  const handle = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.8, 0.12),
    new THREE.MeshStandardMaterial({ color: '#bd7b2d', roughness: 0.85 })
  )
  handle.position.y = 0.2
  sword.add(handle)

  sword.position.set(0.9, 1.6, 0)
  sword.rotation.z = -0.4
  group.add(sword)

  group.position.set(0, 0, 0)
  return { group, sword, slash: 0, cooldown: 0 }
}

const hero = createHero()
scene.add(hero.group)

const keys = {}
const attackState = { active: false }

window.addEventListener('keydown', (event) => {
  keys[event.code] = true

  if (event.code === 'Space') {
    if (hero.jumpReady) {
      hero.velocityY = 6.2
      hero.jumpReady = false
    }
  }

  if (event.code === 'KeyF' || event.code === 'KeyJ') {
    if (hero.cooldown <= 0) {
      hero.cooldown = 0.45
      hero.slash = 1
      attackState.active = true
    }
  }
})

window.addEventListener('keyup', (event) => {
  keys[event.code] = false
})

window.addEventListener('mousedown', () => {
  if (hero.cooldown <= 0) {
    hero.cooldown = 0.45
    hero.slash = 1
    attackState.active = true
  }
})

const player = {
  position: new THREE.Vector3(0, 0, 0),
  velocity: new THREE.Vector3(),
  health: 100,
  invuln: 0,
  speed: 9,
  sprint: 1,
  radius: 1,
  jumpReady: true,
}

hero.group.position.copy(player.position)

function clampToStreet(value, limit) {
  return Math.min(limit, Math.max(-limit, value))
}

const enemies = []
const hud = {
  health: document.querySelector('#health'),
  score: document.querySelector('#score'),
  wave: document.querySelector('#wave'),
}

function createHamster() {
  const group = new THREE.Group()

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 0.8, 1.2),
    new THREE.MeshStandardMaterial({ color: '#a86f3d', roughness: 1 })
  )
  body.position.y = 0.7
  body.castShadow = true
  group.add(body)

  const belly = new THREE.Mesh(
    new THREE.BoxGeometry(0.75, 0.55, 0.8),
    new THREE.MeshStandardMaterial({ color: '#d9b489', roughness: 1 })
  )
  belly.position.set(0, 0.8, 0.25)
  belly.castShadow = true
  group.add(belly)

  const head = new THREE.Mesh(
    new THREE.BoxGeometry(0.85, 0.7, 0.8),
    new THREE.MeshStandardMaterial({ color: '#c5824a', roughness: 1 })
  )
  head.position.set(0, 1.4, 0.3)
  head.castShadow = true
  group.add(head)

  const snout = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 0.25, 0.2),
    new THREE.MeshStandardMaterial({ color: '#f3d1aa', roughness: 1 })
  )
  snout.position.set(0, 1.4, 0.8)
  snout.castShadow = true
  group.add(snout)

  const eyeMaterial = new THREE.MeshStandardMaterial({ color: '#111111' })
  const leftEye = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.08), eyeMaterial)
  leftEye.position.set(-0.18, 1.55, 0.82)
  group.add(leftEye)
  const rightEye = leftEye.clone()
  rightEye.position.x = 0.18
  group.add(rightEye)

  const tail = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.2, 0.6),
    new THREE.MeshStandardMaterial({ color: '#8b5d35', roughness: 1 })
  )
  tail.position.set(0, 0.7, -0.85)
  tail.rotation.x = 0.7
  group.add(tail)

  const mound = new THREE.Mesh(new THREE.ConeGeometry(0.55, 0.8, 8), new THREE.MeshStandardMaterial({ color: '#6f4332', roughness: 1 }))
  mound.position.set(0, 1.8, -0.15)
  mound.rotation.x = Math.PI
  mound.castShadow = true
  group.add(mound)

  group.position.set(0, 0, 0)
  return { group, hp: 2, attackCooldown: 0, hitFlash: 0 }
}

let score = 0
let wave = 1
let spawnTimer = 0

function spawnHamster() {
  const enemy = createHamster()
  const side = Math.floor(Math.random() * 4)
  const offset = 24 + Math.random() * 10

  if (side === 0) {
    enemy.group.position.set(Math.random() * 30 - 15, 0, -offset)
  } else if (side === 1) {
    enemy.group.position.set(Math.random() * 30 - 15, 0, offset)
  } else if (side === 2) {
    enemy.group.position.set(-offset, 0, Math.random() * 40 - 20)
  } else {
    enemy.group.position.set(offset, 0, Math.random() * 40 - 20)
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

function resolveObstacleCollision(nextX, nextZ) {
  for (const obs of obstacles) {
    const dx = nextX - obs.x
    const dz = nextZ - obs.z
    const dist = Math.hypot(dx, dz)
    if (dist < obs.radius + player.radius) {
      const angle = Math.atan2(dz, dx)
      const overlap = obs.radius + player.radius - dist
      const pushX = Math.cos(angle) * overlap
      const pushZ = Math.sin(angle) * overlap
      nextX += pushX
      nextZ += pushZ
    }
  }
  return { x: nextX, z: nextZ }
}

function applyAttack() {
  const slashRadius = 3.1
  for (const enemy of enemies) {
    const dx = enemy.group.position.x - player.position.x
    const dz = enemy.group.position.z - player.position.z
    const distance = Math.hypot(dx, dz)
    if (distance <= slashRadius) {
      enemy.hp -= 1
      enemy.hitFlash = 0.2
      enemy.group.position.x += (dx / (distance || 1)) * 0.8
      enemy.group.position.z += (dz / (distance || 1)) * 0.8
      if (enemy.hp <= 0) {
        scene.remove(enemy.group)
        const index = enemies.indexOf(enemy)
        if (index >= 0) enemies.splice(index, 1)
        score += 10
      }
    }
  }
}

function update(dt) {
  const moveX = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0)
  const moveZ = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0)

  if (moveX !== 0 || moveZ !== 0) {
    const length = Math.hypot(moveX, moveZ) || 1
    const dirX = moveX / length
    const dirZ = moveZ / length
    const sprint = keys.Shift ? 1.4 : 1
    player.velocity.x = dirX * player.speed * sprint
    player.velocity.z = dirZ * player.speed * sprint
    hero.group.rotation.y = Math.atan2(dirX, dirZ)
  } else {
    player.velocity.x *= 0.8
    player.velocity.z *= 0.8
  }

  const nextX = clampToStreet(player.position.x + player.velocity.x * dt, 28)
  const nextZ = clampToStreet(player.position.z + player.velocity.z * dt, 42)
  const collided = resolveObstacleCollision(nextX, nextZ)
  player.position.x = collided.x
  player.position.z = collided.z

  hero.velocityY = (hero.velocityY ?? 0) - 15 * dt
  hero.group.position.y += (hero.velocityY ?? 0) * dt
  if (hero.group.position.y <= 0) {
    hero.group.position.y = 0
    hero.velocityY = 0
    player.jumpReady = true
  }

  hero.group.position.x = player.position.x
  hero.group.position.z = player.position.z

  if (hero.slash > 0) {
    hero.slash = Math.max(0, hero.slash - dt * 4)
    const swing = 1 - hero.slash
    hero.sword.rotation.z = -0.4 + Math.sin(swing * Math.PI) * 1.6
    hero.sword.rotation.x = -0.7 + Math.sin(swing * Math.PI) * 1.6
    if (swing >= 0.6 && attackState.active) {
      applyAttack()
      attackState.active = false
    }
  } else {
    hero.sword.rotation.z = -0.4
    hero.sword.rotation.x = 0
  }

  hero.cooldown = Math.max(0, hero.cooldown - dt)
  player.invuln = Math.max(0, player.invuln - dt)

  spawnTimer -= dt
  if (spawnTimer <= 0) {
    spawnHamster()
    spawnTimer = Math.max(0.8, 2.4 - wave * 0.12)
  }

  for (const enemy of enemies) {
    const toPlayer = player.position.clone().sub(enemy.group.position)
    const dist = toPlayer.length()
    if (dist > 0.1) {
      const push = toPlayer.normalize().multiplyScalar(1.5 + wave * 0.12)
      enemy.group.position.add(push.clone().multiplyScalar(dt))
      enemy.group.rotation.y = Math.atan2(push.x, push.z)
    }

    if (dist < 1.4) {
      enemy.attackCooldown -= dt
      if (enemy.attackCooldown <= 0) {
        damagePlayer(7 + wave * 0.6)
        enemy.attackCooldown = 1.1
      }
    }

    if (enemy.hitFlash > 0) {
      enemy.hitFlash = Math.max(0, enemy.hitFlash - dt)
      enemy.group.scale.setScalar(1 + enemy.hitFlash * 0.8)
    } else {
      enemy.group.scale.setScalar(1)
    }
  }

  wave = 1 + Math.floor(score / 100)
  hud.health.textContent = Math.max(0, Math.round(player.health))
  hud.score.textContent = score
  hud.wave.textContent = wave
}

for (let i = 0; i < 4; i += 1) {
  spawnHamster()
}

const clock = new THREE.Clock()

function animate() {
  const dt = Math.min(clock.getDelta(), 0.033)
  update(dt)

  const follow = new THREE.Vector3(player.position.x, 3.8, player.position.z + 9.5)
  const lookAt = new THREE.Vector3(player.position.x, 1.8, player.position.z)
  camera.position.lerp(follow, 0.08)
  camera.lookAt(lookAt)

  renderer.render(scene, camera)
  requestAnimationFrame(animate)
}

animate()

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})
