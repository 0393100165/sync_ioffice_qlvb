const express = require('express');
const cron = require('node-cron');
const db = require('./db'); // Import the database connection
const { getCongVanDi, updateListCongVanDi } = require('./services/CongVanDi_ChoKyService');
const bodyParser = require('body-parser'); // Import body-parser
const UnitJob = require('./job_schedulers/UnitJob'); // Import UnitJob
const {CongVanDi_ChoKyJob, getResultCongVanDiJob} = require('./job_schedulers/CongVanDi_ChoKyJob'); // Import CongVanDi_ChoKyJob

const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON bodies and handle large payloads
app.use(bodyParser.json({ limit: '100mb' }));
app.use(bodyParser.urlencoded({ limit: '100mb', extended: true }));

app.get('/', (req, res) => {
  res.send('Server is running');
});

app.get('/api/congvan_di/get', async (req, res) => {
  try {
    const data = await getCongVanDi();
    res.json(data);
  } catch (err) {
    res.status(500).send('Error retrieving data');
  }
});

app.post('/api/congvan_di/update', async (req, res) => {
  try {
    const dataList = req.body.data;
    await updateListCongVanDi(dataList);
    res.status(200).send('Update successfully');
  } catch (err) {
    console.error('Error updating CongVanDi', err);
    res.status(500).send('Internal Server Error');
  }
});

// cron.schedule('* * * * *', () => {
//     console.log('Cron job running every minute');
//     checkDbConnection();
// });

app.listen(port, () => {
  console.log(`-----Server is listening on port: ${port}`);
  UnitJob(); // Run UnitJob when the server starts
  CongVanDi_ChoKyJob();
  getResultCongVanDiJob();
});
