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
      DuongDanFileScan,
      SoTrang, 
      MaLoaiHinhCongVan
    FROM CongVan_2025.dbo.CongVanDi_ChoKy cvd_ck
    JOIN CongVan_2025.dbo.Mapping_NSD nsd on cvd_ck.MaNguoiKy = nsd.MaNguoiSD_SKH

  `;
  //    WHERE cvd_ck.DaChuyen is null
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(query);
    for (const record of result.recordset) {
      if (record.TenFile) {
        const filePath = path.join(process.env.HOME, 'sub-ioffice', record.TenFile);
        if (fs.existsSync(filePath)) {
          const fileBuffer = fs.readFileSync(filePath);
          record.DataFile = fileBuffer.toString('base64');
        } else {
          record.DataFile = null;
        }
      }
    }
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
        .input('TenFile', data.files[0].fileName)
        .input('DuongDanFileScan', data.DuongDanFileScan)
        .input('MaCongVan', data.MaCongVan)
        .query(query);

      if (data.files[0].fileData && data.files[0].fileData.trim() !== '') {
        await saveFileBase64(data.files[0].fileData, data.files[0].fileName);
        console.error('saveFileBase64 successfully');
      }
      console.error('saveFileBase64 successfully: ', data.files[0]);
    }
  } catch (err) {
    console.error('Error executing update', err);
    throw err;
  }
  console.error('updateListCongVanDi successfully');
}

async function updateTrangThaiDaChuyen(dataList) {
  const query = `
    UPDATE CongVan_2025.dbo.CongVanDi_ChoKy
    SET 
      DaChuyen = 1
    WHERE MaCongVan = @MaCongVan
  `;
  try {
    const pool = await poolPromise;
    for (const data of dataList) {
      await pool.request()
        .input('MaCongVan', data.MaCongVan)
        .query(query);
    }
    console.log('Updated DaChuyen for all records');
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
  updateTrangThaiDaChuyen,
  saveFileBase64
};
