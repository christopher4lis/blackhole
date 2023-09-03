// inspo for particles: https://codepen.io/towc/pen/WrjbMw
import { noise } from '@chriscourses/perlin-noise'
import spritesheet from './spritesheet.png'

const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')

canvas.width = 1024
canvas.height = 576

const PLAYER_WIDTH = 45
const PLAYER_HEIGHT = 45
const SOLDIER_WIDTH = 50
const SOLDIER_HEIGHT = 50
const GRAVITY = 0.05
const GROUND_FRICTION = 0.98
const SHRINK_DISTANCE = 20

class Crosshair {
  constructor({ position = { x: 0, y: 0 }, velocity = { x: 0, y: 0 } }) {
    this.position = position
    this.velocity = velocity
  }

  draw() {
    const x = this.position.x
    const y = this.position.y
    // top left
    c.beginPath()
    c.moveTo(x, y)
    c.lineTo(x + 7, y)
    c.lineTo(x + 7, y - 7)
    c.strokeStyle = 'yellow'
    c.stroke()

    // top right
    c.beginPath()
    c.moveTo(x + 14, y - 7)
    c.lineTo(x + 14, y)
    c.lineTo(x + 21, y)
    c.strokeStyle = 'yellow'
    c.stroke()

    // bottom left
    c.beginPath()
    c.moveTo(x, y + 7)
    c.lineTo(x + 7, y + 7)
    c.lineTo(x + 7, y + 14)
    c.strokeStyle = 'yellow'
    c.stroke()

    // bottom right
    c.beginPath()
    c.moveTo(x + 14, y + 14)
    c.lineTo(x + 14, y + 7)
    c.lineTo(x + 21, y + 7)
    c.strokeStyle = 'yellow'
    c.stroke()
  }

  update() {
    this.draw()
  }
}

class Player {
  constructor({ position = { x: 0, y: 0 }, velocity = { x: 0, y: 0 } }) {
    this.position = position
    this.velocity = velocity
    this.width = PLAYER_WIDTH
    this.height = PLAYER_HEIGHT
    this.hearts = [
      new Heart({
        position: {
          x: 10,
          y: 10,
        },
      }),
      new Heart({
        position: {
          x: 25,
          y: 10,
        },
      }),

      new Heart({
        position: {
          x: 40,
          y: 10,
        },
      }),
    ]
    this.crosshair = new Crosshair({
      position: {
        x: this.position.x + this.width / 2,
        y: this.position.y - PLAYER_HEIGHT / 2 + 10,
      },
    })
    this.image = new Image()
    this.image.onload = () => {
      this.imageLoaded = true
    }
    this.image.src = spritesheet
    this.cropbox = {
      x: 16,
      y: 0,
      width: 15,
      height: 18,
    }
    this.frames = 0
    this.maxFrames = 4
    this.frameDelay = 10
    this.currentFrame = 0
    this.scale = 3
  }

  draw() {
    if (this.imageLoaded) {
      c.save()
      if (blackHole.position.x < this.position.x) {
        c.scale(-1, 1)
        c.drawImage(
          this.image,
          this.cropbox.x * this.currentFrame,
          this.cropbox.y,
          15,
          18,
          -this.position.x - this.width / 2,
          this.position.y,
          15 * this.scale,
          18 * this.scale,
        )
      } else {
        c.drawImage(
          this.image,
          this.cropbox.x * this.currentFrame,
          this.cropbox.y,
          15,
          18,
          this.position.x - this.width / 2,
          this.position.y,
          15 * this.scale,
          18 * this.scale,
        )
      }

      c.restore()

      const ANGLE_FROM_BLACKHOLE = Math.atan2(
        blackHole.position.y - this.position.y + 14,
        blackHole.position.x - this.position.x - 7,
      )
      c.drawImage(
        this.image,
        64,
        14,
        5,
        4,
        this.position.x - 7 + Math.cos(ANGLE_FROM_BLACKHOLE) * 20,
        this.position.y + 14 + Math.sin(ANGLE_FROM_BLACKHOLE) * 20,
        5 * this.scale,
        4 * this.scale,
      )

      c.save()
      c.drawImage(
        this.image,
        69,
        0,
        8,
        18,
        this.position.x - 10 + Math.cos(ANGLE_FROM_BLACKHOLE) * 20,
        this.position.y - 16 + Math.sin(ANGLE_FROM_BLACKHOLE) * 20,
        8 * this.scale * 0.8,
        18 * this.scale * 0.8,
      )
      c.restore()
    }
  }

  update() {
    this.draw()
    this.animateSprite()
  }

