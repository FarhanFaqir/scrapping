const express = require('express');
const app = express();

const puppeteer = require('puppeteer-core');

const url = "https://www.vg.no/stromprisen/";

app.get('/', async (req, res) => {

    console.log("Opening the browser......");

    // Accessing browser to control
    const browser = await puppeteer.launch({ headless: true, executablePath: '/usr/bin/google-chrome' });
    // Creating chrome tab to get data from the chrome browser
    const page = await browser.newPage();
    // Passing url in the chrome tab
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 0, });
    // getting the number data from the web page
    let number = await page.evaluate(() => document.querySelector('.stromstotte > div > div > p > strong').textContent);
    // Sending response in the API
    res.status(200).json({
        number : number
    });

    await browser.close();

})
app.listen(3000, () => {
    console.log("App is running on port http://localhost:3000");
})