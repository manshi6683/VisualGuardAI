
const express = require('express')
const cors = require('cors')
const { chromium, firefox, webkit } = require('playwright')
const path = require('path')
const fs = require('fs')
const crypto = require('crypto')
const db = require('./database/db')
const compareScreenshots = require('./utils/compareScreenshots')
const { IMPORTANT_SELECTORS, compareDOM } = require('./utils/compareDOM')

const app = express()
const PORT = 5000

const screenshotRoot = path.join(__dirname, 'screenshots')
const screenshotDirectory = path.join(screenshotRoot, 'current')
const baselineDirectory = path.join(screenshotRoot, 'baseline')
const differenceDirectory = path.join(screenshotRoot, 'differences')

    // Create screenshot directories
    ;[screenshotDirectory, baselineDirectory, differenceDirectory].forEach(
        directory => fs.mkdirSync(directory, { recursive: true })
    )

app.use(cors())
app.use(express.json())

app.use('/screenshots', express.static(screenshotDirectory))
app.use('/differences', express.static(differenceDirectory))
app.use('/baselines', express.static(baselineDirectory))
app.use(
    '/cross-browser',
    express.static(path.join(screenshotRoot, 'cross-browser'))
)
const validFilename = filename =>
    typeof filename === 'string' &&
    /^[a-zA-Z0-9._-]+\.png$/.test(filename)

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'VisualGuard AI backend is running'
    })
})

