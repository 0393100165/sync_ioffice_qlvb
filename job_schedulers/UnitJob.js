const cron = require('node-cron');
const axios = require('axios');
const { poolPromise } = require('../db'); // Assuming db.js exports poolPromise
const fs = require('fs');
const path = require('path');

const parseDataString = (dataString) => {
  const records = dataString.trim().split('\n\n');
  return records.map(record => {
    const fields = record.split('\n');
    const unit = {};
    fields.forEach(field => {
      const [key, value] = field.split(': ');
      unit[key] = value;
    });
    return unit;
  });
};

const getAllUnitJob = async () => {
  try {
    const response = await axios.get('http://localhost:8080/qlvb/api/shared/unit/get_all/', {
      headers: {
        'X-Authentication-Token': '7303187c978dcece11b27dcec839d2f2'
      }
    });

    let data = response.data.data;

    if (typeof data === 'string') {
      data = parseDataString(data);
    } else {
      console.error('Error: data is not a string.');
      return;
    }
    // console.log(data);

    // Save data to a JSON file
    // const filePath = path.join(__dirname, 'unitJobData.json');
    // fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');

    // const pool = await poolPromise;
    // for (const unit of data) {
    //   await pool.request()
    //     .input('MaCoQuan', unit.ID)
    //     .input('TenCoQuan', unit.NAME)
    //     .query('INSERT INTO CongVan_2025.dbo.CoQuanPhatHanh_Ioffice (MaCoQuan, TenCoQuan) VALUES (@MaCoQuan, N\'\' + @TenCoQuan + \'\')'); // Correct usage of N prefix
    // }
  } catch (error) {
    console.error('Error fetching or inserting data:', error);
  }
};

const UnitJob = () => {
  cron.schedule('*/1 * * * *', () => {
    console.log('UnitJob running every 5 minutes');
    getAllUnitJob();
  });
};

module.exports = UnitJob;