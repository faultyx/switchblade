const request = require('request')
const { promises: fs } = require('fs')
const { createCanvas, registerFont, Context2d, Image } = require('canvas')

const URLtoBuffer = function (url) {
  return new Promise((resolve, reject) => {
    request.get({url, encoding: null, isBuffer: true}, (err, res, body) => {
      if (!err && res && res.statusCode === 200 && body) resolve(body)
      else reject(err || res)
    })
  })
}

const ALIGN = {
  TOP_LEFT: 1,
  TOP_CENTER: 2,
  TOP_RIGHT: 3,
  CENTER_RIGHT: 4,
  BOTTOM_RIGHT: 5,
  BOTTOM_CENTER: 6,
  BOTTOM_LEFT: 7,
  CENTER_LEFT: 8
}

module.exports = class CanvasUtils {
  static initializeHelpers () {
    const self = this

    // Initiliaze fonts
    registerFont('src/assets/fonts/Montserrat-Regular.ttf', {family: 'Montserrat'})
    registerFont('src/assets/fonts/Montserrat-SemiBold.ttf', {family: 'Montserrat SemiBold'})
    registerFont('src/assets/fonts/Montserrat-Bold.ttf', {family: 'Montserrat', weight: 'bold'})
    registerFont('src/assets/fonts/Montserrat-BoldItalic.ttf', {family: 'Montserrat', style: 'italic', weight: 'bold'})
    registerFont('src/assets/fonts/Montserrat-Black.ttf', {family: 'Montserrat Black'})
    registerFont('src/assets/fonts/Montserrat-BlackItalic.ttf', {family: 'Montserrat Black', style: 'italic'})

    // Image loading
    Image.from = function (url, localFile = false) {
      return new Promise(async (resolve, reject) => {
        const b = await (localFile ? fs.readFile(url) : URLtoBuffer(url))
        const img = new Image()
        img.onerror = (e) => reject(e)
        img.onload = () => resolve(img)
        img.src = b
      })
    }

    // Context functions
    Context2d.prototype.roundImage = function (img, x, y, w, h, r) {
      this.drawImage(this.roundImageCanvas(img, w, h, r), x, y, w, h)
      return this
    }

    Context2d.prototype.roundImageCanvas = function (img, w = img.width, h = img.height, r = w * 0.5) {
      const canvas = createCanvas(w, h)
      const ctx = canvas.getContext('2d')

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      ctx.globalCompositeOperation = 'source-over'
      ctx.drawImage(img, 0, 0, w, h)

      ctx.fillStyle = '#fff'
      ctx.globalCompositeOperation = 'destination-in'
      ctx.beginPath()
      ctx.arc(w * 0.5, h * 0.5, r, 0, Math.PI * 2, true)
      ctx.closePath()
      ctx.fill()

      return canvas
    }

    Context2d.prototype.circle = function (x, y, r, a1, a2) {
      this.beginPath()
      this.arc(x, y, r, a1, a2, true)
      this.closePath()
      this.fill()
      return this
    }

    Context2d.prototype.write = function (text, x, y, font = '12px "Montserrat"', align = ALIGN.BOTTOM_LEFT) {
      this.font = font
      const { width, height } = self.measureText(this, font, text)
      const { x: realX, y: realY } = self.resolveAlign(x, y, width, height, align)
      this.fillText(text, realX, realY)
      return {
        leftX: realX,
        rightX: realX + width,
        bottomY: realY,
        topY: realY - height,
        centerX: realX + width * 0.5,
        centerY: realY + height * 0.5,
        width,
        height
      }
    }
  }

  static measureText (ctx, font, text) {
    ctx.font = font
    const measure = ctx.measureText(text)
    return {
      width: measure.width,
      height: measure.actualBoundingBoxAscent
    }
  }

  // Transforms an x, y coordinate into an bottom-left aligned coordinate
  static resolveAlign (x, y, width, height, align) {
    const realCoords = { x, y }
    switch (align) {
      case ALIGN.TOP_LEFT:
        realCoords.y = y + height
        break
      case ALIGN.TOP_CENTER:
        realCoords.x = x - width * 0.5
        realCoords.y = y + height
        break
      case ALIGN.TOP_RIGHT:
        realCoords.x = x - width
        realCoords.y = y + height
        break
      case ALIGN.CENTER_RIGHT:
        realCoords.x = x - width
        realCoords.y = y - height * 0.5
        break
      case ALIGN.BOTTOM_RIGHT:
        realCoords.x = x - width
        break
      case ALIGN.BOTTOM_CENTER:
        realCoords.x = x - width * 0.5
        break
      case ALIGN.CENTER_LEFT:
        realCoords.y = y - height * 0.5
        break
    }
    return realCoords
  }

  static hexToRGB (hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null
  }
}

module.exports.ALIGN = ALIGN
