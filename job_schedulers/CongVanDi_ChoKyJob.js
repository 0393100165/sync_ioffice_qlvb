const cron = require('node-cron');
const axios = require('axios');
const { getCongVanDi, updateTrangThaiDaChuyen, updateListCongVanDi } = require('../implements/CongVanDi_ChoKyImpl'); // Import getCongVanDi
const { getAuthToken } = require('../authToken'); // Import getAuthToken


const createIntegrationCongVan = async () => {
  let authToken = getAuthToken();
  try {
    const data = await getCongVanDi();
    const customData = data.map(item => ({
      dossierId: item.MaCongVan,
      summary: item.NoiDung,
      documentType: item.MaLoaiHinhCongVan,
      loaiVBId: item.MaHinhThuc,
      maNguoiKy: item.MaNguoiKy,
      maNguoiTao: item.MaNguoiSoan,
      noiNhan: item.MaCoQuan,
      noiNhanNgoai: item.DonViNgoai,
      maCongVanSo: item.MaCongVanSo,
      files: [{
        fileId: item.MaCongVan,
        fileName: item.TenFile,
        fileType: '', // Assuming the file type is PDF
        fileSize: item.SoTrang, // Assuming file size is the number of pages
        fileData: item.DataFile,
        soTrang: item.SoTrang
      }]
    }));
    // console.log(customData);
    const response = await axios.post('http://localhost:8080/qlvb/api/shared/integration/doc/create/', customData, {
      headers: {
        'X-Authentication-Token': authToken,
        'Content-Type': 'application/json'
      }
    });
    if (response.data.status.code === '0' && response.data.data === 'TRUE') {
        updateTrangThaiDaChuyen(data);
    }
    console.log('-----Sync CongVan successfully: ', response.data.data);
  } catch (error) {
    console.error('Error fetching or posting data:', error);
  }
};

const getResultCongVanDi = async () => {
  let authToken = getAuthToken();
  try {
    const response = await axios.get('http://localhost:8080/qlvb/api/shared/congvan_stc/get_result/', {
      headers: {
        'X-Authentication-Token': authToken
      }
    });
    const dataList = response.data.data;
    // Check if dataList is not an empty array
    if (Array.isArray(dataList) && dataList.length > 0) {
      const idsArray = await updateListCongVanDi(dataList);
      console.error('idsArray: ', idsArray);
      if (Array.isArray(idsArray) && idsArray.length > 0) {
        const ids = idsArray.join(','); // Join the array elements into a comma-separated string
        await sendIdsToReceiveStatus(ids);
      } else {
        console.error('No IDs to send');
      }
    } else {
      console.error('dataList is empty');
    }
  } catch (error) {
    console.error('Error fetching dataList:', error);
  }
};

const sendIdsToReceiveStatus = async (ids) => {
  let authToken = getAuthToken();
  try {
    const response = await axios.post('http://localhost:8080/qlvb/api/shared/integration/doc/receive_status/', null, {
      params: {ids},
      headers: {
        'X-Authentication-Token': authToken,
        'Content-Type': 'application/json'
      }
    });
    console.log('-----update Status to IOFFICE successfully: ', response.data);
  } catch (error) {
    console.error('Error sending IDs:', error);
  }
};

const CongVanDi_ChoKyJob = () => {
  cron.schedule('*/1 * * * *', () => {
    console.log('-----CongVanDi_ChoKyJob running every 5 minutes-----');
    createIntegrationCongVan();
  });
};

const getResultCongVanDiJob = () => {
  cron.schedule('*/2 * * * *', () => {
    console.log('-----getResultCongVanDiJob running every 5 minutes-----');
    getResultCongVanDi();
  });
};

module.exports = {
  CongVanDi_ChoKyJob,
  getResultCongVanDiJob
};
