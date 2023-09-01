// inspo for particles: https://codepen.io/towc/pen/WrjbMw
import { noise } from '@chriscourses/perlin-noise'

const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')

canvas.width = 1024
canvas.height = 576

c.fillRect(0, 0, canvas.width, canvas.height)

class Bacteria {
  constructor({ position = { x: 0, y: 0 }, velocity = { x: 0, y: 0 } }) {
    this.position = position
    this.velocity = velocity

    // generate circle points
    this.radians = 0
    this.radius = 50
    this.angle = 0
    this.time = 0
    this.incrementor = {
      x: 0,
      y: 0,
    }
  }

  draw() {
    const count = 100
    const radianIncrement = (Math.PI * 2) / count

    c.beginPath()
    for (let i = 0; i < count; i++) {
      const NOISE_AMPLITUDE = 3
      const noiseValue = noise(i * NOISE_AMPLITUDE) * 50 // returns value 0-50
      c.lineTo(
        this.position.x +
          Math.cos(radianIncrement * i) *
            (this.radius + noiseValue + this.incrementor.x),
        this.position.y +
          Math.sin(radianIncrement * i) *
            (this.radius + noiseValue + this.incrementor.y),
      )
    }

    c.closePath()
    c.strokeStyle = 'red'
    c.stroke()
  }

  update() {
    this.draw()
    this.time += 0.01
    this.incrementor.x = Math.cos(this.time) * 5
    this.incrementor.y = Math.sin(this.time) * 5
    // this.radius = Math.abs(50 * Math.sin(this.angle))
    // this.angle += 0.01
  }
}

const bacteria = new Bacteria({
  position: { x: canvas.width / 2, y: canvas.height / 2 },
})

function animate() {
  requestAnimationFrame(animate)
  c.clearRect(0, 0, canvas.width, canvas.height)
  bacteria.update()
}

animate()
