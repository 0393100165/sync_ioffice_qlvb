const { poolPromise } = require('../db');
const fs = require('fs');
const path = require('path');

async function getCongVanDi() {
  const query = `
  		SELECT
		    cvd_ck.MaCongVan, 
		    CASE 
		        WHEN cvd_ck.MaNguoiKy IS NOT NULL THEN
		            (SELECT nsd.MaNguoi_IOfice 
		             FROM CongVan_2025.dbo.Mapping_NSD nsd 
		             WHERE nsd.MaNguoiSD_SKH = cvd_ck.MaNguoiKy)
		        ELSE cvd_ck.MaNguoiKy
		    END AS MaNguoiKy,
		    CASE 
		        WHEN cvd_ck.MaNguoiSoanVB IS NOT NULL THEN
		            (SELECT nsd.MaNguoi_IOfice 
		             FROM CongVan_2025.dbo.Mapping_NSD nsd 
		             WHERE nsd.MaNguoiSD_SKH = cvd_ck.MaNguoiSoanVB)
		        ELSE cvd_ck.MaNguoiSoanVB
		    END AS MaNguoiSoan,
		    cvd_ck.NoiDung,
		    ISNULL(nnc.NoiNhan, '') AS NoiNhan, 
		    cvd_ck.TenFile,
		    dhtvbm.MaHinhThuc_STC AS MaHinhThuc,
		    cvd_ck.SoTrang,
		    cvd_ck.NoiNhan_KhongDanhMuc AS DonViNgoai,
		    cvd_ck.MaCongVanSo
		FROM CongVan_2025.dbo.CongVanDi_ChoKy cvd_ck
		LEFT JOIN CongVan_2025.dbo.DM_HinhTHucVanBan_Mapping dhtvbm 
		    ON cvd_ck.MaLoaiCongVan = dhtvbm.MaHinhThuc_SKH
		LEFT JOIN (
		    SELECT 
		        nn.MaCongVan,
		        STRING_AGG(CAST(dcqphi.AgentID AS VARCHAR(40)) + '|' + nn.MaCoQuan, ', ') AS NoiNhan
		    FROM CongVan_2025.dbo.NoiNhanCongVan_ChoKy nn
		    JOIN CongVan_2025.dbo.DM_CoQuanPhatHanh_Ioffce dcqphi on nn.MaCoQuan = dcqphi.MaCoQuan 
		    GROUP BY nn.MaCongVan
		) nnc ON cvd_ck.MaCongVan = nnc.MaCongVan
  `;
  //    WHERE cvd_ck.DaChuyen is null
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(query);
    for (const record of result.recordset) {
      if (record.TenFile) {
        const filePath = path.join(process.env.HOME, process.env.TEST_FOLDER, record.TenFile); // TEST_FOLDER not include '/'
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
  const updatedMaCongVanList = [];
  try {
    const pool = await poolPromise;
    for (const data of dataList) {
      for (const data_file of data.files) {
        if (data_file.fileData && data_file.fileData.trim() !== '') {
          if (data_file.fileType === 'pdf') {
            const folderPath = path.join(process.env.HOME, process.env.TEST_FOLDER);
            const filePath = path.join(process.env.HOME, process.env.TEST_FOLDER, data_file.fileName);
            // const folderPath = path.join(process.env.ROOT_FOLDER, process.env.PDF_FOLDER);
            const query = `
            UPDATE CongVan_2025.dbo.CongVanDi_ChoKy
            SET 
              NgayPhatHanh = @NgayPhatHanh,
              MaCongVanSo = @MaCongVanSo,
              DuongDanFileScan = @DuongDanFileScan
            WHERE MaCongVan = @MaCongVan
            `;
            await pool.request()
            .input('NgayPhatHanh', data.ngayBanHanh)
            .input('MaCongVanSo', data.soKyHieu)
            .input('DuongDanFileScan', data_file.fileName)
            .input('MaCongVan', data.dossierId)
            .query(query);
            await saveFileBase64(data_file.fileData, data_file.fileName, folderPath, filePath);
          }
          else {
            const folderPath = path.join(process.env.HOME, process.env.TEST_FOLDER);
            const filePath = path.join(process.env.HOME, process.env.TEST_FOLDER, data_file.fileName);
            // const folderPath = path.join(process.env.ROOT_FOLDER, process.env.PDF_FOLDER);
            const query = `
            UPDATE CongVan_2025.dbo.CongVanDi_ChoKy
            SET 
              NgayPhatHanh = @NgayPhatHanh,
              TenFile = @TenFile,
              MaCongVanSo = @MaCongVanSo
            WHERE MaCongVan = @MaCongVan
            `;
            await pool.request()
            .input('NgayPhatHanh', data.ngayBanHanh)
            .input('TenFile', data_file.fileName)
            .input('MaCongVanSo', data.soKyHieu)
            .input('MaCongVan', data.dossierId)
            .query(query);
            await saveFileBase64(data_file.fileData, data_file.fileName, folderPath, filePath);
          }
        }
      }
      updatedMaCongVanList.push(data.dossierId);
    }
  } catch (err) {
    console.error('Error executing update', err);
    throw err;
  }
  console.error('updateListCongVanDi: ', updatedMaCongVanList);
  return updatedMaCongVanList;
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
    console.log('-----Updated DaChuyen for all records');
  } catch (err) {
    console.error('Error executing update', err);
    throw err;
  }
}

async function saveFileBase64(base64String, fileName, folderPath, filePath) {
  // const filePath = path.join(process.env.HOME, process.env.TEST_FOLDER, fileName);
  const fileBuffer = Buffer.from(base64String, 'base64');
  try {
    // Check if the folder exists, if not, create it
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
      console.log(`-----Folder created at ${folderPath}`);
    }
    fs.writeFileSync(filePath, fileBuffer);
    console.log(`-----File saved to ${filePath}`);
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
