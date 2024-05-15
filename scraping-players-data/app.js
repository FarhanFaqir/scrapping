const express = require('express');
const app = express();
const ejs = require("ejs");
const path = require("path");

const puppeteer = require('puppeteer-core');
const xlsx = require('xlsx');
const { responseMessage } = require('./helpers');

const PORT = 3000;

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

const url = "https://www.ultimatetennisstatistics.com/";

app.get("/", (req, res) => {
    res.render('index');
});

app.post('/', async (req, res) => {

    const wb = xlsx.utils.book_new();

    const { playerName, filterType, season, level, surface, opponent } = req.body;
    if(!filterType) return responseMessage(res, 401, "Filter type (Matches, Statistics or Performance) is required.");
    else if(!playerName) return responseMessage(res, 401, "Player name is required.");
    else if(!season) return responseMessage(res, 401, "Match season is required.");
    else if(!level) return responseMessage(res, 401, "Match level is required.");
    else if(!surface) return responseMessage(res, 401, "Match surface is required.");
    else if(!opponent) return responseMessage(res, 401, "Match opponent is required.");

    console.log("Opening the browser......");
    const linuxBrowserPath = '/usr/bin/google-chrome'; // for linux OS use this path 
    const windowsBrowserPath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"; // for windows OS use this path 
    const macBrowserPath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'; //  for mac OS using this path
    const browser = await puppeteer.launch({ headless: false, executablePath: windowsBrowserPath });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 0, });
    
    await page.type(".search-field", playerName);

    let playerSearch = await page.waitForSelector(".ui-menu-item-wrapper");
    if(playerSearch){
        await page.evaluate(() =>{    
            document.querySelector(".ui-menu-item-wrapper").click();
        });

        // if filter type is performance
        if(filterType == 'Performance') {
            let statistics = await page.waitForSelector("#performancePill");
            if(statistics){
                await page.waitForTimeout(3000)
                await page.evaluate(() =>{        
                    document.querySelector("#performancePill").click();
                });  

                let matchesSeason = await page.waitForSelector("#perfSeason");
                if(matchesSeason) {
                    if(season == 'Career') {}
                    else if(season == 'Last 52 Weeks') await page.select("select#perfSeason", "-1");
                    else if(season == '2022') await page.select("select#perfSeason", "2022");
                    else if(season == '2021') await page.select("select#perfSeason", "2021");
                    else if(season == '2020') await page.select("select#perfSeason", "2020");
                    else {
                        await browser.close();
                        return responseMessage(res, 401, "Invalid season.");
                    }
                }

                let matchesLevel = await page.waitForSelector("#perfLevel");
                if(matchesLevel) {
                    if(level == 'All levels') {}
                    else if(level == 'Grand Salam') await page.select("select#perfLevel", "G");
                    else if(level == 'ATP 500') await page.select("select#perfLevel", "A");
                    else {
                        await browser.close();
                        return responseMessage(res, 401, "Invalid level.");
                    }
                }

                let matchesSurfaces = await page.waitForSelector("#perfSurface");
                if(matchesSurfaces) {
                    if(surface == 'All surfaces') {}
                    else if(surface == 'Hard') await page.select("select#perfSurface", "H");
                    else if(surface == 'Clay') await page.select("select#perfSurface", "C");
                    else if(surface == 'Fast') await page.select("select#perfSurface", "HG");
                    else if(surface == 'Medium') {
                        await page.evaluate(() => {
                            document.querySelector('#perfSurface > option:nth-child(9)').selected = true
                        });
                    }
                    
                    else if(surface == 'Slow') await page.select("select#perfSurface", "HC");
                    else {
                        await browser.close();
                        return responseMessage(res, 401, "Invalid surface.");
                    }
                }

                let matchesOpponent = await page.waitForSelector("#perfOpponent");
                if(matchesOpponent) {
                    if(opponent == 'Vs All') {}
                    else if(opponent == 'Top 5') await page.select("select#perfOpponent", "TOP_5");
                    else if(opponent == 'Top 10') await page.select("select#perfOpponent", "TOP_10");
                    else if(opponent == 'Top 50') await page.select("select#perfOpponent", "TOP_50");
                    else if(opponent == 'Top 100') await page.select("select#perfOpponent", "TOP_100");
                    else {
                        await browser.close();
                        return responseMessage(res, 401, "Invalid opponent.");
                    }
                }           

                await page.waitForTimeout(3000)

                // Over and Surface Breakdown
                const overAll = await page.$$eval('#playerPerfSurface tr th', divs => divs.map(th => th.textContent.trim()));
                const surfaceBreakdown = await page.$$eval('#playerPerfSurface tr td', divs => divs.map(th => th.textContent.trim()));
                let overAllArray = [];
                let surfaceBreakdownArray = [];
                for (i=0; i<overAll.length; i++){
                    let a = overAll[i];
                    if(i == 0) overAllArray.push(overAll[i]);

                    if(i == 1) surfaceBreakdownArray.push(a.split('%')[0]);
        
                    if(i >3) surfaceBreakdownArray.push(a.split('%')[0]);
                }

                for (i=0; i<surfaceBreakdown.length; i++){
                    overAllArray.push(surfaceBreakdown[i]);
                }

                // Turnament Level Breakdown
                const perfLevelHeadings = await page.$$eval('#playerPerfLevel tr td', divs => divs.map(th => th.textContent.trim()));
                const perfLevelData = await page.$$eval('#playerPerfLevel tr th', divs => divs.map(th => th.textContent.trim()));
                let perfLevelDataArray = [];
                for (i=0; i<perfLevelData.length; i++){
                    let a = perfLevelData[i];
                    if(i == 0) {}
                    else {
                        perfLevelDataArray.push(a.split('%')[0])
                    }
                }

                 // Pressure Satuations
                 const perfPressureHeadings = await page.$$eval('#playerPerfPressure tr td', divs => divs.map(th => th.textContent.trim()));
                 const perfPressureData = await page.$$eval('#playerPerfPressure tr th', divs => divs.map(th => th.textContent.trim()));
                 let perfPressureDataArray = [];
                 for (i=0; i<perfPressureData.length; i++){
                     let a = perfPressureData[i];
                     if(i == 0) {}
                     else {
                        perfPressureDataArray.push(a.split('%')[0])
                     }
                 }

                 // Outdoor Indoor Breakdown
                 const perfOutdoorIndoorHeadings = await page.$$eval('#playerPerfOutdoorIndoor tr td', divs => divs.map(th => th.textContent.trim()));
                 const perfOutdoorIndoorData = await page.$$eval('#playerPerfOutdoorIndoor tr th', divs => divs.map(th => th.textContent.trim()));
                 let perfOutdoorIndoorDataArray = [];
                 for (i=0; i<perfOutdoorIndoorData.length; i++){
                     let a = perfOutdoorIndoorData[i];
                     if(i == 0) {}
                     else {
                        perfOutdoorIndoorDataArray.push(a.split('%')[0])
                     }
                 }

                 // Best of Breakdown
                 const bestOfBreakdownHeadings = await page.$$eval('#playerPerfBestOf tr td', divs => divs.map(th => th.textContent.trim()));
                 const bestOfBreakdownData = await page.$$eval('#playerPerfBestOf tr th', divs => divs.map(th => th.textContent.trim()));
                 let bestOfBreakdownDataArray = [];
                 for (i=0; i<bestOfBreakdownData.length; i++){
                     let a = bestOfBreakdownData[i];
                     if(i == 0) {}
                     else {
                        bestOfBreakdownDataArray.push(a.split('%')[0])
                     }
                 }

                 // Opponent Rank Breakdown
                 const opponentRankBreakdownHeadings = await page.$$eval('#playerPerfOpponentRank tr td', divs => divs.map(th => th.textContent.trim()));
                 const opponentRankBreakdownData = await page.$$eval('#playerPerfOpponentRank tr th', divs => divs.map(th => th.textContent.trim()));
                 let opponentRankBreakdownDataArray = [];
                 for (i=0; i<opponentRankBreakdownData.length; i++){
                     let a = opponentRankBreakdownData[i];
                     if(i == 0) {}
                     else {
                        opponentRankBreakdownDataArray.push(a.split('%')[0])
                     }
                 }

                 // Round Breakdown
                 const roundBreakdownHeadings = await page.$$eval('#playerPerfRound tr td', divs => divs.map(th => th.textContent.trim()));
                 const roundBreakdownData = await page.$$eval('#playerPerfRound tr th', divs => divs.map(th => th.textContent.trim()));
                 let roundBreakdownDataArray = [];
                 for (i=0; i<roundBreakdownData.length; i++){
                     let a = roundBreakdownData[i];
                     if(i == 0) {}
                     else {
                        roundBreakdownDataArray.push(a.split('%')[0])
                     }
                 }

                 // Court Speed Breakdown
                 const courtSpeedBreakdownHeadings = await page.$$eval('#playerPerfSpeed tr td', divs => divs.map(th => th.textContent.trim()));
                 const courtSpeedBreakdownData = await page.$$eval('#playerPerfSpeed tr th', divs => divs.map(th => th.textContent.trim()));
                 let courtSpeedBreakdownDataArray = [];
                 for (i=0; i<courtSpeedBreakdownData.length; i++){
                     let a = courtSpeedBreakdownData[i];
                     if(i == 0) {}
                     else {
                        courtSpeedBreakdownDataArray.push(a.split('%')[0])
                     }
                 }

                 // Opponent Breakdown
                 const opponentBreakdownHeadings = await page.$$eval('#playerPerfOpponent tr td', divs => divs.map(th => th.textContent.trim()));
                 const opponentBreakdownData = await page.$$eval('#playerPerfOpponent tr th', divs => divs.map(th => th.textContent.trim()));
                 let opponentBreakdownDataArray = [];
                 for (i=0; i<opponentBreakdownData.length; i++){
                     let a = opponentBreakdownData[i];
                     if(i == 0) {}
                     else {
                        opponentBreakdownDataArray.push(a.split('%')[0])
                     }
                 }

                  // Result Breakdown
                  const resultBreakdownHeadings = await page.$$eval('#playerPerfResult tr td', divs => divs.map(th => th.textContent.trim()));
                  const resultBreakdownData = await page.$$eval('#playerPerfResult tr th', divs => divs.map(th => th.textContent.trim()));
                  let resultBreakdownDataArray = [];
                  for (i=0; i<resultBreakdownData.length; i++){
                      let a = resultBreakdownData[i];
                      if(i == 0) {}
                      else {
                         resultBreakdownDataArray.push(a.split('%')[0])
                      }
                  }

                   // Score Breakdown
                   const scoreBreakdownHeadings = await page.$$eval('#playerPerfScore tr td', divs => divs.map(th => th.textContent.trim()));
                   const scoreBreakdownData = await page.$$eval('#playerPerfScore tr th', divs => divs.map(th => th.textContent.trim()));
                   let scoreBreakdownDataArray = [];
                   for (i=0; i<scoreBreakdownData.length; i++){
                       let a = scoreBreakdownData[i];
                       if(i == 0) {}
                       else {
                            scoreBreakdownDataArray.push(a.split('%')[0])
                       }
                   }

                   let array = [
                                    overAllArray, surfaceBreakdownArray, [], 
                                    [perfLevelData[0]],perfLevelHeadings, perfLevelDataArray, [], 
                                    [perfPressureData[0]],perfPressureHeadings, perfPressureDataArray, [],
                                    [perfOutdoorIndoorData[0]],perfOutdoorIndoorHeadings, perfOutdoorIndoorDataArray, [],
                                    [bestOfBreakdownData[0]],bestOfBreakdownHeadings,bestOfBreakdownDataArray, [],
                                    [opponentRankBreakdownData[0]],opponentRankBreakdownHeadings, opponentRankBreakdownDataArray, [],
                                    [roundBreakdownData[0]],roundBreakdownHeadings, roundBreakdownDataArray, [],
                                    [courtSpeedBreakdownData[0]],courtSpeedBreakdownHeadings, courtSpeedBreakdownDataArray, [],
                                    [opponentBreakdownData[0]],opponentBreakdownHeadings, opponentBreakdownDataArray, [], 
                                    [resultBreakdownData[0]],resultBreakdownHeadings, resultBreakdownDataArray, [],
                                    [scoreBreakdownData[0]],scoreBreakdownHeadings, scoreBreakdownDataArray
                                ]
             
                    const data = array.map(d => d.map(e => [e]));
                    const ws = xlsx.utils.aoa_to_sheet(data);
                    xlsx.utils.book_append_sheet(wb, ws, playerName);

                    xlsx.writeFile(wb, `${playerName}-performance.xlsx`);
                    return res.status(200).json({
                                msg : "Success",
                                data : array
                            });

            }

        }
        // If filter type is statistics
        else if(filterType == 'Statistics') {
            let statistics = await page.waitForSelector("#statisticsPill");
            if(statistics){
                await page.waitForTimeout(3000)
                await page.evaluate(() =>{        
                    document.querySelector("#statisticsPill").click();
                });  

                let matchesSeason = await page.waitForSelector("#statsSeason");
                if(matchesSeason) {
                    if(season == 'Career') {}
                    else if(season == 'Last 52 Weeks') await page.select("select#statsSeason", "-1");
                    else if(season == '2022') await page.select("select#statsSeason", "2022");
                    else if(season == '2021') await page.select("select#statsSeason", "2021");
                    else if(season == '2020') await page.select("select#statsSeason", "2020");
                    else {
                        await browser.close();
                        return responseMessage(res, 401, "Invalid season.");
                    }
                }

                let matchesLevel = await page.waitForSelector("#statsLevel");
                if(matchesLevel) {
                    if(level == 'All levels') {}
                    else if(level == 'Grand Salam') await page.select("select#statsLevel", "G");
                    else if(level == 'ATP 500') await page.select("select#statsLevel", "A");
                    else {
                        await browser.close();
                        return responseMessage(res, 401, "Invalid level.");
                    }
                }

                let matchesSurfaces = await page.waitForSelector("#statsSurface");
                if(matchesSurfaces) {
                    if(surface == 'All surfaces') {}
                    else if(surface == 'Hard') await page.select("select#statsSurface", "H");
                    else if(surface == 'Clay') await page.select("select#statsSurface", "C");
                    else if(surface == 'Fast') await page.select("select#statsSurface", "HG");
                    else if(surface == 'Medium') {
                        await page.evaluate(() => {
                            document.querySelector('#statsSurface > option:nth-child(9)').selected = true
                        });
                    }
                    
                    else if(surface == 'Slow') await page.select("select#statsSurface", "HC");
                    else {
                        await browser.close();
                        return responseMessage(res, 401, "Invalid surface.");
                    }
                }

                let matchesOpponent = await page.waitForSelector("#statsOpponent");
                if(matchesOpponent) {
                    if(opponent == 'Vs All') {}
                    else if(opponent == 'Top 5') await page.select("select#statsOpponent", "TOP_5");
                    else if(opponent == 'Top 10') await page.select("select#statsOpponent", "TOP_10");
                    else if(opponent == 'Top 50') await page.select("select#statsOpponent", "TOP_50");
                    else if(opponent == 'Top 100') await page.select("select#statsOpponent", "TOP_100");
                    else {
                        await browser.close();
                        return responseMessage(res, 401, "Invalid opponent.");
                    }
                } 
                
                await page.waitForTimeout(3000)
                
                // Statistics overview data
                // Serve Data
                const serveDataHeadings = await page.$$eval('#statisticsOverview > div > div:nth-child(1) > table tr td', divs => divs.map(th => th.textContent.trim()));
                  const serveData = await page.$$eval('#statisticsOverview > div > div:nth-child(1) > table tr th', divs => divs.map(td => td.textContent.trim()));
                  let serveDataArray = [];
                  for (i=0; i<serveData.length; i++){
                      let a = serveData[i];
                      if(i > 2 && i%2==1) serveDataArray.push(a.split('%')[0])
                  }

                //   Return Data
                  const returnDataHeadings = await page.$$eval('#statisticsOverview > div > div:nth-child(2) > table tr td', divs => divs.map(th => th.textContent.trim()));
                  const returnData = await page.$$eval('#statisticsOverview > div > div:nth-child(2) > table tr th', divs => divs.map(td => td.textContent.trim()));
                  let returnDataArray = [];
                  for (i=0; i<returnData.length; i++){
                      let a = returnData[i];
                      if(i > 2 && i%2==1) returnDataArray.push(a.split('%')[0])
                  }

                 //   Total Data
                 const totalDataHeadings = await page.$$eval('#statisticsOverview > div > div:nth-child(3) > table tr td', divs => divs.map(th => th.textContent.trim()));
                 const totalData = await page.$$eval('#statisticsOverview > div > div:nth-child(3) > table tr th', divs => divs.map(td => td.textContent.trim()));
                 let totalDataArray = [];
                 for (i=0; i<totalData.length; i++){
                     let a = totalData[i];
                     if(i > 2 && i< 7) totalDataArray.push(a.split('%')[0])
                     if(i > 7 && i%2==0) totalDataArray.push(a.split('%')[0])
                 }


                // ++++++++++++++++++ Aces and DFs data ++++++++++++++++
                await page.evaluate(() =>{        
                    document.querySelector("#statisticsTabs > li:nth-child(2) > a").click();
                });

                const aceDataHeadings = await page.$$eval('#statisticsAcesDFs > div > div:nth-child(1) > table tr td', divs => divs.map(th => th.textContent.trim()));
                  const aceData = await page.$$eval('#statisticsAcesDFs > div > div:nth-child(1) > table tr th', divs => divs.map(td => td.textContent.trim()));
                  let aceDataArray = [];
                  for (i=0; i<aceData.length; i++){
                      let a = aceData[i];
                      if(i > 2 && i < 5) aceDataArray.push(a.split('%')[0])
                      if(i > 4 && i%2==0) aceDataArray.push(a.split('%')[0])
                  }

                const aceDoubleFalutDataHeadings = await page.$$eval('#statisticsAcesDFs > div > div:nth-child(2) > table tr td', divs => divs.map(th => th.textContent.trim()));
                  const aceDoubleFalutData = await page.$$eval('#statisticsAcesDFs > div > div:nth-child(2) > table tr th', divs => divs.map(td => td.textContent.trim()));
                  let aceDoubleFalutDataArray = [];
                  for (i=0; i<aceDoubleFalutData.length; i++){
                      let a = aceDoubleFalutData[i];
                      if(i > 2 && i < 5) aceDoubleFalutDataArray.push(a.split('%')[0])
                      if(i > 4 && i%2==0) aceDoubleFalutDataArray.push(a.split('%')[0])
                  }

                  const aceOtherDataHeadings = await page.$$eval('#statisticsAcesDFs > div > div:nth-child(3) > table tr td', divs => divs.map(th => th.textContent.trim()));
                  const aceOtherData = await page.$$eval('#statisticsAcesDFs > div > div:nth-child(3) > table tr th', divs => divs.map(td => td.textContent.trim()));
                  let aceOtherDataArray = [];
                  for (i=0; i<aceOtherData.length; i++){
                      let a = aceOtherData[i];
                      if(i > 2) {
                        if(a.includes('/')) {}
                        else aceOtherDataArray.push(a.split('%')[0])
                      }
                  }


                   // ++++++++++++++++++ Serve data ++++++++++++++++
                await page.evaluate(() =>{        
                    document.querySelector("#statisticsTabs > li:nth-child(3) > a").click();
                });

                const serve2DataHeadings = await page.$$eval('#statisticsServe > div > div:nth-child(1) > table tr td', divs => divs.map(th => th.textContent.trim()));
                  const serve2Data = await page.$$eval('#statisticsServe > div > div:nth-child(1) > table tr th', divs => divs.map(td => td.textContent.trim()));
                  let serve2DataArray = [];
                  for (i=0; i<serve2Data.length; i++){
                      let a = serve2Data[i];
                      if(i > 2) {
                        if(a.includes('/')) {}
                        else serve2DataArray.push(a.split('%')[0])
                      }
                      
                  }      
                  
                  const servePointsDataHeadings = await page.$$eval('#statisticsServe > div > div:nth-child(2) > table tr td', divs => divs.map(th => th.textContent.trim()));
                  const servePointsData = await page.$$eval('#statisticsServe > div > div:nth-child(2) > table tr th', divs => divs.map(td => td.textContent.trim()));
                  let servePointsDataArray = [];
                  for (i=0; i<servePointsData.length; i++){
                      let a = servePointsData[i];
                      if(i > 2) {
                        if(a.includes('/')) {}
                        else servePointsDataArray.push(a.split('%')[0])
                      }
                      
                  } 

                  const serveGameDataHeadings = await page.$$eval('#statisticsServe > div > div:nth-child(3) > table tr td', divs => divs.map(th => th.textContent.trim()));
                  const serveGameData = await page.$$eval('#statisticsServe > div > div:nth-child(3) > table tr th', divs => divs.map(td => td.textContent.trim()));
                  let serveGameDataArray = [];
                  for (i=0; i<serveGameData.length; i++){
                      let a = serveGameData[i];
                      if(i > 2) {
                        if(a.includes('/')) {}
                        else serveGameDataArray.push(a.split('%')[0])
                      }
                      
                  }   
                  
                  // ++++++++++++++++++ Serve Speed data ++++++++++++++++
                await page.evaluate(() =>{        
                    document.querySelector("#statisticsTabs > li:nth-child(4) > a").click();
                });

                const serveSpeedDataHeadings = await page.$$eval('#statisticsServeSpeed > div > div:nth-child(1) > table tr td', divs => divs.map(th => th.textContent.trim()));
                  const serveSpeedData = await page.$$eval('#statisticsServeSpeed > div > div:nth-child(1) > table tr th', divs => divs.map(td => td.textContent.trim()));
                  let serveSpeedDataArray = [];
                  for (i=0; i<serveSpeedData.length; i++){
                      let a = serveSpeedData[i];
                      if(i > 2) {
                        serveSpeedDataArray.push(a)
                      }
                      
                  }   
                  
                  const serveSpeedRatioDataHeadings = await page.$$eval('#statisticsServeSpeed > div > div:nth-child(2) > table tr td', divs => divs.map(th => th.textContent.trim()));
                  const serveSpeedRatioData = await page.$$eval('#statisticsServeSpeed > div > div:nth-child(2) > table tr th', divs => divs.map(td => td.textContent.trim()));
                  let serveSpeedRatioDataArray = [];
                  for (i=0; i<serveSpeedRatioData.length; i++){
                      let a = serveSpeedRatioData[i];
                      if(i > 2) {
                        if(a.includes('/')) {}
                        else serveSpeedRatioDataArray.push(a.split('%')[0])
                      }
                      
                  }    

                // ++++++++++++++++++ Return data ++++++++++++++++
                await page.evaluate(() =>{        
                    document.querySelector("#statisticsTabs > li:nth-child(5) > a").click();
                });

                const return2DataHeadings = await page.$$eval('#statisticsReturn > div > div:nth-child(1) > table tr td', divs => divs.map(th => th.textContent.trim()));
                  const return2Data = await page.$$eval('#statisticsReturn > div > div:nth-child(1) > table tr th', divs => divs.map(td => td.textContent.trim()));
                  let return2DataArray = [];
                  for (i=0; i<return2Data.length; i++){
                      let a = return2Data[i];
                      if(i > 2) {
                        if(a.includes('/')) {}
                        else return2DataArray.push(a.split('%')[0])
                      }
                      
                  }   
                
                  const returnPointsDataHeadings = await page.$$eval('#statisticsReturn > div > div:nth-child(2) > table tr td', divs => divs.map(th => th.textContent.trim()));
                  const returnPointsData = await page.$$eval('#statisticsReturn > div > div:nth-child(2) > table tr th', divs => divs.map(td => td.textContent.trim()));
                  let returnPointsDataArray = [];
                  for (i=0; i<returnPointsData.length; i++){
                      let a = returnPointsData[i];
                      if(i > 2) {
                        if(a.includes('/')) {}
                        else returnPointsDataArray.push(a.split('%')[0])
                      }
                      
                  }   

                  const returnGamesDataHeadings = await page.$$eval('#statisticsReturn > div > div:nth-child(3) > table tr td', divs => divs.map(th => th.textContent.trim()));
                  const returnGamesData = await page.$$eval('#statisticsReturn > div > div:nth-child(3) > table tr th', divs => divs.map(td => td.textContent.trim()));
                  let returnGamesDataArray = [];
                  for (i=0; i<returnGamesData.length; i++){
                      let a = returnGamesData[i];
                      if(i > 2) {
                        if(a.includes('/')) {}
                        else returnGamesDataArray.push(a.split('%')[0])
                      }
                      
                  }   
                  
                 // ++++++++++++++++++ Points data ++++++++++++++++
                 await page.evaluate(() =>{        
                    document.querySelector("#statisticsTabs > li:nth-child(6) > a").click();
                });

                const pointsDataHeadings = await page.$$eval('#statisticsPoints > div > div:nth-child(1) > table tr td', divs => divs.map(th => th.textContent.trim()));
                  const pointsData = await page.$$eval('#statisticsPoints > div > div:nth-child(1) > table tr th', divs => divs.map(td => td.textContent.trim()));
                  let pointsDataArray = [];
                  for (i=0; i<pointsData.length; i++){
                      let a = pointsData[i];
                      if(i > 2) {
                        if(a.includes('/')) {}
                        else pointsDataArray.push(a.split('%')[0])
                      }
                      
                  }   


                const winnersDataHeadings = await page.$$eval('#statisticsPoints > div > div:nth-child(2) > table tr td', divs => divs.map(th => th.textContent.trim()));
                const winnersData = await page.$$eval('#statisticsPoints > div > div:nth-child(2) > table tr th', divs => divs.map(td => td.textContent.trim()));
                let winnersDataArray = [];
                for (i=0; i<winnersData.length; i++){
                    let a = winnersData[i];
                    if(i > 2) {
                      if(a.includes('/')) {}
                      else winnersDataArray.push(a.split('%')[0])
                    }
                    
                }   
            
                const netPointsDataHeadings = await page.$$eval('#statisticsPoints > div > div:nth-child(3) > table tr td', divs => divs.map(th => th.textContent.trim()));
                const netPointsData = await page.$$eval('#statisticsPoints > div > div:nth-child(3) > table tr th', divs => divs.map(td => td.textContent.trim()));
                let netPointsDataArray = [];
                for (i=0; i<netPointsData.length; i++){
                    let a = netPointsData[i];
                    if(i > 2) {
                      if(a.includes('/')) {}
                      else netPointsDataArray.push(a.split('%')[0])
                    }
                    
                }   

                // ++++++++++++++++++ Games data ++++++++++++++++
                await page.evaluate(() =>{        
                    document.querySelector("#statisticsTabs > li:nth-child(7) > a").click();
                });

                const gamesDataHeadings = await page.$$eval('#statisticsGames > div > div:nth-child(1) > table tr td', divs => divs.map(th => th.textContent.trim()));
                  const gamesData = await page.$$eval('#statisticsGames > div > div:nth-child(1) > table tr th', divs => divs.map(td => td.textContent.trim()));
                  let gamesDataArray = [];
                  for (i=0; i<gamesData.length; i++){
                      let a = gamesData[i];
                      if(i > 2) {
                        if(a.includes('/')) {}
                        else gamesDataArray.push(a.split('%')[0])
                      }
                      
                  }  

                  const tieBreaksDataHeadings = await page.$$eval('#statisticsGames > div > div:nth-child(2) > table tr td', divs => divs.map(th => th.textContent.trim()));
                  const tieBreaksData = await page.$$eval('#statisticsGames > div > div:nth-child(2) > table tr th', divs => divs.map(td => td.textContent.trim()));
                  let tieBreaksDataArray = [];
                  for (i=0; i<tieBreaksData.length; i++){
                      let a = tieBreaksData[i];
                      if(i > 2) {
                        if(a.includes('/')) {}
                        else tieBreaksDataArray.push(a.split('%')[0])
                      }
                      
                  }  

                  // ++++++++++++++++++ Sets and Matches Data ++++++++++++++++
                await page.evaluate(() =>{        
                    document.querySelector("#statisticsTabs > li:nth-child(8) > a").click();
                });

                const setsDataHeadings = await page.$$eval('#statisticsSetsMatches > div > div:nth-child(1) > table tr td', divs => divs.map(th => th.textContent.trim()));
                  const setsData = await page.$$eval('#statisticsSetsMatches > div > div:nth-child(1) > table tr th', divs => divs.map(td => td.textContent.trim()));
                  let setsDataArray = [];
                  for (i=0; i<setsData.length; i++){
                      let a = setsData[i];
                      if(i > 2) {
                        if(a.includes('/')) {}
                        else setsDataArray.push(a.split('%')[0])
                      }
                      
                  }  

                const setsMatchesDataHeadings = await page.$$eval('#statisticsSetsMatches > div > div:nth-child(2) > table tr td', divs => divs.map(th => th.textContent.trim()));
                const setsMatchesData = await page.$$eval('#statisticsSetsMatches > div > div:nth-child(2) > table tr th', divs => divs.map(td => td.textContent.trim()));
                let setsMatchesDataArray = [];
                for (i=0; i<setsMatchesData.length; i++){
                    let a = setsMatchesData[i];
                    if(i > 2) {
                      if(a.includes('/')) {}
                      else setsMatchesDataArray.push(a.split('%')[0])
                    }
                    
                }  

                 // ++++++++++++++++++ Performance Data ++++++++++++++++
                 await page.evaluate(() =>{        
                    document.querySelector("#statisticsTabs > li:nth-child(9) > a").click();
                });

                const performanceDominaceDataHeadings = await page.$$eval('#statisticsPerformance > div > div:nth-child(1) > table tr td', divs => divs.map(th => th.textContent.trim()));
                  const performanceDominaceData = await page.$$eval('#statisticsPerformance > div > div:nth-child(1) > table tr th', divs => divs.map(td => td.textContent.trim()));
                  let performanceDominaceDataArray = [];
                  for (i=0; i<performanceDominaceData.length; i++){
                      let a = performanceDominaceData[i];
                      if(i > 2) {
                        if(a.includes('/')) {}
                        else performanceDominaceDataArray.push(a.split('%')[0])
                      }
                      
                  }  
                
                  const overPerformanceDominaceDataHeadings = await page.$$eval('#statisticsPerformance > div > div:nth-child(2) > table tr td', divs => divs.map(th => th.textContent.trim()));
                  const overPerformanceDominaceData = await page.$$eval('#statisticsPerformance > div > div:nth-child(2) > table tr th', divs => divs.map(td => td.textContent.trim()));
                  let overPerformanceDominaceDataArray = [];
                  for (i=0; i<overPerformanceDominaceData.length; i++){
                      let a = overPerformanceDominaceData[i];
                      if(i > 2) {
                        if(a.includes('/')) {}
                        else overPerformanceDominaceDataArray.push(a.split('%')[0])
                      }
                      
                  }  

                  const overPerformanceExDominaceDataHeadings = await page.$$eval('#statisticsPerformance > div > div:nth-child(3) > table tr td', divs => divs.map(th => th.textContent.trim()));
                  const overPerformanceExDominaceData = await page.$$eval('#statisticsPerformance > div > div:nth-child(3) > table tr th', divs => divs.map(td => td.textContent.trim()));
                  let overPerformanceExDominaceDataArray = [];
                  for (i=0; i<overPerformanceExDominaceData.length; i++){
                      let a = overPerformanceExDominaceData[i];
                      if(i > 2) {
                        if(a.includes('/')) {}
                        else overPerformanceExDominaceDataArray.push(a.split('%')[0])
                      }
                      
                  }  


                   // ++++++++++++++++++ Opponent and Time Data ++++++++++++++++
                 await page.evaluate(() =>{        
                    document.querySelector("#statisticsTabs > li:nth-child(10) > a").click();
                });

                const timeOpponentDataHeadings = await page.$$eval('#statisticsOpponentTime > div > div:nth-child(1) > table tr td', divs => divs.map(th => th.textContent.trim()));
                  const timeOpponentData = await page.$$eval('#statisticsOpponentTime > div > div:nth-child(1) > table tr th', divs => divs.map(td => td.textContent.trim()));
                  let timeOpponentDataArray = [];
                  for (i=0; i<timeOpponentData.length; i++){
                      let a = timeOpponentData[i];
                      if(i > 2) {
                        if(a.includes('/')) {}
                        else timeOpponentDataArray.push(a.split('%')[0])
                      }
                      
                  }  
                  
                  const timeUpsetsDataHeadings = await page.$$eval('#statisticsOpponentTime > div > div:nth-child(2) > table tr td', divs => divs.map(th => th.textContent.trim()));
                  const timeUpsetsData = await page.$$eval('#statisticsOpponentTime > div > div:nth-child(2) > table tr th', divs => divs.map(td => td.textContent.trim()));
                  let timeUpsetsDataArray = [];
                  for (i=0; i<timeUpsetsData.length; i++){
                      let a = timeUpsetsData[i];
                      if(i > 2) {
                        if(a.includes('/')) {}
                        else timeUpsetsDataArray.push(a.split('%')[0])
                      }
                      
                  } 
                  
                  const timeDataHeadings = await page.$$eval('#statisticsOpponentTime > div > div:nth-child(3) > table tr td', divs => divs.map(th => th.textContent.trim()));
                  const timeData = await page.$$eval('#statisticsOpponentTime > div > div:nth-child(3) > table tr th', divs => divs.map(td => td.textContent.trim()));
                  let timeDataArray = [];
                  for (i=0; i<timeData.length; i++){
                      let a = timeData[i];
                      if(i > 2) {
                        if(a.includes('/')) {}
                        else timeDataArray.push(a.split('%')[0])
                      }
                      
                  }  



                 let array = [
                    ['Overview Data'],
                    [serveData[0]],serveDataHeadings, serveDataArray, [], 
                    [returnData[0]],returnDataHeadings, returnDataArray, [],
                    [totalData[0]],totalDataHeadings, totalDataArray, [],

                    ['Ace and DFs data'],
                    aceDataHeadings, aceDataArray, [],
                    [aceDoubleFalutData[0]], aceDoubleFalutDataHeadings, aceDoubleFalutDataArray, [],
                    [aceOtherData[0]], aceOtherDataHeadings, aceOtherDataArray, [],

                    ['Serve Data'],
                    serve2DataHeadings, serve2DataArray, [],
                    [servePointsData[0]], servePointsDataHeadings, servePointsDataArray, [],
                    [serveGameData[0]], serveGameDataHeadings, serveGameDataArray, [],

                    ['Serve Speed Data'],
                    serveSpeedDataHeadings, serveSpeedDataArray, [],
                    [serveSpeedRatioData[0]], serveSpeedRatioDataHeadings, serveSpeedRatioDataArray, [],

                    ['Return Data'],
                    return2DataHeadings, return2DataArray, [],
                    [returnPointsData[0]], returnPointsDataHeadings, returnPointsDataArray, [],
                    [returnGamesData[0]], returnGamesDataHeadings, returnGamesDataArray, [],

                    ['points Data'],
                    pointsDataHeadings, pointsDataArray, [],
                    [winnersData[0]], winnersDataHeadings, winnersDataArray, [],
                    [netPointsData[0]], netPointsDataHeadings, netPointsDataArray, [],

                    ['Games Data'],
                    gamesDataHeadings, gamesDataArray, [],
                    [tieBreaksData[0]], tieBreaksDataHeadings, tieBreaksDataArray, [],

                    ['Sets and Matches Data'],
                    [setsData[0]],setsDataHeadings, setsDataArray, [], 
                    [setsMatchesData[0]],setsMatchesDataHeadings, setsMatchesDataArray, [],

                    ['Performance Data'],
                    [performanceDominaceData[0]],performanceDominaceDataHeadings, performanceDominaceDataArray, [], 
                    [overPerformanceDominaceData[0]],overPerformanceDominaceDataHeadings, overPerformanceDominaceDataArray, [],
                    [overPerformanceExDominaceData[0]],overPerformanceExDominaceDataHeadings, overPerformanceExDominaceDataArray, [],

                    ['Opponent and Time Data'],
                    [timeOpponentData[0]],timeOpponentDataHeadings, timeOpponentDataArray, [], 
                    [timeUpsetsData[0]],timeUpsetsDataHeadings, timeUpsetsDataArray, [],
                    [timeData[0]],timeDataHeadings, timeDataArray, [],
                ]

                const data = array.map(d => d.map(e => [e]));
                const ws = xlsx.utils.aoa_to_sheet(data);
                xlsx.utils.book_append_sheet(wb, ws, playerName);

                xlsx.writeFile(wb, `${playerName}-statistics.xlsx`);
                return res.status(200).json({
                            msg : "Success",
                            data : array
                        });

            }
    
        } else if(filterType == 'Matches') {
            // if filter type is matches
            let matches = await page.waitForSelector("#matchesPill");
            if(matches){
                await page.waitForTimeout(3000)
                await page.evaluate(() =>{        
                    document.querySelector("#matchesPill").click();
                });    
                
                let matchesSeason = await page.waitForSelector("#matchesSeason");
                if(matchesSeason) {
                    if(season == 'Career') {}
                    else if(season == 'Last 52 Weeks') await page.select("select#matchesSeason", "-1");
                    else if(season == '2022') await page.select("select#matchesSeason", "2022");
                    else if(season == '2021') await page.select("select#matchesSeason", "2021");
                    else if(season == '2020') await page.select("select#matchesSeason", "2020");
                    else {
                        await browser.close();
                        return responseMessage(res, 401, "Invalid match season.");
                    }
                }

                let matchesLevel = await page.waitForSelector("#matchesLevel");
                if(matchesLevel) {
                    if(level == 'All levels') {}
                    else if(level == 'Grand Salam') await page.select("select#matchesLevel", "G");
                    else if(level == 'ATP 500') await page.select("select#matchesLevel", "A");
                    else {
                        await browser.close();
                        return responseMessage(res, 401, "Invalid match level.");
                    }
                }

                let matchesSurfaces = await page.waitForSelector("#matchesSurface");
                if(matchesSurfaces) {
                    if(surface == 'All surfaces') {}
                    else if(surface == 'Hard') await page.select("select#matchesSurface", "H");
                    else if(surface == 'Clay') await page.select("select#matchesSurface", "C");
                    else if(surface == 'Fast') await page.select("select#matchesSurface", "HG");
                    else if(surface == 'Medium') {
                        await page.evaluate(() => {
                            document.querySelector('#matchesSurface > option:nth-child(9)').selected = true
                        });
                    }
                    
                    else if(surface == 'Slow') await page.select("select#matchesSurface", "HC");
                    else {
                        await browser.close();
                        return responseMessage(res, 401, "Invalid match surface.");
                    }
                }

                let matchesOpponent = await page.waitForSelector("#matchesOpponent");
                if(matchesOpponent) {
                    if(opponent == 'Vs All') {}
                    else if(opponent == 'Top 5') await page.select("select#matchesOpponent", "TOP_5");
                    else if(opponent == 'Top 10') await page.select("select#matchesOpponent", "TOP_10");
                    else if(opponent == 'Top 50') await page.select("select#matchesOpponent", "TOP_50");
                    else if(opponent == 'Top 100') await page.select("select#matchesOpponent", "TOP_100");
                    else {
                        await browser.close();
                        return responseMessage(res, 401, "Invalid match opponent.");
                    }
                }

                await page.waitForTimeout(5000)

                const table = await page.waitForSelector('#matchesTable');
                if(table){

                    await page.evaluate(() =>{        
                        document.querySelector('#matchesTable-header > div > div > div.actions.btn-group > div:nth-child(2) > ul > li:nth-child(4) > a').click();
                    });    

                    await page.waitForTimeout(5000);

                    let arr = [];

                    const headings = await page.$$eval('#matchesTable tr th', divs => divs.map(th => th.textContent.trim()));
                    arr.push(headings);
                    const playersData = await page.$$eval('#matchesTable tr td', divs => divs.map(td => td.textContent.trim()));
                    console.log(playersData.length)

                    let start = 0, end = 6;
                    for (i=0; i<(playersData.length/6); i++){
                        arr.push(playersData.slice(start, end));
                        start += 6;
                        end +=6;
                    }

                    const data = arr.map(d => d.map(e => [e]));
                    const ws = xlsx.utils.aoa_to_sheet(data);
                    xlsx.utils.book_append_sheet(wb, ws, playerName);

                    xlsx.writeFile(wb, `${playerName}.matches.xlsx`);
                    return res.status(200).json({
                                msg : "Success",
                                data : arr
                            });
        
                }
            }

        } else {
            return res.status(400).json({
                msg : "Filter type not matched",
                no_of_records : 0,
                data : []
            });
        }

    }  
   
    await browser.close();

})

app.listen(PORT, () => {
    console.log(`App is running on http://localhost:${PORT}`);
})