import { GRAVITY, GROUND_HEIGHT } from '../globals.js'
import { boxCollision } from '../utils.js'

export class Sprite {
  constructor({
    position = { x: 0, y: 0 },
    imageSrc,
    cropbox,
    width,
    height,
    scale = 1,
    shouldApplyGravity = false,
    alpha = 1,
  }) {
    this.width = width * scale
    this.height = height * scale

    this.position = position
    this.basePosition = JSON.parse(JSON.stringify(position))

    this.imageLoaded = false
    this.image = new Image()
    this.image.onload = () => {
      this.imageLoaded = true
    }
    this.image.src = imageSrc
    this.cropbox = cropbox
    this.scale = scale
    this.lastPositionX = this.position.x
    this.shouldApplyGravity = shouldApplyGravity
    this.velocity = {
      x: 0,
      y: 0,
    }
    this.alpha = alpha
    this.fadeIn = false
    this.fadeOut = false
  }

  draw(c) {
    c.globalAlpha = this.alpha < 0 ? 0 : this.alpha
    c.drawImage(
      this.image,
      this.cropbox.x,
      this.cropbox.y,
      this.width / this.scale,
      this.height / this.scale,
      this.position.x,
      this.position.y,
      this.width,
      this.height,
    )
    c.globalAlpha = 1

    this.renderDebugBoxes(c)
  }

  renderFadeIn() {
    if (this.alpha < 1 && this.fadeIn) {
      this.alpha += 0.01
    }
  }

  renderFadeOut() {
    if (this.alpha > 0 && this.fadeOut) {
      this.fadeIn = false
      this.alpha -= 0.01
    }
  }

  renderDebugBoxes(c) {
    c.fillStyle = 'rgba(255,0,0,0.2)'
    c.fillRect(this.position.x, this.position.y, this.width, this.height)
  }

  update({ c, canvas, delta, player, otherSprites }) {
    this.draw(c)

    this.renderFadeIn()
    this.renderFadeOut()

    if (this.shouldApplyGravity)
      this.applyGravity({ canvas, delta, otherSprites })
  }

  initAnimation(startPosition, endPosition, duration) {
    this.startPosition = startPosition
    this.endPosition = endPosition
    this.duration = duration
    this.currentProgress = 0
  }

  easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
  }

  applyGravity({ delta, canvas, otherSprites }) {
    this.position.y += this.velocity.y * delta
    this.velocity.y += GRAVITY * delta

    // if touching ground
    if (this.position.y + this.height >= canvas.height - GROUND_HEIGHT) {
      this.position.y = canvas.height - GROUND_HEIGHT - this.height
      this.velocity.y = 0
      return // exit early if the box is on the ground
    }

    // Check for collisions with other boxes
    for (let sprite of otherSprites) {
      // Ensure the sprite being checked is a box and not the current box
      if (sprite !== this && boxCollision({ box1: this, box2: sprite })) {
        // Check if the current box is above the other box
        if (this.position.y + this.height >= sprite.position.y) {
          this.position.y = sprite.position.y - this.height // Position the box on top of the other box
          this.velocity.y = 0 // Stop any downward motion
          break
        }
      }
    }
  }

  animateArrow(c) {
    if (this.currentProgress <= 1) {
      // Calculate the eased position
      const easedProgress = this.easeInOutCubic(this.currentProgress)
      this.position.x =
        this.startPosition +
        easedProgress * (this.endPosition - this.startPosition)
      this.currentProgress += 1 / this.duration
    } else {
      this.position.x = this.basePosition.x
      this.currentProgress = 0 // Reset progress if you want continuous animation
    }
  }
}
