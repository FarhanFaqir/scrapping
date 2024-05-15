const express = require('express');
const puppeteer = require('puppeteer-core');
const httpStatus = require("http-status");
const { OK, BAD_REQUEST, INTERNAL_SERVER_ERROR, NOT_FOUND } = httpStatus;
const { responseMessage } = require('./helpers');
const app = express();

const PORT = 3000;

const url = "https://www.acesso.gov.pt/jsp/loginRedirectForm.jsp?path=consultarDocumentosAdquirente.action&partID=EFPF";


app.get('/:name/:pass/:startDate/:endDate', async (req, res) => {

  try {
    const { name, pass, startDate, endDate } = req.params;
    if (!name) responseMessage(res, "User name is missing.", BAD_REQUEST);
    if (!pass) responseMessage(res, "User password is missing.", BAD_REQUEST);
    if (!startDate) responseMessage(res, "Start date is missing.", BAD_REQUEST);
    if (!endDate) responseMessage(res, "End date is missing.", BAD_REQUEST);

    console.log("Fetching the data......");
    const linuxBrowserPath = '/usr/bin/google-chrome'; // for Linux OS use this path 
    const windowsBrowserPath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"; // for Windows OS use this path
    const browser = await puppeteer.launch({
      headless: true,
      executablePath: windowsBrowserPath  // please replace this according to your OS
    });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 0 });

    await page.click('label[for="tab2"].tab-label');

    // Perform login actions
    await page.type('#username', '221956654');
    await page.type('#password-nif', '221956654JP');
    await page.click('#sbmtLogin');

    // Perform additional actions on the new page
    let startDatePicker = await page.waitForSelector("#dataInicioFilter");
    let endDatePicker = await page.waitForSelector("#dataFimFilter");

    if (startDatePicker && endDatePicker) {
      const startDateInputElement = await page.$('#dataInicioFilter');
      await startDateInputElement.click({ clickCount: 3 }); // Select all text
      await startDateInputElement.press('Backspace'); // Delete the existing value
      await startDateInputElement.type(startDate);
      await startDateInputElement.press('Enter');

      const endDateInputElement = await page.$('#dataFimFilter');
      await endDateInputElement.click({ clickCount: 3 }); // Select all text
      await endDateInputElement.press('Backspace'); // Delete the existing value
      await endDateInputElement.type(endDate);
      await endDateInputElement.press('Enter');
    }

    await page.waitForTimeout(2000); // Wait for 2 seconds before clicking the button
    await page.click('#pesquisar');

    let allData = [];
    let headings;
    let documents = await page.waitForSelector("#documentos_length > label > select");
    if (!documents) {
      return res.json({
        totalCount: 0,
        headings: [],
        data: []
      });
    }

    await page.waitForTimeout(2000);

    let fetching = true;
    const visitedPages = new Set();

    while (fetching) {
      const currentPageElement = await page.$('#documentos_paginate > ul > li.active > a');
      const currentPage = await (currentPageElement ? currentPageElement.evaluate((el) => el.textContent.trim()) : '');

      // Check if the current page has already been visited
      if (visitedPages.has(currentPage)) {
        fetching = false; // Exit the loop if the current page has been visited
        break;
      }

      visitedPages.add(currentPage); // Add the current page to the visited pages set

      headings = await page.$$eval('#documentos > thead > tr > th', thElements => thElements.map(th => th.textContent.trim()));
      const data = await page.$$eval('#documentos > tbody > tr', rows => {
        return rows.map(row => {
          const tds = Array.from(row.querySelectorAll('td'));
          return tds.map(td => (td ? td.textContent.trim() : ''));
        });
      });

      allData = allData.concat(data);

      const nextButtonHandle = await page.$('#documentos_paginate > ul > li.next > a');

      if (nextButtonHandle === null) {
        fetching = false;
      } else {
        const nextButton = await page.evaluateHandle(element => element.click(), nextButtonHandle);
        await Promise.all([
          nextButton,
          page.waitForSelector('#documentos > tbody > tr')
        ]);
      }
    }

    await browser.close();

    return res.json({
      totalCount: allData.length,
      headings: headings,
      data: allData
    });

  } catch (error) {
    console.error(error); // Log the error for debugging purposes

    // Handle the error gracefully and return an error response
    return res.status(INTERNAL_SERVER_ERROR).json({
      error: "An error occurred while processing the request."
    });
  }
});


app.listen(PORT, () => {
  console.log(`App is running on http://localhost:${PORT}`);
});
