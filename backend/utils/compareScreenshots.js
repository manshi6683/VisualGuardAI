const fs = require('fs')
const path = require('path')
const pixelmatch = require('pixelmatch')
const { PNG } = require('pngjs')

function compareScreenshots(baselinePath, currentPath, differencePath) {
  const baseline = PNG.sync.read(fs.readFileSync(baselinePath))
  const current = PNG.sync.read(fs.readFileSync(currentPath))

  if (
    baseline.width !== current.width ||
    baseline.height !== current.height
  ) {
    const dimensionMismatch = {
      widthMismatch: baseline.width !== current.width,
      heightMismatch: baseline.height !== current.height,
      baselineDimensions: {
        width: baseline.width,
        height: baseline.height
      },
      currentDimensions: {
        width: current.width,
        height: current.height
      }
    }

    return {
      ...dimensionMismatch,
      totalPixels: baseline.width * baseline.height,
      differentPixels: null,
      differencePercentage: null,
      similarityPercentage: null,
      passed: false,
      dimensionMismatch: true
    }
  }

  const { width, height } = baseline

  const difference = new PNG({ width, height })

  const diffPixels = pixelmatch(
    baseline.data,
    current.data,
    difference.data,
    width,
    height,
    {
      threshold: 0.1,
      includeAA: false,
      alpha: 0.6,
      diffColor: [255, 40, 80],
      aaColor: [255, 190, 0]
    }
  )

  fs.mkdirSync(path.dirname(differencePath), { recursive: true })

  fs.writeFileSync(
    differencePath,
    PNG.sync.write(difference)
  )

  const totalPixels = width * height

  const differencePercentage = Number(
    ((diffPixels / totalPixels) * 100).toFixed(2)
  )

  const similarityPercentage = Number(
    (100 - differencePercentage).toFixed(2)
  )

  return {
    width,
    height,
    totalPixels,
    differentPixels: diffPixels,
    differencePercentage,
    similarityPercentage,
    passed: differencePercentage <= 0.5
  }
}

module.exports = compareScreenshots