// Capture website screenshot and save scan history
app.post('/api/capture', async (req, res) => {
    const { url, viewport = 'Desktop', browserType = 'chromium' } = req.body

    const normalizedUrl = typeof url === 'string' ? url.trim() : ''

    if (!normalizedUrl) {
        return res.status(400).json({
            success: false,
            message: 'Website URL is required'
        })
    }

    let website

    try {
        const urlToParse = /^https?:\/\//i.test(normalizedUrl)
            ? normalizedUrl
            : `https://${normalizedUrl}`

        website = new URL(urlToParse)

        if (!['http:', 'https:'].includes(website.protocol)) {
            throw new Error('Only HTTP and HTTPS URLs are supported')
        }

        const hostname = website.hostname

        if (
            !hostname ||
            (!hostname.includes('.') && hostname !== 'localhost')
        ) {
            throw new Error('Invalid hostname')
        }

    } catch {
        return res.status(400).json({
            success: false,
            message: 'Please provide a valid website URL with a valid hostname'
        })
    }

    const viewportSizes = {
        Desktop: { width: 1440, height: 900 },
        Tablet: { width: 768, height: 1024 },
        Mobile: { width: 390, height: 844 }
    }

    if (!viewportSizes[viewport]) {
        return res.status(400).json({
            success: false,
            message: 'Invalid viewport. Use Desktop, Tablet, or Mobile.'
        })
    }

    const selectedViewport = viewportSizes[viewport]

    let browser

    try {
        const browserEngines = {
            chromium,
            firefox,
            webkit
        }

        const selectedBrowser = browserEngines[browserType]

        if (!selectedBrowser) {
            return res.status(400).json({
                success: false,
                message: 'Invalid browser type. Use chromium, firefox, or webkit.'
            })
        }

        browser = await selectedBrowser.launch({ headless: true })

        const page = await browser.newPage({
            viewport: selectedViewport,
            deviceScaleFactor: 1,
            ignoreHTTPSErrors: browserType === 'webkit'
        })

        page.setDefaultTimeout(15000)

        await page.goto(website.href, {
            waitUntil: 'domcontentloaded',
            timeout: 45000
        })

        await page.evaluate(async () => {
            await document.fonts.ready

            const images = Array.from(document.images)

            await Promise.all(
                images.map(image => {
                    if (image.complete) return Promise.resolve()

                    return new Promise(resolve => {
                        image.addEventListener('load', resolve, { once: true })
                        image.addEventListener('error', resolve, { once: true })
                    })
                })
            )
        })

        const filename = `capture-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.png`

        const screenshotPath = path.join(screenshotDirectory, filename)

        await page.screenshot({
            path: screenshotPath,
            fullPage: true,
            animations: 'disabled'
        })

        const pageTitle = await page.title()

        // Save scan record in SQLite
        const insertScan = db.prepare(`
            INSERT INTO scan_history (
                url, title, viewport, width, height, screenshot, status, browser
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `)

        const scanResult = insertScan.run(
            website.href,
            pageTitle,
            viewport,
            selectedViewport.width,
            selectedViewport.height,
            `/screenshots/${filename}`,
            'Captured',
            browserType
        )

        await browser.close()
        browser = null

        return res.json({
            success: true,
            message: 'Website screenshot captured successfully',
            data: {
                scanId: scanResult.lastInsertRowid,
                url: website.href,
                title: pageTitle,
                viewport,
                dimensions: selectedViewport,
                screenshot: `/screenshots/${filename}`,
                filename,
                capturedAt: new Date().toISOString()
            }
        })

    } catch (error) {
        console.error('Screenshot capture error:', error.message)

        return res.status(500).json({
            success: false,
            message: 'Unable to capture website screenshot',
            error: error.message
        })

    } finally {
        if (browser) {
            await browser.close().catch(() => { })
        }
    }
})
// Cross-browser screenshot comparison
app.post('/api/cross-browser-compare', async (req, res) => {
    const { url, viewport = 'Desktop' } = req.body

    if (!url) {
        return res.status(400).json({
            success: false,
            message: 'Website URL is required'
        })
    }

    const viewportSizes = {
        Desktop: { width: 1440, height: 900 },
        Tablet: { width: 768, height: 1024 },
        Mobile: { width: 390, height: 844 }
    }

    const selectedViewport = viewportSizes[viewport]

    if (!selectedViewport) {
        return res.status(400).json({
            success: false,
            message: 'Invalid viewport'
        })
    }

    const normalizedUrl = typeof url === 'string' ? url.trim() : ''

    if (!normalizedUrl) {
        return res.status(400).json({
            success: false,
            message: 'Website URL is required'
        })
    }

    let website

    try {
        const urlToParse = /^https?:\/\//i.test(normalizedUrl)
            ? normalizedUrl
            : `https://${normalizedUrl}`

        website = new URL(urlToParse)

        if (!['http:', 'https:'].includes(website.protocol)) {
            throw new Error('Only HTTP and HTTPS URLs are supported')
        }

        const hostname = website.hostname

        if (
            !hostname ||
            (!hostname.includes('.') && hostname !== 'localhost')
        ) {
            throw new Error('Invalid hostname')
        }

    } catch {
        return res.status(400).json({
            success: false,
            message: 'Please provide a valid website URL with a valid hostname'
        })
    }

    const browserEngines = {
        chromium,
        firefox,
        webkit
    }

    const outputDirectory = path.join(
        screenshotRoot,
        'cross-browser'
    )

    fs.mkdirSync(outputDirectory, { recursive: true })

    const results = []
    const browserTypes = ['chromium', 'firefox', 'webkit']

    try {
        for (const browserType of browserTypes) {
            let browser

            try {
                browser = await browserEngines[browserType].launch({
                    headless: true
                })

                const page = await browser.newPage({
                    viewport: selectedViewport,
                    deviceScaleFactor: 1,
                    ignoreHTTPSErrors: browserType === 'webkit'
                })

                await page.goto(website.href, {
                    waitUntil: 'domcontentloaded',
                    timeout: 45000
                })

                await page.evaluate(() => document.fonts.ready)
                await page.waitForTimeout(5000)

                const domData = await page.evaluate((importantSelectors) => {

                    const getElementData = (element, index) => {
                        const rect = element.getBoundingClientRect()
                        const style = window.getComputedStyle(element)

                        const tag = element.tagName.toLowerCase()
                        const text = (element.innerText || element.alt || '')
                            .trim()
                            .replace(/\s+/g, ' ')
                            .slice(0, 100)

                        const attributes = [
                            element.id ? `#${element.id}` : null,
                            element.getAttribute('data-testid')
                                ? `[data-testid="${element.getAttribute('data-testid')}"]`
                                : null,
                            element.getAttribute('aria-label')
                                ? `[aria-label="${element.getAttribute('aria-label')}"]`
                                : null,
                            element.getAttribute('name')
                                ? `[name="${element.getAttribute('name')}"]`
                                : null
                        ].filter(Boolean)

                        const parentTag = element.parentElement?.tagName.toLowerCase() || 'body'

                        const stableKey = attributes.length > 0
                            ? `${tag}${attributes.join('')}`
                            : `${parentTag}>${tag}:${text || 'no-text'}`

                        return {
                            id: `${tag}-${index}`,
                            stableKey,
                            tag,
                            x: Number(rect.x.toFixed(2)),
                            y: Number(rect.y.toFixed(2)),
                            width: Number(rect.width.toFixed(2)),
                            height: Number(rect.height.toFixed(2)),
                            visible:
                                rect.width > 0 &&
                                rect.height > 0 &&
                                style.display !== 'none' &&
                                style.visibility !== 'hidden',
                            text
                        }
                    }

                    const allElements = Array.from(
                        document.body.querySelectorAll('*')
                    )
                        .filter(element => {
                            const rect = element.getBoundingClientRect()
                            const style = window.getComputedStyle(element)

                            return (
                                rect.width > 0 &&
                                rect.height > 0 &&
                                style.display !== 'none' &&
                                style.visibility !== 'hidden'
                            )
                        })
                        .map(getElementData)

                    const importantElements = Array.from(
                        document.querySelectorAll(importantSelectors.join(','))
                    )
                        .filter(element => {
                            const rect = element.getBoundingClientRect()
                            const style = window.getComputedStyle(element)

                            return (
                                rect.width > 0 &&
                                rect.height > 0 &&
                                style.display !== 'none' &&
                                style.visibility !== 'hidden'
                            )
                        })
                        .map(getElementData)

                    return {
                        importantElements,
                        allElements
                    }
                }, IMPORTANT_SELECTORS)
                const filename =
                    `cross-${browserType}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.png`

                const screenshotPath = path.join(
                    outputDirectory,
                    filename
                )

                await page.screenshot({
                    path: screenshotPath,
                    fullPage: false,
                    animations: 'disabled'
                })

                results.push({
                    browser: browserType,
                    success: true,
                    screenshot: `/cross-browser/${filename}`,
                    filename,
                    domData
                })

                await browser.close()
                browser = null

            } catch (error) {
                results.push({
                    browser: browserType,
                    success: false,
                    error: error.message
                })
            } finally {
                if (browser) {
                    await browser.close().catch(() => { })
                }
            }
        }
        // Compare Firefox and WebKit screenshots against Chromium
        const chromiumResult = results.find(
            result => result.browser === 'chromium' && result.success
        )

        if (chromiumResult) {
            const chromiumPath = path.join(
                outputDirectory,
                chromiumResult.filename
            )

            for (const browserType of ['firefox', 'webkit']) {
                const browserResult = results.find(
                    result =>
                        result.browser === browserType &&
                        result.success
                )

                if (!browserResult) continue

                try {
                    const currentPath = path.join(
                        outputDirectory,
                        browserResult.filename
                    )

                    const differenceFilename =
                        `cross-diff-${browserType}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.png`

                    const differencePath = path.join(
                        outputDirectory,
                        differenceFilename
                    )

                    const comparison = compareScreenshots(
                        chromiumPath,
                        currentPath,
                        differencePath
                    )

                    browserResult.comparison = {
                        ...comparison,
                        differenceImage: comparison.dimensionMismatch
                            ? null
                            : `/cross-browser/${differenceFilename}`
                    }
                    // Compare browser DOM against Chromium DOM
                    if (chromiumResult.domData && browserResult.domData) {
                        browserResult.domComparison = compareDOM(
                            chromiumResult.domData,
                            browserResult.domData
                        )
                    }

                } catch (error) {
                    browserResult.comparisonError = error.message
                }
            }
        }


        // Save cross-browser comparison results in SQLite
        const chromiumCapture = results.find(
            item => item.browser === 'chromium'
        )

        const firefoxResult = results.find(
            item => item.browser === 'firefox'
        )

        const webkitResult = results.find(
            item => item.browser === 'webkit'
        )

        const firefoxComparison = firefoxResult?.comparison
        const webkitComparison = webkitResult?.comparison
        const getComparisonPassed = (result) => {
            if (!result?.comparison) return null

            return Number(result.comparison.passed)
        }

        const saveHistory = db.prepare(`
            INSERT INTO cross_browser_history (
                url,
                viewport,
                width,
                height,
                chromium_screenshot,
                firefox_screenshot,
                webkit_screenshot,
                firefox_similarity,
                firefox_difference,
                firefox_changed_pixels,
                firefox_difference_image,
                firefox_passed,
                webkit_similarity,
                webkit_difference,
                webkit_changed_pixels,
                webkit_difference_image,
                webkit_passed
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)

        const historyResult = saveHistory.run(
            website.href,
            viewport,
            selectedViewport.width,
            selectedViewport.height,
            chromiumCapture?.screenshot || null,
            firefoxResult?.screenshot || null,
            webkitResult?.screenshot || null,
            firefoxComparison?.similarityPercentage ?? null,
            firefoxComparison?.differencePercentage ?? null,
            firefoxComparison?.differentPixels ?? null,
            firefoxComparison?.differenceImage ?? null,
            getComparisonPassed(firefoxResult),
            webkitComparison?.similarityPercentage ?? null,
            webkitComparison?.differencePercentage ?? null,
            webkitComparison?.differentPixels ?? null,
            webkitComparison?.differenceImage ?? null,
            getComparisonPassed(webkitResult)
        )

        return res.json({
            success: results.every(result => result.success),
            message: 'Cross-browser comparison completed and saved',
            data: {
                historyId: historyResult.lastInsertRowid,
                url: website.href,
                viewport,
                dimensions: selectedViewport,
                results
            }
        })


    } catch (error) {
        console.error('Cross-browser comparison error:', error.message)

        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
})

// Get all cross-browser test history
app.get('/api/cross-browser-history', (req, res) => {
    try {
        const history = db.prepare(`
            SELECT *
            FROM cross_browser_history
            ORDER BY id DESC
        `).all()

        return res.json({
            success: true,
            count: history.length,
            data: history
        })

    } catch (error) {
        console.error('Cross-browser history error:', error.message)

        return res.status(500).json({
            success: false,
            message: 'Unable to fetch cross-browser history'
        })
    }
})
app.get('/api/cross-browser-history/:id', (req, res) => {
    try {
        const id = Number(req.params.id)

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid cross-browser history ID'
            })
        }

        const record = db.prepare(`
            SELECT *
            FROM cross_browser_history
            WHERE id = ?
        `).get(id)

        if (!record) {
            return res.status(404).json({
                success: false,
                message: 'Cross-browser history record not found'
            })
        }

        return res.json({
            success: true,
            data: record
        })

    } catch (error) {
        console.error('Cross-browser detail error:', error.message)

        return res.status(500).json({
            success: false,
            message: 'Unable to fetch cross-browser history details'
        })
    }
})
// Delete a cross-browser history record
app.delete('/api/cross-browser-history/:id', (req, res) => {
    try {
        const id = Number(req.params.id)

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid history record ID'
            })
        }

        const result = db.prepare(`
            DELETE FROM cross_browser_history
            WHERE id = ?
        `).run(id)

        if (result.changes === 0) {
            return res.status(404).json({
                success: false,
                message: 'History record not found'
            })
        }

        return res.json({
            success: true,
            message: 'Cross-browser history deleted successfully'
        })

    } catch (error) {
        console.error('Delete cross-browser history error:', error.message)

        return res.status(500).json({
            success: false,
            message: 'Unable to delete history record'
        })
    }
})
// Save screenshot as baseline
app.post('/api/baseline', (req, res) => {
    try {
        const { currentFilename, projectName } = req.body

        if (!validFilename(currentFilename)) {
            return res.status(400).json({
                success: false,
                message: 'Valid screenshot filename is required'
            })
        }

        const currentPath = path.join(
            screenshotDirectory,
            currentFilename
        )

        if (!fs.existsSync(currentPath)) {
            return res.status(404).json({
                success: false,
                message: 'Current screenshot not found'
            })
        }

        const safeProjectName = String(projectName || 'website')
            .replace(/[^a-zA-Z0-9_-]/g, '_')
            .slice(0, 40)

        const baselineFilename =
            `baseline-${safeProjectName}-${Date.now()}.png`

        const baselinePath = path.join(
            baselineDirectory,
            baselineFilename
        )

        fs.copyFileSync(currentPath, baselinePath)

        res.json({
            success: true,
            message: 'Baseline saved successfully',
            data: { baselineFilename }
        })

    } catch (error) {
        console.error('Baseline error:', error.message)

        res.status(500).json({
            success: false,
            message: error.message
        })
    }
})

// Compare baseline and current screenshots
app.post('/api/compare', (req, res) => {
    try {
        const { baselineFilename, currentFilename } = req.body

        if (
            !validFilename(baselineFilename) ||
            !validFilename(currentFilename)
        ) {
            return res.status(400).json({
                success: false,
                message: 'Invalid screenshot filename'
            })
        }

        const baselinePath = path.join(
            baselineDirectory,
            baselineFilename
        )

        const currentPath = path.join(
            screenshotDirectory,
            currentFilename
        )

        if (
            !fs.existsSync(baselinePath) ||
            !fs.existsSync(currentPath)
        ) {
            return res.status(404).json({
                success: false,
                message: 'Baseline or current screenshot not found'
            })
        }

        const differenceFilename = `diff-${Date.now()}.png`

        const differencePath = path.join(
            differenceDirectory,
            differenceFilename
        )

        const result = compareScreenshots(
            baselinePath,
            currentPath,
            differencePath
        )

        const differenceImage = `/differences/${differenceFilename}`

        // Update corresponding scan history record
        db.prepare(`
            UPDATE scan_history
            SET baseline_filename = ?,
                difference_image = ?,
                similarity_percentage = ?,
                difference_percentage = ?,
                changed_pixels = ?,
                status = ?
            WHERE screenshot = ?
        `).run(
            baselineFilename,
            differenceImage,
            result.similarityPercentage,
            result.differencePercentage,
            result.differentPixels,
            result.passed ? 'Passed' : 'Failed',
            `/screenshots/${currentFilename}`
        )

        res.json({
            success: true,
            message: 'Screenshot comparison completed',
            data: {
                ...result,
                differenceImage
            }
        })

    } catch (error) {
        console.error('Comparison error:', error.message)

        res.status(500).json({
            success: false,
            message: error.message
        })
    }
})


// Get real dashboard statistics from SQLite
app.get('/api/stats', (req, res) => {
    try {
        const stats = db.prepare(`
            SELECT
                COUNT(*) AS totalScans,

                SUM(
                    CASE WHEN status = 'Passed'
                    THEN 1 ELSE 0 END
                ) AS passedScans,

                SUM(
                    CASE WHEN status = 'Failed'
                    THEN 1 ELSE 0 END
                ) AS failedScans,

                SUM(
                    CASE WHEN difference_percentage > 0.5
                    THEN 1 ELSE 0 END
                ) AS visualIssues

            FROM scan_history
        `).get()

        const totalScans = stats.totalScans || 0
        const passedScans = stats.passedScans || 0
        const failedScans = stats.failedScans || 0
        const visualIssues = stats.visualIssues || 0

        const passRate = totalScans > 0
            ? Number(((passedScans / totalScans) * 100).toFixed(2))
            : 0

        res.json({
            success: true,
            data: {
                totalScans,
                passedScans,
                failedScans,
                visualIssues,
                passRate
            }
        })

    } catch (error) {
        console.error('Dashboard stats error:', error.message)

        res.status(500).json({
            success: false,
            message: 'Unable to fetch dashboard statistics'
        })
    }
})

// Get analytics data for the last 7 days
app.get('/api/analytics', (req, res) => {
    try {
        const dailyActivity = db.prepare(`
            SELECT
                date(created_at) AS date,
                COUNT(*) AS totalScans,
                SUM(
                    CASE
                        WHEN difference_percentage > 0.5
                        THEN 1 ELSE 0
                    END
                ) AS visualIssues
            FROM scan_history
            WHERE date(created_at) >= date('now', '-6 days')
            GROUP BY date(created_at)
            ORDER BY date(created_at) ASC
        `).all()

        const distribution = db.prepare(`
            SELECT
                SUM(CASE WHEN status = 'Passed' THEN 1 ELSE 0 END) AS passed,
                SUM(CASE WHEN status = 'Failed' THEN 1 ELSE 0 END) AS failed,
                SUM(CASE WHEN status = 'Captured' THEN 1 ELSE 0 END) AS pending
            FROM scan_history
        `).get()

        res.json({
            success: true,
            data: {
                dailyActivity,
                distribution: {
                    passed: distribution.passed || 0,
                    failed: distribution.failed || 0,
                    pending: distribution.pending || 0
                }
            }
        })

    } catch (error) {
        console.error('Analytics error:', error.message)

        res.status(500).json({
            success: false,
            message: 'Unable to fetch analytics data'
        })
    }
})

// Get all scan history
app.get('/api/history', (req, res) => {
    try {
        const scans = db.prepare(`
            SELECT * FROM scan_history
            ORDER BY id DESC
        `).all()

        res.json({
            success: true,
            count: scans.length,
            data: scans
        })

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
})

// Get one scan by ID
app.get('/api/history/:id', (req, res) => {
    try {
        const scan = db.prepare(`
            SELECT * FROM scan_history WHERE id = ?
        `).get(req.params.id)

        if (!scan) {
            return res.status(404).json({
                success: false,
                message: 'Scan record not found'
            })
        }

        res.json({
            success: true,
            data: scan
        })

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
})

// Delete one scan record
app.delete('/api/history/:id', (req, res) => {
    try {
        const id = Number(req.params.id)

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid scan ID'
            })
        }

        const result = db.prepare(`
            DELETE FROM scan_history WHERE id = ?
        `).run(id)

        if (result.changes === 0) {
            return res.status(404).json({
                success: false,
                message: 'Scan record not found'
            })
        }

        return res.json({
            success: true,
            message: 'Scan history record deleted successfully'
        })

    } catch (error) {
        console.error('Delete scan error:', error.message)

        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
})

app.listen(PORT, () => {
    console.log(`VisualGuard AI API running at http://localhost:${PORT}`)
})
