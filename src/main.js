// inspo for particles: https://codepen.io/towc/pen/WrjbMw
import spritesheet from './spritesheet.png'
import fontSpritesheet from './font.png'
import { Sprite } from './classes/Sprite.js'
import { Blackhole } from './classes/Blackhole.js'
import { Heart } from './classes/Heart.js'
import { Particle } from './classes/Particle.js'
import { BitmapFont } from './classes/BitmapFont.js'
import { Soldier } from './classes/Soldier.js'
import { Orb } from './classes/Orb.js'
import { boxCollision } from './utils.js'
import {
  SOLDIER_WIDTH,
  SOLDIER_HEIGHT,
  GRAVITY,
  GROUND_HEIGHT,
  GROUND_WIDTH,
} from './globals.js'

const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')

canvas.width = 1024
canvas.height = 576

const FADE_SPEED = 0.003
const GROUND_FRICTION = 0.98
const MAP_TILES_PER_ROW = 64
const PARTICLE_BASE_SIZE = 1
const PARTICLE_ADDED_SIZE = 1
const PLAYER_WIDTH = 45
const PLAYER_HEIGHT = 54
const PLAYER_VELOCITY_X = 400
const PLAYER_JUMP_POWER = 450
const PLAYER_DECELERATION_FRICTION = 0.87
const SCROLL_SPEED = 265
const SCROLL_BUFFER_FOR_PLAYER = 10
const SHRINK_DISTANCE = 20
const SKY_COLOR = '#181622'
const POINTER_COLOR = '#993399'
const DUST_COLOR = '#6abe30'

const groundSprites = []

for (let i = 0; i < 30; i++) {
  groundSprites.push(
    new Sprite({
      position: {
        x: i * GROUND_WIDTH,
        y: canvas.height - GROUND_HEIGHT,
      },
      width: GROUND_WIDTH,
      height: GROUND_HEIGHT,
      imageSrc: spritesheet,
      cropbox: {
        x: 134,
        y: 0,
        width: 16,
        height: 16,
      },
      scale: 4,
    }),
  )
}

class Player {
  constructor({ position = { x: 0, y: 0 }, velocity = { x: 0, y: 0 } }) {
    this.width = PLAYER_WIDTH
    this.height = PLAYER_HEIGHT

    this.position = { x: position.x, y: position.y }
    this.velocity = velocity
    this.hearts = [
      new Heart({
        imageSrc: spritesheet,
        position: {
          x: 10,
          y: 10,
        },
      }),
      new Heart({
        imageSrc: spritesheet,
        position: {
          x: 45,
          y: 10,
        },
      }),

      new Heart({
        imageSrc: spritesheet,
        position: {
          x: 80,
          y: 10,
        },
      }),
    ]

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
    this.state = 'idle'
    this.timePassed = 0
    this.jumpCount = 0
    this.maxJumpCount = 2
    this.invincible = false
    this.showWand = false
    this.wandAlpha = 0
    this.wandRadius = 1
  }

  draw() {
    if (this.imageLoaded) {
      this.drawSprite()
      if (this.showWand) this.drawWand()
    }
  }

  update({ delta, boxes }) {
    this.timePassed += delta
    this.draw()
    this.animateSprite()
    this.position.x += this.velocity.x * delta
    this.checkForHorizontalCollisions({ boxes })
    this.applyGravity(delta)
    this.checkForVerticalCollisions({ boxes })
    this.renderSmokeTrail()
    this.renderDebugBoxes()
    if (this.position.x < 0) this.position.x = 0
  }

  checkForHorizontalCollisions({ boxes }) {
    for (let i = 0; i < boxes.length; i++) {
      const box = boxes[i]

      const isAboveBox = this.position.y + this.height <= box.position.y
      if (isAboveBox) continue

      if (boxCollision({ box1: this, box2: box })) {
        if (this.velocity.x < 0) {
          this.position.x = box.position.x + box.width + 0.01
          break
        }
        if (this.velocity.x > 0) {
          this.position.x = box.position.x - this.width - 0.01
          break
        }
      }
    }
  }

  checkForVerticalCollisions({ boxes }) {
    for (let i = 0; i < boxes.length; i++) {
      const box = boxes[i]

      if (boxCollision({ box1: this, box2: box })) {
        // If the player is moving downward and is just above the box
        if (
          this.velocity.y > 0 &&
          this.position.y + this.height >= box.position.y
        ) {
          this.position.y = box.position.y - this.height // Position the player on top of the box
          this.velocity.y = 0 // Stop any downward motion
          break
        }
      }
    }
  }

