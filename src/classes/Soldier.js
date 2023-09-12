import {
  SOLDIER_WIDTH,
  SOLDIER_HEIGHT,
  GRAVITY,
  GROUND_HEIGHT,
  SHRINK_DISTANCE,
} from '../globals.js'
import { boxCollision } from '../utils.js'

export class Soldier {
  constructor({
    position = { x: 0, y: 0 },
    velocity = { x: 0, y: 0 },
    mass = 10,
    direction = 'left',
    scale = 2.5,
    imageSrc,
  }) {
    this.position = position
    this.velocity = velocity
    this.width = SOLDIER_WIDTH
    this.height = SOLDIER_HEIGHT * scale
    this.msPassed = 0
    this.ATTACK_RATE = 2000
    this.shrink = false

    this.imageLoaded = false
    this.image = new Image()
    this.image.onload = () => {
      this.imageLoaded = true
    }
    this.image.src = imageSrc
    this.cropbox = {
      x: 20,
      y: 19,
      width: 20,
      height: 24,
      offset: {
        y: 10,
      },
    }
    this.frames = 0
    this.maxFrames = 8
    this.frameDelay = 12
    this.currentFrame = 0
    this.scale = scale
    this.state = 'walk'
    this.totalScale = 1
    this.mass = mass
    this.direction = direction
  }

  draw(c) {
    // Calculate the offsets based on the cropbox dimensions and scale.
    const offsetX = (this.cropbox.width * this.scale) / 2
    const offsetY = (this.cropbox.height * this.scale) / 2

    // Save the current drawing state.
    c.save()

    // Translate the context to the player's position plus the offsets.
    // This means we are setting the drawing origin to the center of the player's sprite.
    c.translate(this.position.x + offsetX, this.position.y + offsetY)

    if (this.shrink) {
      // Reduce the total scale by 10%.
      this.totalScale -= 0.1
      c.scale(this.totalScale, this.totalScale)
    }

    if (this.direction === 'left') {
      // Flip the drawing on the x-axis (horizontal flip).
      c.scale(-1, 1)
    }

    // Draw the player's image.
    c.drawImage(
      this.image,
      this.cropbox.x * this.currentFrame,
      this.cropbox.y,
      this.cropbox.width,
      this.cropbox.height,
      -offsetX,
      -offsetY + (this.cropbox.offset ? this.cropbox.offset.y : 0), // Add safety check in case offset is not defined.
      this.cropbox.width * this.scale,
      this.cropbox.height * this.scale,
    )

    this.renderDebugBoxes(c)

    c.restore()

    // Call the debug method.
  }

  renderDebugBoxes(c) {
    // player's center relative to scale
    const offsetX = (this.cropbox.width * this.scale) / 2
    const offsetY = (this.cropbox.height * this.scale) / 2

    // red box
    c.fillStyle = 'rgba(255,0,0,0.2)'
    c.fillRect(-offsetX, -offsetY, this.width, this.height)

    // blue box
    c.fillStyle = 'rgba(0,0,255,0.2)'
    c.fillRect(
      -offsetX,
      -offsetY,
      this.cropbox.width * this.scale,
      this.cropbox.height * this.scale,
    )
  }

  update({ c, player, delta, blackHole, canvas }) {
    this.draw(c)
    this.animateSprite(c)
    this.applyGravity({ delta, canvas })
    this.magnetize(blackHole)
    this.checkIfShouldDamagePlayer({ player, c })

    const isTouchingPlayer = this.shouldAttackPlayer({ delta, player })
    if (isTouchingPlayer && this.state === 'walk') {
      this.setAttackState()
    } else if (!isTouchingPlayer && this.state === 'attack') {
      this.setWalkState()
    } else {
      this.position.x += this.velocity.x * delta
    }
  }

  shouldAttackPlayer({ delta, player }) {
    // if (direction === 'left') {
    //   player.
    // }

    const isTouchingPlayer = boxCollision({ box1: this, box2: player })

    if (isTouchingPlayer) {
      return isTouchingPlayer
    }
  }

  applyGravity({ delta, canvas }) {
    this.position.y += this.velocity.y * delta
    this.velocity.y += GRAVITY

    // if touching ground
    if (this.position.y + this.height >= canvas.height - GROUND_HEIGHT) {
      this.position.y = canvas.height - GROUND_HEIGHT - this.height
      this.velocity.y = 0
    }
  }

  animateSprite() {
    this.frames++

    if (this.frames % this.frameDelay === 0) {
      this.currentFrame++
    }

    this.checkIfAttackIsPermitted()

    if (this.currentFrame >= this.maxFrames) {
      this.frames = 0
      this.currentFrame = 0
    }
  }

  checkIfAttackIsPermitted() {
    this.attackPermitted = false

    if (
      this.state === 'attack' &&
      this.currentFrame > 1 &&
      this.currentFrame < 3 &&
      this.attackPermitted !== true
    ) {
      this.attackPermitted = true
    }
  }

  checkIfShouldDamagePlayer({ player, c }) {
    const attackbox = {
      position: {
        x: this.position.x + 40,
        y: this.position.y,
      },
      width: SOLDIER_WIDTH,
      height: this.height,
    }

    if (
      boxCollision({ box1: attackbox, box2: player }) &&
      this.attackPermitted &&
      !player.invincible
    ) {
      c.fillStyle = 'rgba(0,255,0,0.8)'
      c.fillRect(
        attackbox.position.x,
        attackbox.position.y,
        attackbox.width,
        attackbox.height,
      )

      player.loseHeart()
    }
  }

  setAttackState() {
    this.state = 'attack'
    this.cropbox = {
      x: 38,
      y: 44,
      width: 38,
      height: 28,
      offset: {
        y: 0,
      },
    }
    this.frames = 0
    this.maxFrames = 5
    this.frameDelay = 22
    this.currentFrame = 0
    this.velocity.x = 0
  }

  setWalkState() {
    if (this.currentFrame !== 0) return
    this.state = 'walk'
    this.cropbox = {
      x: 20,
      y: 19,
      width: 20,
      height: 24,
      offset: {
        y: 10,
      },
    }
    this.frames = 0
    this.maxFrames = 8
    this.frameDelay = 12
    this.currentFrame = 0
    this.velocity.x = 0.2
  }

  magnetize(blackHole) {
    // magnetize to black hole
    const MIN_DISTANCE = 200 // set the minimum distance for attraction
    const directionX =
      blackHole.position.x - (this.position.x + this.width / 2 - 15)
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
