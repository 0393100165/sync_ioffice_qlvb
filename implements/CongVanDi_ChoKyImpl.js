const { poolPromise } = require('../db');
const fs = require('fs');
const path = require('path');

async function getCongVanDi() {
  const query = `
    SELECT 
      MaCongVan, 
      case when nsd.MaNguoiSD_SKH is not null then nsd.MaNguoi_IOfice else cvd_ck.MaNguoiKy end as MaNguoiKy, 
      NoiDung, 
      NoiNhan, 
      TenFile, 
      SoTrang, 
      MaLoaiHinhCongVan 
    FROM CongVan_2025.dbo.CongVanDi_ChoKy cvd_ck
    JOIN CongVan_2025.dbo.Mapping_NSD nsd on cvd_ck.MaNguoiKy = nsd.MaNguoiSD_SKH
  `;
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(query);
    return result.recordset;
  } catch (err) {
    console.error('Error executing query', err);
    throw err;
  }
}

async function updateListCongVanDi(dataList) {
  const query = `
    UPDATE CongVan_2025.dbo.CongVanDi_ChoKy
    SET 
      NgayPhatHanh = @NgayPhatHanh,
      TenFile = @TenFile,
      DuongDanFileScan = @DuongDanFileScan
    WHERE MaCongVan = @MaCongVan
  `;
  try {
    const pool = await poolPromise;
    for (const data of dataList) {
      await pool.request()
        .input('NgayPhatHanh', data.NgayPhatHanh)
        .input('TenFile', data.TenFile)
        .input('DuongDanFileScan', data.DuongDanFileScan)
        .input('MaCongVan', data.MaCongVan)
        .query(query);

      if (data.FileData && data.FileData.trim() !== '') {
        await saveFileBase64(data.FileData, data.TenFile);
      }
    }
  } catch (err) {
    console.error('Error executing update', err);
    throw err;
  }
}

async function saveFileBase64(base64String, fileName) {
  const filePath = path.join(process.env.HOME, 'sub-ioffice', fileName);
  const fileBuffer = Buffer.from(base64String, 'base64');
  try {
    fs.writeFileSync(filePath, fileBuffer);
    console.log(`File saved to ${filePath}`);
  } catch (err) {
    console.error('Error saving file', err);
    throw err;
  }
}

module.exports = {
  getCongVanDi,
  updateListCongVanDi,
  saveFileBase64
};
