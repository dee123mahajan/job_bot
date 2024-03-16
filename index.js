const puppeteer = require('puppeteer');

async function applyToJobs(username, password, keywords, location, numJobsToApply) {
    const browser = await puppeteer.launch({ headless: false }); // Change to true for headless mode
    const page = await browser.newPage();

    await page.goto('https://www.linkedin.com/login');

    // Login
    await page.type('#username', username);
    await page.type('#password', password);
    await page.click('.btn__primary--large');
    await page.waitForNavigation();

    // Search for jobs
    const searchUrl = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(keywords)}&location=${encodeURIComponent(location)}`;
    await page.goto(searchUrl);
    try {
        // Wait for the job items to appear
        await page.waitForSelector('.jobs-search-results__list-item', { timeout: 30000 });
    } catch (error) {
        console.error("Error: Timeout waiting for job search results.");
        await browser.close();
        return;
    }

    // Extract job links
    const jobLinks = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('.jobs-search-results__list-item'));
        return links.map(link => link.href);
    });

    // Print job links to verify
    console.log("Job Links:", jobLinks);

    // Apply to jobs
    let appliedJobs = 0;
    for (const jobLink of jobLinks) {
        if (appliedJobs >= numJobsToApply) break;
        const navigationPromise = page.waitForNavigation({ waitUntil: "domcontentloaded" });

        await page.goto(jobLink, { waitUntil: 'networkidle2' }); // Wait for network idle state
        await navigationPromise;

        await page.waitForSelector('.jobs-apply-button');
        await navigationPromise;
        await page.click('.jobs-apply-button');

        await page.waitForSelector('.jobs-apply-form__submit-button');
        await page.click('.jobs-apply-form__submit-button');

        appliedJobs++;
        console.log(`Applied to job ${appliedJobs}`);
    }

    await browser.close();
}

applyToJobs('testemail@gmail.com', 'Testpassword@342', 'Software developer', 'United States', 5);
