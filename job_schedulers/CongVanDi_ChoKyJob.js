const cron = require('node-cron');
const axios = require('axios');
const { poolPromise } = require('../db'); // Assuming db.js exports poolPromise
const { getCongVanDi, updateTrangThaiDaChuyen, updateListCongVanDi } = require('../implements/CongVanDi_ChoKyImpl'); // Import getCongVanDi

let authToken = '';

async function updateAuthToken() {
    try {
        const response = await axios.post('http://localhost:8080/qlvb/api/login/v3/', {
            device: "\"Google Android SDK built for x86\"",
            language: "VI",
            password: "ToPhanMemGP2@2025",
            tokenFireBase: "cmB_ptRjFCc:APA91bG0XFcR3wcif27eZLunMaK3-yzoXIds3xCe0G9LFg3741sWT4UBTKbezqYC56peH4QNP1kv3KzZ10T9mEh0VvC4Pi1rSYfEK7WtG4qL5RKOIFhxPtmg1qme1ArqhSH5LCDNjkpg",
            type: "ANDROID",
            username: "admin.tpmgp2"
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.data && response.data.data && response.data.data.token) {
            authToken = response.data.data.token;
            console.log('Updated auth token:', authToken);
        } else {
            console.error('Failed to update auth token: Invalid response data');
        }
    } catch (error) {
        console.error('Failed to update auth token:', error);
    }
}

setInterval(updateAuthToken, 30 * 60 * 1000); // Update every 30 minutes

// Initial token update
updateAuthToken();

const createIntegrationCongVan = async () => {
  try {
    const data = await getCongVanDi();

    const customData = data.map(item => ({
      dossierId: item.MaCongVan,
      summary: item.NoiDung,
      documentType: item.MaLoaiHinhCongVan,
      loaiVBId: item.MaLoaiHinhCongVan,
      files: [{
        fileId: item.MaCongVan,
        fileName: item.TenFile,
        fileType: 'application/pdf', // Assuming the file type is PDF
        fileSize: item.SoTrang, // Assuming file size is the number of pages
        fileData: item.DataFile
      }]
    }));
    
    const response = await axios.post('http://localhost:8080/qlvb/api/shared/integration/doc/create/', customData, {
      headers: {
        'X-Authentication-Token': authToken,
        'Content-Type': 'application/json'
      }
    });
    if (response.data.status.code === '0' && response.data.data === 'TRUE') {
        updateTrangThaiDaChuyen(data);
    }
    console.log('Data posted successfully:', response.data);
  } catch (error) {
    console.error('Error fetching or posting data:', error);
  }
};

const getResultCongVanDi = async () => {
  try {
    const response = await axios.get('http://localhost:8080/qlvb/api/shared/congvan_stc/get_result/', {
      headers: {
        'X-Authentication-Token': authToken
      }
    });
    const dataList = response.data.data;
    // Process dataList as needed
    updateListCongVanDi(dataList);
  } catch (error) {
    console.error('Error fetching dataList:', error);
  }
};

const CongVanDi_ChoKyJob = () => {
  cron.schedule('*/5 * * * *', () => {
    console.log('CongVanDi_ChoKyJob running every 5 minutes');
    createIntegrationCongVan();
  });
};

const getResultCongVanDiJob = () => {
  cron.schedule('*/5 * * * *', () => {
    console.log('CongVanDi_ChoKyJob running every 5 minutes');
    getResultCongVanDi();
  });
};

module.exports = {
  CongVanDi_ChoKyJob,
  getResultCongVanDiJob
};
