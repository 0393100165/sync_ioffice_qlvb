const express = require('express');
const cron = require('node-cron');
const db = require('./db'); // Import the database connection
const { getCongVanDi, updateListCongVanDi } = require('./services/CongVanDi_ChoKyService');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json()); // Middleware to parse JSON bodies

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
    const dataList = req.body;
    await updateListCongVanDi(dataList);
    res.status(200).send('Update successfully');
  } catch (err) {
    console.error('Error updating CongVanDi', err);
    res.status(500).send('Internal Server Error');
  }
});

cron.schedule('* * * * *', () => {
    console.log('Cron job running every minute');
    checkDbConnection();
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
