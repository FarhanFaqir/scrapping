// const express = require('express');
// const app = express();
// const puppeteer = require('puppeteer-core');
const puppeteer = require('puppeteer-extra')
const RecaptchaPlugin = require('puppeteer-extra-plugin-recaptcha');
puppeteer.use(
  RecaptchaPlugin({
    provider: {
      id: '2captcha',
      token: 'b453d96f01a4ffcf67e07348ca095d49' // REPLACE THIS WITH YOUR OWN 2CAPTCHA API KEY ⚡
    },
    visualFeedback: true // colorize reCAPTCHAs (violet = detected, green = solved)
  })
)

puppeteer.launch({ headless: true}).then(async browser => {
    const page = await browser.newPage()
    await page.goto('https://www.google.com/recaptcha/api2/demo')
  
    // That's it, a single line of code to solve reCAPTCHAs 🎉
    await page.solveRecaptchas()
  
    await Promise.all([
        page.waitForNavigation(),
        page.click(`#recaptcha-demo-submit`)
      ])
    await page.screenshot({ path: 'response.png', fullPage: true })
    await browser.close()
  })

// const PORT = 3000;
// const url = "https://stake.com/sports/fifa/gt-sports-league";

// app.get('/', async (req, res) => {
//     console.log("Opening the browser......");
//     const linuxBrowserPath = '/usr/bin/google-chrome'; // for Linux OS use this path
//     const windowsBrowserPath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"; // for Windows OS use this path
//     const macBrowserPath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'; // for macOS use this path
//     const browser = await puppeteer.launch({ headless: false, executablePath: windowsBrowserPath });

//     puppeteerExtra.use(RecaptchaPlugin({
//         provider: {
//             id: '2captcha',
//             token: 'b453d96f01a4ffcf67e07348ca095d49' // Replace with your actual API key from the CAPTCHA solving service provider
//         },
//         visualFeedback: true // Enable visual feedback highlighting the CAPTCHA elements
//     }));

//     const page = await browser.newPage();
//     await page.goto(url, { waitUntil: 'networkidle2', timeout: 0 });

//     // Wait for the CAPTCHA element to appear
//     await page.waitForSelector('#challenge-stage > div > label > input[type=checkbox]');

//     // Solve the CAPTCHA
//     const recaptchaPlugin = puppeteerExtra.plugins.recaptcha;
//     await recaptchaPlugin.solve(page);

//     // Continue with your desired actions after the CAPTCHA is solved
//     // ...

//     // await browser.close();
// });

// app.listen(PORT, () => {
//     console.log(`App is running on http://localhost:${PORT}`);
// });