  animateSprite() {
    this.frames++

    if (this.frames % this.frameDelay === 0) {
      this.currentFrame++
    }

    if (this.currentFrame >= this.maxFrames) {
      this.frames = 0
      this.currentFrame = 0
    }
  }
}

class Soldier {
  constructor({ position = { x: 0, y: 0 }, velocity = { x: 0, y: 0 } }) {
    this.position = position
    this.velocity = velocity
    this.width = SOLDIER_WIDTH
    this.height = SOLDIER_HEIGHT
    this.msPassed = 0
    this.ATTACK_RATE = 2000
    this.shrink = false
  }

  draw() {
    c.save()
    c.fillStyle = 'blue'
    c.fillRect(this.position.x, this.position.y, this.width, this.height)
    c.restore()
  }

  update({ player, delta, blackHole }) {
    this.draw()
    if (this.shrink) {
      this.width -= 4
      this.height -= 4
    }

    const isTouchingPlayer =
      this.position.x + this.width >= player.position.x &&
      this.position.x <= player.position.x + player.width
    if (isTouchingPlayer) {
      this.msPassed += delta

      if (this.msPassed > this.ATTACK_RATE) {
        player.hearts.pop()
        this.msPassed = 0
      }

      return
    }

    this.position.x += this.velocity.x
    this.velocity.y += GRAVITY

    if (this.position.y + this.height + this.velocity.y >= canvas.height) {
      this.velocity.y = 0
    } else {
      this.position.y += this.velocity.y
    }

    this.magnetize()
  }

  magnetize() {
    // magnetize to black hole
    const MIN_DISTANCE = 200 // set the minimum distance for attraction
    const directionX = blackHole.position.x - (this.position.x + this.width / 2)
    const directionY =
      blackHole.position.y - (this.position.y + this.height / 2)
    const distance = Math.sqrt(
      directionX * directionX + directionY * directionY,
    )
    const dx = Math.min(10, 100 / distance) // adjust strength based on distance

    if (distance < MIN_DISTANCE) {
      this.position.x += (dx * directionX) / distance
      this.position.y += (dx * directionY) / distance
    }

    if (distance < SHRINK_DISTANCE) this.shrink = true
  }
}

class Heart {
  constructor({ position = { x: 0, y: 0 }, velocity = { x: 0, y: 0 } }) {
    this.position = position
    this.velocity = velocity
  }

  draw() {
    c.fillStyle = 'red'
    c.fillRect(this.position.x, this.position.y, 10, 10)
  }

  update() {
    this.draw()
  }
}

class BlackHole {
  constructor({
    position = { x: 0, y: 0 },
    velocity = { x: 0, y: 0 },
    radius = 5,
  }) {
    this.position = position
    this.velocity = velocity
    this.radius = radius
    this.newRadius = radius
  }

  draw() {
    c.beginPath()
    c.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2, false)
    c.shadowColor = 'black'
    c.shadowBlur = 20
    c.fillStyle = 'black'
    c.fill()
    c.shadowBlur = 0
  }

  update() {
    this.draw()
    if (this.enableGravity) this.velocity.y += GRAVITY
    this.position.x += this.velocity.x

    if (this.position.y + this.radius + this.velocity.y >= canvas.height) {
      this.velocity.y = 0
      this.velocity.x *= GROUND_FRICTION
      this.position.y = canvas.height - this.radius
    } else {
      this.position.y += this.velocity.y
    }

    // ceiling collision
    if (this.position.y - this.radius + this.velocity.y <= 0) {
      this.velocity.y = 0
      this.position.y = this.radius
      this.velocity.x *= GROUND_FRICTION
    }

    // x boundary collision
    if (this.position.x - this.radius + this.velocity.x <= 0) {
      this.position.x = this.radius
      this.velocity.x = 0
      this.velocity.y *= GROUND_FRICTION
    }

    if (this.position.x + this.radius + this.velocity.x >= canvas.width) {
      this.position.x = canvas.width - this.radius
      this.velocity.x = 0
      this.velocity.y *= GROUND_FRICTION
    }

    this.grow()
  }

  grow() {
    if (this.radius < this.newRadius) {
      this.radius += 0.1
    }
  }
}

const player = new Player({
  position: {
    x: canvas.width / 2,
    y: canvas.height - PLAYER_HEIGHT,
  },
})

const soldiers = [
  new Soldier({
    position: {
      x: SOLDIER_WIDTH + 100,
      y: canvas.height - SOLDIER_HEIGHT,
    },
    velocity: {
      x: 0.1,
      y: 0,
    },
  }),
]

let prevTimestamp = Date.now()
let dragPoints = []
const mouse = {
  down: true,
  radius: 10,
}

