const express = require('express');
const app = express();

const puppeteer = require('puppeteer-core');
const PORT = 3000;

// const url = "https://www.linkedin.com/in/amelia-angelica-16877751";
const url = "https://www.linkedin.com/in/andiasri?challengeId=AQFTnHkkh8B5WAAAAYjKDijBhcOwl5dJo2qBgdecA0lE4-wmGryjk5gwI-OpzhvqNT3b3MkHfKcoZnkesPVSg4R_UhQex7pqAQ&submissionId=27b5e77b-1e7d-6917-bac6-e199a616ab08&challengeSource=AgG1h-hQBnHFZwAAAYjKDwoNsmYoj5Lgydenkm-IN8MDBz4y-WZ4Mn4y11Fg2kI&challegeType=AgGOMTl6I3dwQQAAAYjKDwoQPEL9R7IJ2kkiRKiYdSt_7iPEVTvNRvs&memberId=AgH1RnjtSvUKqgAAAYjKDwoSAGOHRO7Ulknuborf7aF0sOA&recognizeDevice=AgFUx3GwVl4AXQAAAYjKDwoVLNRI7qoxMCpRKwgaEn4kxartT0pI";

const getData = async () => {
  console.log("Fetching the data......");
  const linuxBrowserPath = '/usr/bin/google-chrome'; // for Linux OS use this path 
  const windowsBrowserPath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"; // for Windows OS use this path
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: windowsBrowserPath  // please replace this according to your OS
  });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 0 });

  const title = await page.waitForSelector(".top-card-layout__title");

  if(title) {
    const name = await page.$eval('.top-card-layout__title', element => element.textContent.trim());
  const designation = await page.$eval('.top-card-layout__headline', element => element.textContent.trim());
  const address = await page.$eval('.top-card-layout__first-subline > div', element => element.textContent.trim());
  const followers = await page.$eval('.top-card-layout__first-subline > span', element => element.textContent.trim());


 console.log("Name : ", name);
 console.log("Designation : ", designation);
 console.log("Address : ", address);
 console.log("Followers : ", followers);
  }

}

getData();

app.listen(PORT, () => {
  console.log(`App is running on http://localhost:${PORT}`);
});
