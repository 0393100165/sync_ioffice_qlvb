const cron = require('node-cron');
const axios = require('axios');
const { insertUnitLienThong } = require('../implements/UnitImpl');
const { getAuthToken } = require('../authToken'); // Import getAuthToken

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
  const authToken = getAuthToken(); // Get authToken
  if (!authToken) {
    console.error('authToken is null or undefined');
    return;
  }
  try {
    const response = await axios.get('http://localhost:8080/qlvb/api/shared/unit/get_all/', {
      headers: {
        'X-Authentication-Token': authToken
      }
    });

    let data = response.data.data;
    data = parseDataString(data);
    // console.log(data);
    await insertUnitLienThong(data);
    console.log('-----Data DonViLienThong inserted successfully!-----');
  } catch (error) {
    console.error('Error fetching or inserting data:', error);
  }
};

const UnitJob = () => {
  cron.schedule('*/1 * * * *', () => {
    console.log('-----UnitJob running every 5 minutes-----');
    getAllUnitJob();
  });
};

module.exports = UnitJob;