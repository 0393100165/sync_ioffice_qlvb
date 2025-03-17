const cron = require('node-cron');
const axios = require('axios');
const { poolPromise } = require('../db'); // Assuming db.js exports poolPromise

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
        'X-Authentication-Token': '90cb2358db4cf2df42c771507edc9000'
      }
    });

    let data = response.data.data;

    if (typeof data === 'string') {
      data = parseDataString(data);
    } else {
      console.error('Error: data is not a string.');
      return;
    }
    console.log(data);
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
  cron.schedule('*/5 * * * *', () => {
    console.log('UnitJob running every 5 minutes');
    getAllUnitJob();
  });
};

module.exports = UnitJob;