const blackHole = new BlackHole({
  position: {
    x: 300,
    y: 100,
  },
  radius: 30,
})
function animate() {
  requestAnimationFrame(animate)

  const currentTimestamp = Date.now()
  const delta = currentTimestamp - prevTimestamp
  prevTimestamp = currentTimestamp

  c.clearRect(0, 0, canvas.width, canvas.height)
  c.fillStyle = 'lightblue'
  c.fillRect(0, 0, canvas.width, canvas.height)
  player.update()
  // player.crosshair.update()

  for (let i = soldiers.length - 1; i >= 0; i--) {
    const soldier = soldiers[i]

    if (soldier.width < 5 || soldier.height < 5) {
      blackHole.newRadius += soldier.width
      soldiers.splice(i, 1)
    } else soldier.update({ player, delta, blackHole })
  }

  player.hearts.forEach((heart) => {
    heart.update()
  })

  if (dragPoints.length > 0) {
    c.beginPath()
    c.moveTo(dragPoints[0].x, dragPoints[0].y)

    c.lineTo(dragPoints[1].x, dragPoints[1].y)
    c.lineTo(dragPoints[2].x, dragPoints[2].y)
    c.lineTo(dragPoints[3].x, dragPoints[3].y)
    c.lineWidth = 5
    c.closePath()
    // c.strokeStyle = 'red'
    // c.stroke()
    c.fill()

    c.beginPath()
    c.arc(dragPoints[0].x, dragPoints[0].y, mouse.radius, 0, Math.PI * 2, false)

    c.fillStyle = 'red'
    c.fill()
  }
  blackHole.update()
}

animate()

addEventListener('mousedown', (e) => {
  mouse.down = true
  dragPoints = [
    { x: e.clientX, y: e.clientY },
    { x: e.clientX + mouse.radius, y: e.clientY },
    { x: e.clientX, y: e.clientY },
    { x: e.clientX - mouse.radius, y: e.clientY },
  ]
})

addEventListener('mousemove', (e) => {
  if (mouse.down && dragPoints.length > 0) {
    dragPoints[2].x = e.clientX
    dragPoints[2].y = e.clientY

    const LAUNCH_ANGLE = Math.atan2(
      dragPoints[2].y - dragPoints[0].y,
      dragPoints[2].x - dragPoints[0].x,
    )

    dragPoints[1].x =
      dragPoints[0].x + Math.cos(LAUNCH_ANGLE - Math.PI / 2) * mouse.radius
    dragPoints[1].y =
      dragPoints[0].y + Math.sin(LAUNCH_ANGLE - Math.PI / 2) * mouse.radius
    dragPoints[3].x =
      dragPoints[0].x + Math.cos(LAUNCH_ANGLE + Math.PI / 2) * mouse.radius
    dragPoints[3].y =
      dragPoints[0].y + Math.sin(LAUNCH_ANGLE + Math.PI / 2) * mouse.radius

    player.crosshair.position.x =
      player.position.x + player.width / 2 - Math.cos(LAUNCH_ANGLE) * 10
    player.crosshair.position.y =
      player.position.y - Math.sin(LAUNCH_ANGLE) * 10
  }
})

addEventListener('mouseup', (e) => {
  mouse.down = false

  const LAUNCH_POWER = Math.hypot(
    dragPoints[2].x - dragPoints[0].x,
    dragPoints[2].y - dragPoints[0].y,
  )

  const LAUNCH_ANGLE = Math.atan2(
    dragPoints[2].y - dragPoints[0].y,
    dragPoints[2].x - dragPoints[0].x,
  )

  const LAUNCH_REDUCTION = 0.01

  dragPoints = []

  blackHole.velocity = {
    x: -Math.cos(LAUNCH_ANGLE) * LAUNCH_POWER * LAUNCH_REDUCTION,
    y: -Math.sin(LAUNCH_ANGLE) * LAUNCH_POWER * LAUNCH_REDUCTION,
  }
})

addEventListener('keydown', (e) => {
  switch (e.code) {
    case 'KeyA':
      player.velocity.x += -1
      break
    case 'KeyD':
      player.velocity.x += 1
      break
    case 'KeyW':
      player.velocity.y += -1
      break
    case 'KeyS':
      player.velocity.y += 1
      break
    case 'Digit1':
      player.color = 'red'
      break
    case 'Digit2':
      player.color = 'yellow'
      break
    case 'Digit3':
      player.color = 'teal'
      break

    case 'Space':
      if (player.shrink === true) return

      player.shrink = true
      setTimeout(() => {
        player.shrink = false
      }, 500)
      break
  }
})
