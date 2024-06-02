

const puppeteer = require('puppeteer');
const moment = require('moment')
const ReadableStream = require("web-streams-polyfill/polyfill");
const History = require("../models/entity/History");
const Robot = require("../models/entity/Robot");
const User = require("../models/entity/User");
const { clientService } = require("../services/client.service");
const { historyService } = require("../services/history.service");
const { sleep, getPieChart, getColumnChart, getAreaChart, getDailyStats, getWeeklyStats } = require('../helpers/utils');

moment.locale('fr');

exports.getAllLengthCollections = async (req, res) => {
  try {
    const histories = await historyService.selectAll();
    const robots = await Robot.find();

    let totalPieces = 0;
    robots.forEach((robot) => {
      totalPieces += robot.totalPieces;
    }); //kol robot tzidou fel ajout t3tih nombres de pieces y3ml somme = piece prise

    let piecesPalatizes = 0;
    histories.forEach((hitory) => {
      piecesPalatizes += parseFloat(hitory.palatizedPieces);
    });  //kol piéce palatize ya5dhha men history tetzad fel pieces palatizé
    //==> odkhol lel modele tw tefhm
    return res.json({
      countRobots: clientService.selectAllRobots().length,
      robotsReference:
        clientService.selectAllRobots()?.map((robot) => robot.username) || [],
      robotInfo: robots || [],
      countUsers: clientService.selectAllUsers().length,
      totalNombrePieces: totalPieces,
      totalNombrePiecesPalatizes: piecesPalatizes
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getrobotStats = async (req, res) => {
  try {
    const { userId, reference, startDate, endDate } = req.query || {};

    if (!reference && !userId) {
      return res
        .status(400)
        .json({ message: "you need to specify a reference or a userId" });
    }

    const filter = reference ? { reference } : { userId };

    const robot = await Robot.findOne(filter);

    if (!robot) {
      return res.status(404).json({ message: "robot not found" });
    }

    const historyFilter = {
      robotId: robot._id,
    };

    if (startDate && endDate) {
      historyFilter.$and = [
        { startExecutionAt: { 
          $gte: moment(startDate).format('YYYY-MM-DD'),
          $lte: moment(endDate).format('YYYY-MM-DD')
        } }
      ];
    }

    const [user, histories, dailyStats, weeklyStats] = await Promise.all([
      User.findById(robot.userId),
      History.find(), // historyFilter
      getDailyStats(robot),
      getWeeklyStats(robot)
    ])

console.log('histories', histories);
    if (!histories || !histories.length) {
      return res.status(200).json({
        history: {
          pieces: 0,
          pallets: 0,
          cobotOperatingTime: 0,
          palletizationTime: 0,
          timeToPickup: 7,
          timeToReturn: 0,
          productionOrder: ""
        },
        user: {},
        chartStats: {
          totalPieces: 0,
          palatizedPieces: 0,
          previousMonth: [0, 0, 0, 0, 0, 0],
          currentMonth: [0, 0, 0, 0, 0, 0],
          weeklyPreviousMonth: [0, 0, 0, 0],
          weeklyCurrentMonth: [0, 0, 0, 0]
        }
      });
    }

    const palatizedPieces = histories.reduce((accumulator, history) => {
      return accumulator + history.palatizedPieces;
    }, 0)

    const [history] = histories

    history.palatizedPieces = palatizedPieces

    return res.status(200).json({
      history,
      user,
      chartStats: {
        ...dailyStats,
        ...weeklyStats,
        totalPieces: history.totalPieces,
        palatizedPieces: history.palatizedPieces,
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createStatsPdf = async (req, res) => {
  const { totalPieces, palatizedPieces, previousMonth, currentMonth, weeklyPreviousMonth, weeklyCurrentMonth } = req.body;

  if (typeof globalThis.ReadableStream === "undefined") {
    globalThis.ReadableStream = ReadableStream;
  }

  const htmlContent = `
      <html>
        <head>
          <script src="https://code.highcharts.com/highcharts.js"></script>
        </head>
        <body>
          <div id="container1" style="width: 100%; height: 400px;"></div>
          <div id="container2" style="width: 100%; height: 400px;"></div>
          <div id="container3" style="width: 100%; height: 400px;"></div>
          <script>
            ${getPieChart({ totalPieces, palatizedPieces })}
            ${getColumnChart({ currentMonth, previousMonth })}
            ${getAreaChart({ weeklyCurrentMonth, weeklyPreviousMonth })}         
          </script>
        </body>
      </html>
    `;

  try {
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setContent(htmlContent);

    await sleep(2000)

    const pdfBuffer = await page.pdf({ format: 'A4' });
    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=charts.pdf');
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).send('Error generating PDF');
  }
};

