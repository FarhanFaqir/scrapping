const express = require('express');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const AnonymizeUAPlugin = require('puppeteer-extra-plugin-anonymize-ua');

const app = express();
const PORT = 3000;

const url = "https://stake.com/sports/fifa/gt-sports-league";

const proxyAddress = '217.30.10.33:42189';
const proxyUsername = 'antoncannarile';
const proxyPassword = 'eLLUg9ZeQQ';

app.get('/', async (req, res) => {
    console.log("Opening the browser......");

    puppeteer.use(StealthPlugin());
    puppeteer.use(AnonymizeUAPlugin());

    const browser = await puppeteer.launch({
        headless: true,
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', // Replace with the path to your Chrome/Chromium executable
        args: [
            `--proxy-server=${proxyAddress}`,
            `--proxy-auth=${proxyUsername}:${proxyPassword}`,
            '--no-sandbox',
            '--disable-setuid-sandbox'
        ],
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });


    await page.waitForSelector('.svelte-pulf7y .svelte-1074jmz .content-or-loader.svelte-1uofbko.truncate > span');

    let data = await page.evaluate(() => {
        const spanElements = document.querySelectorAll('.svelte-pulf7y .svelte-1074jmz .content-or-loader.svelte-1uofbko.truncate > span');
        const texts = Array.from(spanElements).map((spanElement) => spanElement.innerText);
        return texts;
    });

    // Disable caching in the response
    res.setHeader('Cache-Control', 'no-store');

    // Remove the URL from the browser history
    res.send('<script>window.history.replaceState({}, document.title, "/");</script>' + data);

    await browser.close();
});

app.listen(PORT, () => {
    console.log(`App is running on http://localhost:${PORT}`);
});
