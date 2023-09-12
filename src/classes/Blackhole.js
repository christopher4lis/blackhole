import { GROUND_HEIGHT, GROUND_FRICTION } from '../globals.js'
import { circleRectCollisionResponse } from '../utils.js'
export class Blackhole {
  constructor({
    position = { x: 0, y: 0 },
    velocity = { x: 0, y: 0 },
    radius = 5,
  }) {
    this.position = position
    this.velocity = velocity
    this.radius = radius
    this.newRadius = radius

    this.pointer = {
      x: this.position.x,
      y: this.position.y,
      radius: 5,
      angle: 0,
    }

    this.timePassed = 0
  }

  draw(c) {
    // larger purple blur
    c.beginPath()
    c.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2, false)
    c.shadowColor = '#490385'
    c.shadowBlur = 50 + Math.abs(Math.sin(this.timePassed)) * 10
    c.fillStyle = 'rgba(0,0,0,1)'
    c.fill()
    c.fillStyle = 'rgba(0,0,0,1)'
    c.fill()
    c.fillStyle = 'rgba(0,0,0,1)'
    c.fill()
    c.fillStyle = 'rgba(0,0,0,1)'
    c.fill()
    c.fillStyle = 'rgba(0,0,0,1)'
    c.fill()
    // end larger purple blur

    // small purple blur
    c.beginPath()
    c.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2, false)
    c.shadowColor = 'purple'
    c.shadowBlur = 15 + Math.abs(Math.sin(this.timePassed)) * 10
    c.fillStyle = 'rgba(0,0,0,1)'
    c.fill()
    c.fillStyle = 'rgba(0,0,0,1)'
    c.fill()
    c.fillStyle = 'rgba(0,0,0,1)'
    c.fill()
    // end purple blur

    c.shadowBlur = 0

    c.beginPath()
    c.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2, false)
    c.shadowColor = 'black'
    c.shadowBlur = 20
    c.fillStyle = 'black'
    c.fill()
    c.shadowBlur = 0
  }

  update({
    delta,
    c,
    canvas,
    scroll,
    mouse,
    boxes,
    letters,
    font,
    gameInitialized,
  }) {
    this.draw(c)
    this.timePassed += 1.2 * delta
    if (this.enableGravity) this.velocity.y += GRAVITY
    this.position.x += this.velocity.x * delta
    this.position.y += this.velocity.y * delta

    // floor collision
    if (this.position.y + this.radius >= canvas.height - GROUND_HEIGHT) {
      this.velocity.y = 0
      this.velocity.x *= GROUND_FRICTION
      this.position.y = canvas.height - this.radius - GROUND_HEIGHT
    }

    // ceiling collision
    if (this.position.y - this.radius <= 0) {
      this.velocity.y = 0
      this.position.y = this.radius
      this.velocity.x *= GROUND_FRICTION
    }

    // x boundary collision
    if (this.position.x - this.radius - scroll <= 0) {
      this.position.x = this.radius + scroll
      this.velocity.x = 0
      this.velocity.y *= GROUND_FRICTION
    }

    if (this.position.x + this.radius >= canvas.width + scroll) {
      this.position.x = canvas.width - this.radius + scroll
      this.velocity.x = 0
      this.velocity.y *= GROUND_FRICTION
    }

    // Check for collisions with all boxes
    for (let box of boxes) {
      const collisionSide = circleRectCollisionResponse(this, box)
      if (collisionSide) {
        if (collisionSide === 'left' || collisionSide === 'right') {
          // If collision is horizontal, zero out the x velocity
          this.velocity.x *= -0.2 // You can adjust this for a bouncing effect
          this.velocity.y *= GROUND_FRICTION // Sliding friction
        } else if (collisionSide === 'top' || collisionSide === 'bottom') {
          // If collision is vertical, zero out the y velocity
          this.velocity.y *= -0.2 // Adjust for bounce
          this.velocity.x *= GROUND_FRICTION // Sliding friction
        }
        break // Exit early once a collision is detected
      }
    }

    this.runGrow(c)
    this.drawPointer({ c, mouse })
    this.magnetize(letters, font)
  }

  drawPointer({ c, mouse }) {
    if (!mouse.down) return

    // Assuming `this.position` represents the current position of the black hole.
    this.pointer.x = this.position.x
    this.pointer.y = this.position.y

    const tipX =
      this.pointer.x + -Math.cos(this.pointer.angle) * (this.radius + 14) // Increase the length for a longer arrow
    const tipY =
      this.pointer.y + -Math.sin(this.pointer.angle) * (this.radius + 14)

    // Arrowhead
    const size = 10 // Adjust for a larger or smaller arrowhead
    const angle = Math.atan2(tipY - this.pointer.y, tipX - this.pointer.x)
    const angle1 = angle + Math.PI / 6 // Adjust for a wider or narrower arrowhead
    const angle2 = angle - Math.PI / 6

    const x1 = tipX - size * Math.cos(angle1)
    const y1 = tipY - size * Math.sin(angle1)
    const x2 = tipX - size * Math.cos(angle2)
    const y2 = tipY - size * Math.sin(angle2)

    c.beginPath()
    c.moveTo(tipX, tipY)
    c.lineTo(x1, y1)
    c.lineTo(x2, y2)
    c.lineTo(tipX, tipY)
    c.fillStyle = '#993399'
    c.fill()
    c.closePath()
  }

  grow(radius = 1) {
    this.newRadius = this.radius + radius
  }

  runGrow(c) {
    const RADIUS_GROWTH_RATE = 0.1
    if (this.radius < this.newRadius) {
      this.radius += RADIUS_GROWTH_RATE
    }
  }

  magnetize(letters, font) {
    // magnetize to black hole
    const MIN_DISTANCE = 100 // set the minimum distance for attraction
    const SUCKED_IN_THRESHOLD = 5 // Define a size threshold for a letter to be considered sucked in. Adjust as needed.

    let allSuckedIn = true // Initially assume all letters are sucked in

    for (let letter of letters) {
      const directionX = this.position.x - (letter.x + letter.width / 2)
      const directionY = this.position.y - (letter.y + letter.height / 2)
      const distance = Math.sqrt(
        directionX * directionX + directionY * directionY,
      )
      const dx = Math.min(10, 100 / distance) // adjust strength based on distance

      if (distance < MIN_DISTANCE) {
        letter.x += (dx * directionX) / distance
        letter.y += (dx * directionY) / distance

        // If the letter comes within a specific distance of the black hole, make it shrink
        if (distance < this.radius) {
          letter.width /= 2 // This makes the letter half its size when it's within the radius.
          letter.height /= 2

          // Check if letter is not yet "sucked in"
          if (
            letter.width > SUCKED_IN_THRESHOLD ||
            letter.height > SUCKED_IN_THRESHOLD
          ) {
            allSuckedIn = false
          }
        } else {
          allSuckedIn = false // If any letter is outside the black hole's radius, then not all letters are sucked in
        }
      } else {
        allSuckedIn = false // If any letter is outside the minimum distance, then not all letters are sucked in
      }
    }

    // If all letters are sucked into the black hole
    if (allSuckedIn) {
      font.nextSequence()
    }
  }
}
