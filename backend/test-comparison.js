
const fs = require('fs')
const path = require('path')
const { PNG } = require('pngjs')
const compareScreenshots = require('./utils/compareScreenshots')

const folder = path.join(__dirname, 'screenshots')

const baseline = new PNG({ width: 300, height: 200 })
const current = new PNG({ width: 300, height: 200 })

// Baseline: dark background
PNG.sync.write(baseline, {
  colorType: 6
})

for (let y = 0; y < 200; y++) {
  for (let x = 0; x < 300; x++) {
    const index = (300 * y + x) * 4

    baseline.data[index] = 20
    baseline.data[index + 1] = 25
    baseline.data[index + 2] = 35
    baseline.data[index + 3] = 255

    current.data[index] = 20
    current.data[index + 1] = 25
    current.data[index + 2] = 35
    current.data[index + 3] = 255

    // Introduce a visual change in current screenshot
    if (x >= 100 && x < 180 && y >= 60 && y < 120) {
      current.data[index] = 255
      current.data[index + 1] = 0
      current.data[index + 2] = 0
    }
  }
}

const baselinePath = path.join(folder, 'baseline', 'test-baseline.png')
const currentPath = path.join(folder, 'current', 'test-current.png')
const differencePath = path.join(folder, 'differences', 'test-difference.png')

fs.mkdirSync(path.dirname(baselinePath), { recursive: true })
fs.mkdirSync(path.dirname(currentPath), { recursive: true })
fs.mkdirSync(path.dirname(differencePath), { recursive: true })

fs.writeFileSync(baselinePath, PNG.sync.write(baseline))
fs.writeFileSync(currentPath, PNG.sync.write(current))

const result = compareScreenshots(
  baselinePath,
  currentPath,
  differencePath
)

console.log('Visual comparison result:')
console.log(result)
console.log('Difference image:', differencePath)
