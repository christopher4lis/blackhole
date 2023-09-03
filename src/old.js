// inspo for particles: https://codepen.io/towc/pen/WrjbMw
import { noise } from '@chriscourses/perlin-noise'

const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')

canvas.width = innerWidth
canvas.height = innerHeight

c.fillRect(0, 0, canvas.width, canvas.height)

class Bacteria {
  constructor({
    position = { x: 0, y: 0 },
    velocity = { x: 0, y: 0 },
    color,
    radius,
    minRadius = 5,
    maxRadius = 50,
    wiggleSpeed = 5,
    move = true,
  }) {
    this.position = position
    this.velocity = velocity

    // generate circle points
    this.radians = 0
    this.radius = radius
    this.angle = 0
    this.time = 0
    this.wiggle = {
      x: 0,
      y: 0,
    }
    this.friction = 0.99
    this.color = color
    this.shrink = false
    this.randomNoiseStart = Math.random() * 1000
    this.minRadius = minRadius
    this.maxRadius = maxRadius
    this.wiggleSpeed = wiggleSpeed
    this.move = move
    this.points = this.getPoints()
  }

  draw() {
    const count = 100
    const radianIncrement = (Math.PI * 2) / count

    c.save()
    c.shadowColor = this.color
    c.shadowBlur = 20
    c.beginPath()
    for (let i = 0; i < this.points.length; i++) {
      const point = this.points[i]
      c.lineTo(point.x, point.y)
    }
    c.closePath()
    c.strokeStyle = this.color
    c.stroke()

    c.shadowBlur = 0
    c.fillStyle = '#181622'
    c.fill()

    // c.strokeRect(
    //   this.position.x + 10 + this.wiggle.x * 0.5,
    //   this.position.y - this.radius + 10 + this.wiggle.y * 0.5,
    //   10,
    //   35,
    // )
    // c.strokeRect(
    //   this.position.x - 10 + this.wiggle.x * 0.5,
    //   this.position.y - this.radius + 14 + this.wiggle.y * 0.5,
    //   10,
    //   35,
    // )

    c.restore()
  }

  update(otherBacteria) {
    this.draw()
    this.points = this.getPoints()

    if (!this.move) return

    this.time += 0.01
    this.velocity.x *= this.friction
    this.velocity.y *= this.friction
    this.position.x += this.velocity.x
    this.position.y += this.velocity.y
    this.wiggle.x = Math.cos(this.time) * this.wiggleSpeed
    this.wiggle.y = Math.sin(this.time) * this.wiggleSpeed
    // this.radius = Math.abs(50 * Math.sin(this.angle))
    // this.angle += 0.01

    // determines shrinking and growing
    if (this.shrink && this.radius > this.minRadius) {
      this.radius -= 2
    } else if (!this.shrink && this.radius < this.maxRadius) {
      this.radius += 2
    }
  }

  getPoints() {
    const points = []
    const count = 50
    const radianIncrement = (Math.PI * 2) / count

    for (let i = 0; i < count; i++) {
      const NOISE_AMPLITUDE = 0.1
      const noiseValue =
        noise(this.randomNoiseStart + i * NOISE_AMPLITUDE) * this.radius
      points.push({
        x:
          this.position.x +
          Math.cos(radianIncrement * i) *
            (this.radius + noiseValue + this.wiggle.x),
        y:
          this.position.y +
          Math.sin(radianIncrement * i) *
            (this.radius + noiseValue + this.wiggle.y),
      })
    }

    return points
  }
}

const player = new Bacteria({
  position: { x: -60 + canvas.width / 2, y: canvas.height / 2 },
  radius: 50,
  color: 'yellow',
  move: true,
})

const bacterias = [
  new Bacteria({
    position: { x: canvas.width / 2 + 60, y: canvas.height / 2 },
    radius: 10,
    color: 'yellow',
    maxRadius: 10,
    wiggleSpeed: (Math.random() - 0.5) * 10,
    move: true,
  }),
]

let time = 0
function animate() {
  time += 0.05
  requestAnimationFrame(animate)
  c.clearRect(0, 0, canvas.width, canvas.height)

  // background elements
  for (let i = 0; i < canvas.width; i += 40) {
    for (let j = 0; j < canvas.width; j += 40) {
      c.shadowBlur = 0
      c.fillStyle = 'rgba(255,255,0,0.2)'
      c.fillRect(i, j, 10, 10)
    }
  }

  bacterias.forEach((bacteria) => {
    bacteria.update()
  })

  player.update(bacterias[0])

  // Compute the overlapping points on spawn
  if (bacterias.length === 0) return
  const playerPoints = player.getPoints()
  const bacteriaPoints = bacterias[0].getPoints()

  for (let i = 0; i < playerPoints.length; i++) {
    const p1 = playerPoints[i]
    for (let j = 0; j < bacteriaPoints.length; j++) {
      const p2 = bacteriaPoints[j]

      const dx = p2.x - p1.x
      const dy = p2.y - p1.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      const closeEnough = distance < 10 // Adjust this value as needed

      if (closeEnough) {
        player.points[i].x = p2.x - 2
        player.points[i].y = p2.y - 1

        break
      }
    }
  }
}

animate()

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
