
const IMPORTANT_SELECTORS = [
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'button',
    'img',
    'a',
    'input',
    'textarea',
    'select',
    'nav',
    'header',
    'footer',
    '[role="button"]',
    '[role="navigation"]'
]


function compareDOM(chromiumDOM, browserDOM, tolerance = 2) {
    const getElementKey = (element) => {
        return element.stableKey || element.id
    }


    const compareElements = (baseline, current) => {
        const differences = []
        const currentMap = new Map()
        const matchedElements = new Set()

        current.forEach(element => {
            const key = getElementKey(element)

            if (!currentMap.has(key)) {
                currentMap.set(key, [])
            }

            currentMap.get(key).push(element)
        })

        for (const element of baseline) {
            const key = getElementKey(element)
            const candidates = (currentMap.get(key) || [])
                .filter(candidate => !matchedElements.has(candidate))

            if (candidates.length === 0) {
                differences.push({
                    type: 'missing',
                    element: key,
                    message: 'Element missing in compared browser'
                })
                continue
            }

            const matchingElement = candidates.reduce((nearest, candidate) => {
                const distance =
                    Math.abs(element.x - candidate.x) +
                    Math.abs(element.y - candidate.y)

                const nearestDistance =
                    Math.abs(element.x - nearest.x) +
                    Math.abs(element.y - nearest.y)

                return distance < nearestDistance ? candidate : nearest
            })

            matchedElements.add(matchingElement)

            const changedProperties = []

            for (const property of ['x', 'y', 'width', 'height']) {
                if (
                    Math.abs(
                        element[property] - matchingElement[property]
                    ) > tolerance
                ) {
                    changedProperties.push({
                        property,
                        chromium: element[property],
                        comparedBrowser: matchingElement[property]
                    })
                }
            }

            if (changedProperties.length > 0) {
                differences.push({
                    type: 'layout',
                    element: key,
                    changedProperties
                })
            }

            if (element.text !== matchingElement.text) {
                differences.push({
                    type: 'content',
                    element: key,
                    chromium: element.text,
                    comparedBrowser: matchingElement.text
                })
            }
        }

        for (const element of current) {
            if (!matchedElements.has(element)) {
                differences.push({
                    type: 'extra',
                    element: getElementKey(element),
                    message: 'Additional element in compared browser'
                })
            }
        }

        return differences
    }


    const importantDifferences = compareElements(
        chromiumDOM.importantElements,
        browserDOM.importantElements
    )

    const allDifferences = compareElements(
        chromiumDOM.allElements,
        browserDOM.allElements
    )

    const criticalDifferences = importantDifferences.filter(
        difference =>
            difference.type === 'missing' ||
            difference.type === 'extra'
    )

    let status = 'PASSED'

    if (criticalDifferences.length > 0) {
        status = 'FAILED'
    } else if (
        importantDifferences.length > 0 ||
        allDifferences.length > 0
    ) {
        status = 'WARNING'
    }

    return {
        status,
        summary: {
            importantDifferences: importantDifferences.length,
            allElementsDifferences: allDifferences.length,
            criticalDifferences: criticalDifferences.length
        },
        importantElements: {
            total: chromiumDOM.importantElements.length,
            differences: importantDifferences,
            differenceCount: importantDifferences.length
        },
        allElements: {
            total: chromiumDOM.allElements.length,
            differences: allDifferences,
            differenceCount: allDifferences.length
        }
    }
}

module.exports = {
    IMPORTANT_SELECTORS,
    compareDOM
}
