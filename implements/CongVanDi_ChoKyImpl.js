const db = require('../db');

async function getCongVanDi() {
  const query = `
    SELECT 
      MaCongVan, 
      MaNguoiKy, 
      NoiDung, 
      NoiNhan, 
      TenFile, 
      SoTrang, 
      MaLoaiHinhCongVan 
    FROM CongVan_2025.dbo.CongVanDi_ChoKy
  `;
  try {
    const result = await db.query(query);
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
      DuongDanFile = @DuongDanFile
    WHERE MaCongVan = @MaCongVan
  `;
  try {
    for (const data of dataList) {
      await db.query(query, {
        NgayPhatHanh: data.NgayPhatHanh,
        TenFile: data.TenFile,
        DuongDanFile: data.DuongDanFile,
        MaCongVan: data.MaCongVan
      });
    }
  } catch (err) {
    console.error('Error executing update', err);
    throw err;
  }
}

module.exports = {
  getCongVanDi,
  updateListCongVanDi
};