  renderDebugBoxes() {
    // width / height
    c.fillStyle = 'rgba(255,0,0,0.2)'
    c.fillRect(this.position.x, this.position.y, this.width, this.height)

    // cropbox width and height
    c.fillStyle = 'rgba(0,0,255,0.2)'
    c.fillRect(
      this.position.x,
      this.position.y,
      this.cropbox.width * this.scale,
      this.cropbox.height * this.scale,
    )
  }

  renderSmokeTrail() {
    if (this.state !== 'run' || this.velocity.y !== 0) return

    if (this.timePassed > 0.02) {
      for (let i = 0; i < 3; i++)
        particles.push(
          new Particle({
            position: {
              x: keys.d.down ? this.position.x : this.position.x + this.width,
              y: this.position.y + this.height + 5,
            },
            velocity: {
              x: keys.d.down ? -15 : 15,
              y: -40,
            },
            fadeSpeed: 1.5,
            radius: PARTICLE_BASE_SIZE + PARTICLE_ADDED_SIZE * Math.random(),
            delay: Math.random() * 0.05,
            color: DUST_COLOR,
          }),
        )
      this.timePassed = 0
    }

    // const radius = 3
    // c.save()
    // c.beginPath()

    // if (blackHole.position.x < this.position.x) {
    //   c.scale(-1, 1)
    //   c.arc(
    //     -this.position.x - this.width,
    //     this.position.y + this.height,
    //     radius,
    //     0,
    //     Math.PI * 2,
    //     false,
    //   )
    // } else {
    //   c.arc(
    //     this.position.x,
    //     this.position.y + this.height,
    //     radius,
    //     0,
    //     Math.PI * 2,
    //     false,
    //   )
    // }
    // c.closePath()
    // c.fillStyle = 'red'
    // c.fill()
    // c.restore()
  }

  applyGravity(delta) {
    this.position.y += this.velocity.y * delta
    this.velocity.y += GRAVITY * delta

    // if touching ground
    if (this.position.y + this.height >= canvas.height - GROUND_HEIGHT) {
      this.position.y = canvas.height - GROUND_HEIGHT - this.height
      this.velocity.y = 0
      this.jumpCount = 0
    }
  }

  drawSprite() {
    // c.fillStyle = 'blue'
    // c.fillRect(this.position.x, this.position.y, this.width, this.height)

    c.save()
    if (blackHole.position.x < this.position.x) {
      c.scale(-1, 1)
      c.drawImage(
        this.image,
        this.cropbox.x * this.currentFrame,
        this.cropbox.y,
        15,
        18,
        -this.position.x - this.width,
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
        this.position.x,
        this.position.y,
        15 * this.scale,
        18 * this.scale,
      )
    }
    c.restore()
  }

