const express = require('express');
const app = express();

const puppeteer = require('puppeteer');
const xlsx = require('xlsx');

const PORT = 3000;

const url = "https://members.museumstoreassociation.org/Login.aspx";

let browser;

app.get('/', async (req, res) => {

    const wb = xlsx.utils.book_new();

    console.log("Opening the browser......");
    if (!browser) {
        browser = await puppeteer.launch({
            headless: false
        });
    }
    const page = await browser.newPage();
    try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 0, });

        await page.evaluate(() => {
            let search = document.querySelector("#u");
            search.value = "3311";
        });
    } catch (e) {
        console.error(e);
    }
    
})

app.listen(PORT, () => {
    console.log(`App is running on http://localhost:${PORT}`);
})
