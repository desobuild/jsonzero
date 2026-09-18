import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'

// Simple CRC32 table & implementation
const crcTable = new Uint32Array(256)
for (let n = 0; n < 256; n++) {
  let c = n
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  }
  crcTable[n] = c
}

function crc32(buf) {
  let crc = 0xffffffff
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}

function createChunk(type, data) {
  const len = data.length
  const buf = Buffer.alloc(12 + len)
  buf.writeUInt32BE(len, 0)
  buf.write(type, 4, 4, 'ascii')
  data.copy(buf, 8)
  const crc = crc32(buf.subarray(4, 8 + len))
  buf.writeUInt32BE(crc, 8 + len)
  return buf
}

function generatePng(width, height, isMaskable = false) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

  // IHDR
  const ihdrData = Buffer.alloc(13)
  ihdrData.writeUInt32BE(width, 0)
  ihdrData.writeUInt32BE(height, 4)
  ihdrData[8] = 8 // bit depth
  ihdrData[9] = 6 // color type RGBA
  ihdrData[10] = 0 // compression
  ihdrData[11] = 0 // filter
  ihdrData[12] = 0 // interlace
  const ihdr = createChunk('IHDR', ihdrData)

  // Uncompressed scanlines
  const bytesPerPixel = 4
  const scanlineLength = 1 + width * bytesPerPixel
  const rawData = Buffer.alloc(height * scanlineLength)

  // Background color: #12131A (R=18, G=19, B=26, A=255)
  // Accent color: #68DBA9 (R=104, G=219, B=169, A=255)
  // Corner radius (if not maskable): ~15% of width
  const cornerRadius = isMaskable ? 0 : Math.round(width * 0.15)

  for (let y = 0; y < height; y++) {
    const rowOffset = y * scanlineLength
    rawData[rowOffset] = 0 // Filter type 0 (None)

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * bytesPerPixel

      // Check rounded corner boundary
      let inside = true
      if (cornerRadius > 0) {
        let dx = 0
        let dy = 0
        if (x < cornerRadius) dx = cornerRadius - x
        else if (x >= width - cornerRadius) dx = x - (width - cornerRadius - 1)

        if (y < cornerRadius) dy = cornerRadius - y
        else if (y >= height - cornerRadius)
          dy = y - (height - cornerRadius - 1)

        if (dx > 0 && dy > 0) {
          if (dx * dx + dy * dy > cornerRadius * cornerRadius) {
            inside = false
          }
        }
      }

      if (!inside) {
        rawData[pxOffset] = 0
        rawData[pxOffset + 1] = 0
        rawData[pxOffset + 2] = 0
        rawData[pxOffset + 3] = 0
        continue
      }

      // Check if pixel belongs to `{ }` glyph
      // We draw clean stylized brackets in center
      // Center bracket coordinates normalized [-1, 1]
      const nx = (x - width / 2) / (width / 2)
      const ny = (y - height / 2) / (height / 2)

      // Left bracket `{` around nx = -0.45 to -0.15
      // Right bracket `}` around nx = 0.15 to 0.45
      // ny ranges from -0.45 to +0.45
      const isLeftBracket = isPixelInBracket(nx, ny, false)
      const isRightBracket = isPixelInBracket(-nx, ny, true)

      if (isLeftBracket || isRightBracket) {
        // Accent #68DBA9
        rawData[pxOffset] = 104
        rawData[pxOffset + 1] = 219
        rawData[pxOffset + 2] = 169
        rawData[pxOffset + 3] = 255
      } else {
        // Surface #12131A
        rawData[pxOffset] = 18
        rawData[pxOffset + 1] = 19
        rawData[pxOffset + 2] = 26
        rawData[pxOffset + 3] = 255
      }
    }
  }

  const compressedData = zlib.deflateSync(rawData, { level: 9 })
  const idat = createChunk('IDAT', compressedData)
  const iend = createChunk('IEND', Buffer.alloc(0))

  return Buffer.concat([signature, ihdr, idat, iend])
}

function isPixelInBracket(nx, ny, _isRight) {
  // Check left bracket `{` normalized in nx in [-0.5, 0], ny in [-0.45, 0.45]
  // Vertical stem around nx = -0.28, width = 0.08
  // Top curve / hook towards nx = -0.16 at ny = -0.42
  // Middle tip at nx = -0.40, ny = 0
  // Bottom curve towards nx = -0.16 at ny = 0.42

  const stemX = -0.26
  const stemWidth = 0.07
  const absY = Math.abs(ny)

  if (absY > 0.44) return false

  // Top/bottom horizontal hooks
  if (absY >= 0.38 && absY <= 0.44) {
    return nx >= stemX && nx <= -0.14
  }

  // Middle center cusp
  if (absY <= 0.08) {
    // Triangular cusp pointing left to -0.38
    const cuspX = stemX - (0.08 - absY) * 1.5
    return nx >= cuspX && nx <= stemX + stemWidth
  }

  // Vertical body
  if (nx >= stemX && nx <= stemX + stemWidth) {
    return true
  }

  return false
}

const publicDir = path.resolve(process.cwd(), 'public')
fs.writeFileSync(
  path.join(publicDir, 'icon-192.png'),
  generatePng(192, 192, false)
)
fs.writeFileSync(
  path.join(publicDir, 'icon-512.png'),
  generatePng(512, 512, false)
)
fs.writeFileSync(
  path.join(publicDir, 'icon-maskable.png'),
  generatePng(512, 512, true)
)

console.log(
  'Successfully generated icon-192.png, icon-512.png, and icon-maskable.png in public/'
)