  drawWand() {
    const ANGLE_FROM_BLACKHOLE = Math.atan2(
      blackHole.position.y - this.position.y + 14,
      blackHole.position.x - this.position.x - 7,
    )

    if (this.wandAlpha < 1) {
      this.wandAlpha += 0.01
    }

    if (this.wandRadius < 30) {
      this.wandRadius += 0.3
    }

    c.globalAlpha = this.wandAlpha
    // hand
    c.drawImage(
      this.image,
      64,
      14,
      5,
      4,
      this.position.x + 15 + Math.cos(ANGLE_FROM_BLACKHOLE) * this.wandRadius,
      this.position.y + 14 + Math.sin(ANGLE_FROM_BLACKHOLE) * this.wandRadius,
      5 * this.scale,
      4 * this.scale,
    )

    // wand
    const WAND_WIDTH = 8 * this.scale * 0.8
    const WAND_HEIGHT = 18 * this.scale * 0.8
    const OFFSET_X = 14
    const OFFSET_Y = -23

    c.save()
    c.translate(
      this.position.x +
        OFFSET_X +
        Math.cos(ANGLE_FROM_BLACKHOLE) * this.wandRadius +
        WAND_WIDTH / 2,
      this.position.y +
        OFFSET_Y +
        Math.sin(ANGLE_FROM_BLACKHOLE) * this.wandRadius +
        WAND_HEIGHT,
    )
    c.rotate(ANGLE_FROM_BLACKHOLE + Math.PI / 2)
    c.translate(-WAND_WIDTH / 2, -WAND_HEIGHT)
    c.drawImage(this.image, 69, 0, 8, 18, 0, 0, WAND_WIDTH, WAND_HEIGHT)
    c.restore()
    c.globalAlpha = 1
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

  loseHeart() {
    this.invincible = true

    setTimeout(() => {
      console.log('invincible lostt')
      this.invincible = false
    }, 3000)

    for (let i = this.hearts.length - 1; i >= 0; i--) {
      const heart = this.hearts[i]

      if (heart.state !== 'empty') {
        this.hearts[i].state = 'empty'
        this.hearts[i].cropbox.x = 79

        break
      }
    }
  }
}

const player = new Player({
  position: {
    x: canvas.width / 2 - PLAYER_WIDTH / 2 - 5,
    y: canvas.height - PLAYER_HEIGHT - 37,
  },
})

const soldiers = [
  // new Soldier({
  //   position: {
  //     x: canvas.width - 80,
  //     y: canvas.height - SOLDIER_HEIGHT - 32,
  //   },
  //   velocity: {
  //     x: -20.2,
  //     y: 0,
  //   },
  //   direction: 'left',
  //   scale: 3.5,
  //   imageSrc: spritesheet,
  // }),
]

let prevTimestamp = Date.now()
let dragPoints = []
const keys = {
  d: {
    down: false,
  },
  a: {
    down: false,
  },
}
const mouse = {
  down: false,
  radius: 10,
}

const blackHole = new Blackhole({
  position: {
    x: canvas.width / 2,
    y: 150,
  },
  radius: 0,
})

const levels = {
  1: {
    smallSoldiers: {
      left: {
        count: 4,
      },
      right: {
        count: 2,
      },
    },
    largeSoldiers: {
      left: {
        count: 0,
      },
      right: {
        count: 1,
      },
    },
  },
}

const particles = []
const orbs = []

function createOrbGrid({ position }) {
  for (let i = 3; i < 8; i++) {
    for (let j = 3; j < 8; j++) {
      orbs.push(
        new Orb({
          position: {
            x: position.x + i * 30,
            y: position.y + j * 30,
          },
          radius: 7,
        }),
      )
    }
  }
}

// c.scale(0.5, 0.5)
createOrbGrid({
  position: {
    x: 1320,
    y: 10,
  },
})

// in milliseconds
const SKIP_INTRO = false
const SEQUENCE_DELAY_1 = SKIP_INTRO ? 2000 : 100
const SEQUENCE_DELAY_2 = SKIP_INTRO ? 1000 : 100
const SEQUENCE_DELAY_3 = SKIP_INTRO ? 5000 : 100
const SEQUENCE_DELAY_4 = SKIP_INTRO ? 4000 : 100

let fadeAlpha = 1.0
setTimeout(() => {
  game.startFadeFromBlack = true
}, SEQUENCE_DELAY_1)
const game = {
  initalized: false,
  allowPlayerInput: false,
  allowPlayerKeysInput: false,
  startFadeFromBlack: false,
  fadeFromBlack() {
    if (fadeAlpha > 0 && fadeAlpha <= 1) {
      // Draw the black overlay with the current alpha
      c.globalAlpha = fadeAlpha
      c.fillStyle = 'black'
      c.fillRect(0, 0, canvas.width, canvas.height)

      if (!this.startFadeFromBlack) return
      // Decrease the alpha for the next frame
      fadeAlpha -= FADE_SPEED

      // Ensure it doesn't go below 0
      if (fadeAlpha < 0) {
        fadeAlpha = 0
        setTimeout(() => {
          // with you lies the power of omni
          font.nextSequence()
          blackHole.grow(25)

          setTimeout(() => {
            // draw your wand and use its power wisely
            font.nextSequence()
            player.showWand = true

            setTimeout(() => {
              font.nextSequence()
              pointer.fadeIn = true
              this.allowPlayerInput = true
            }, SEQUENCE_DELAY_4)
          }, SEQUENCE_DELAY_3)
        }, SEQUENCE_DELAY_2)
      }
    }

    c.globalAlpha = 1.0 // Reset the alpha
  },
  renderOrbs({ orbs, delta }) {
    for (let i = orbs.length - 1; i >= 0; i--) {
      const orb = orbs[i]

      const distance = Math.hypot(
        orb.center.x - blackHole.position.x,
        orb.center.y - blackHole.position.y,
      )

      if (orb.radius <= 0) {
        orbs.splice(i, 1)
        blackHole.grow(0.5)
      } else {
        orb.update({ delta, c, blackHole })
        if (distance < 30 && orb.state !== 'shrink') orb.shrink()
      }
    }
  },
  renderParticles({ particles, delta }) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const particle = particles[i]

      if (particle.alpha > 0) {
        particle.update({ delta, c })
      } else particles.splice(i, 1)
    }
  },
  movePlayerRightAndScroll({ player, scroll, delta }) {
    if (
      player.position.x <
      canvas.width / 2 + SCROLL_BUFFER_FOR_PLAYER + scroll.value
    )
      player.velocity.x = PLAYER_VELOCITY_X
    else {
      scroll.value += SCROLL_SPEED * delta
      c.translate(-SCROLL_SPEED * delta, 0)
      player.position.x += SCROLL_SPEED * delta
    }
  },
  movePlayerLeftAndScroll({ player, scroll, delta }) {
    if (
      player.position.x >
        canvas.width / 2 - SCROLL_BUFFER_FOR_PLAYER + scroll.value ||
      (scroll.value <= 0 && player.position.x > 0)
    )
      player.velocity.x = -PLAYER_VELOCITY_X
    else if (scroll.value > 0) {
      scroll.value -= SCROLL_SPEED * delta
      c.translate(SCROLL_SPEED * delta, 0)
      player.position.x -= SCROLL_SPEED * delta
    }
  },
}

const stars = []

for (let i = 0; i < 300; i++) {
  stars.push(
    new Particle({
      position: {
        x: Math.random() * (canvas.width * 2),
        y: Math.random() * canvas.height,
      },
      radius: Math.random() * 2,
      color: '#4A86CC',
    }),
  )
}

let scroll = { value: 0 }
const font = new BitmapFont({
  imagePath: fontSpritesheet,
  charWidth: 10,
  charHeight: 14,
  charsPerRow: 26,
})

const pointer = new Sprite({
  position: {
    x: 600,
    y: 300,
  },
  width: 10,
  height: 14,
  imageSrc: fontSpritesheet,
  cropbox: {
    x: 250,
    y: 0,
    width: 16,
    height: 16,
  },
  scale: 2,
  alpha: 0,
})

const boxes = [
  new Sprite({
    position: {
      x: 1220,
      y: 375,
    },
    width: 16,
    height: 16,
    imageSrc: spritesheet,
    cropbox: {
      x: 116,
      y: 0,
      width: 16,
      height: 16,
    },
    scale: 3,
    shouldApplyGravity: true,
    shouldApplyCollisions: true,
  }),
  new Sprite({
    position: {
      x: 1220,
      y: 307,
    },
    width: 16,
    height: 16,
    imageSrc: spritesheet,
    cropbox: {
      x: 116,
      y: 0,
      width: 16,
      height: 16,
    },
    scale: 3,
    shouldApplyGravity: true,
    shouldApplyCollisions: true,
  }),
  new Sprite({
    position: {
      x: 1220,
      y: 247,
    },
    width: 16,
    height: 16,
    imageSrc: spritesheet,
    cropbox: {
      x: 116,
      y: 0,
      width: 16,
      height: 16,
    },
    scale: 3,
    shouldApplyGravity: true,
    shouldApplyCollisions: true,
  }),
]

pointer.initAnimation(pointer.position.x, 420, 200)
const sprites = [...groundSprites, ...boxes]

font.init()

function animate() {
  requestAnimationFrame(animate)

  console.log(player.position.x)

  const currentTimestamp = Date.now()
  const delta = (currentTimestamp - prevTimestamp) / 1000
  prevTimestamp = currentTimestamp

  c.clearRect(scroll.value, 0, canvas.width, canvas.height)
  c.fillStyle = SKY_COLOR
  c.fillRect(scroll.value, 0, canvas.width, canvas.height)

  stars.forEach((star) => {
    star.update({ delta, c, scroll: scroll.value })
  })

  // if (blackHole.allSuckedCount === 1) pointer.fadeOut = true
  pointer.update({ c, canvas, delta })
  pointer.animateArrow(c)
  game.renderParticles({ particles, delta })

  if (font.currentSequence === 11) {
    pointer.fadeIn = false
    pointer.fadeOut = true
    game.allowPlayerKeysInput = true
  }

  sprites.forEach((sprite) => {
    sprite.update({ c, canvas, delta, player, otherSprites: boxes })
  })

  blackHole.update({
    delta,
    c,
    canvas,
    scroll: scroll.value,
    mouse,
    boxes,
    letters: font.letters,
    font,
  })
  player.update({ delta, boxes, scroll })
  game.renderOrbs({ orbs, delta })

  player.hearts.forEach((heart) => {
    heart.update({ c, scroll: scroll.value })
  })

  player.velocity.x *= PLAYER_DECELERATION_FRICTION
  if (keys.d.down) {
    game.movePlayerRightAndScroll({ player, scroll, delta })
  } else if (keys.a.down) {
    game.movePlayerLeftAndScroll({ player, scroll, delta })
  }

  if (keys.d.down || keys.a.down) player.state = 'run'
  else player.state = 'idle'

  for (let i = soldiers.length - 1; i >= 0; i--) {
    const soldier = soldiers[i]

    if (soldier.totalScale <= 0.1) {
      blackHole.newRadius += soldier.mass
      soldiers.splice(i, 1)
    } else soldier.update({ canvas, player, delta, blackHole, c })
  }

  if (dragPoints.length > 0) {
    c.beginPath()
    c.moveTo(dragPoints[0].x + scroll.value, dragPoints[0].y)

    c.lineTo(dragPoints[1].x + scroll.value, dragPoints[1].y)
    c.lineTo(dragPoints[2].x + scroll.value, dragPoints[2].y)
    c.lineTo(dragPoints[3].x + scroll.value, dragPoints[3].y)
    c.lineWidth = 5
    c.closePath()
    c.fillStyle = POINTER_COLOR
    // c.stroke()
    c.fill()

    c.beginPath()
    c.arc(
      dragPoints[0].x + scroll.value,
      dragPoints[0].y,
      mouse.radius,
      0,
      Math.PI * 2,
      false,
    )

    c.fillStyle = POINTER_COLOR
    c.fill()
  }

  game.fadeFromBlack()

  for (let letter of font.letters) {
    letter.animate()
    letter.draw(c)
  }
}

animate()

addEventListener('mousedown', (e) => {
  if (!game.allowPlayerInput) return

  mouse.down = true
  dragPoints = [
    { x: e.clientX, y: e.clientY },
    { x: e.clientX + mouse.radius, y: e.clientY },
    { x: e.clientX, y: e.clientY },
    { x: e.clientX - mouse.radius, y: e.clientY },
  ]
})

addEventListener('mousemove', (e) => {
  if (!game.allowPlayerInput) return
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

    blackHole.pointer.angle = LAUNCH_ANGLE
  }
})

addEventListener('mouseup', (e) => {
  if (!game.allowPlayerInput) return
  mouse.down = false

  const LAUNCH_POWER = Math.hypot(
    dragPoints[2].x - dragPoints[0].x,
    dragPoints[2].y - dragPoints[0].y,
  )

  const LAUNCH_ANGLE = Math.atan2(
    dragPoints[2].y - dragPoints[0].y,
    dragPoints[2].x - dragPoints[0].x,
  )

  const LAUNCH_REDUCTION = 1

  dragPoints = []

  blackHole.velocity = {
    x: -Math.cos(LAUNCH_ANGLE) * LAUNCH_POWER * LAUNCH_REDUCTION,
    y: -Math.sin(LAUNCH_ANGLE) * LAUNCH_POWER * LAUNCH_REDUCTION,
  }
})

addEventListener('keydown', (e) => {
  if (!game.allowPlayerKeysInput) return

  switch (e.code) {
    case 'KeyA':
      keys.a.down = true
      break
    case 'KeyD':
      keys.d.down = true
      break
    case 'KeyW':
      if (player.jumpCount < player.maxJumpCount) {
        player.velocity.y = -PLAYER_JUMP_POWER
        player.jumpCount++
      }
      break
    case 'KeyS':
      player.velocity.y += 1
      break

    case 'Space':
      if (player.jumpCount < player.maxJumpCount) {
        player.velocity.y = -PLAYER_JUMP_POWER
        player.jumpCount++
      }
      break
  }
})

addEventListener('keyup', (e) => {
  if (!game.allowPlayerKeysInput) return

  switch (e.code) {
    case 'KeyA':
      keys.a.down = false
      break
    case 'KeyD':
      keys.d.down = false
      break
    case 'KeyW':
      player.velocity.y += -1
      break
    case 'KeyS':
      player.velocity.y += 1
      break
  }
})
