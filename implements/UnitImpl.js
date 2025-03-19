const { poolPromise } = require('../db');

async function insertUnitLienThong(data) {
    const pool = await poolPromise;
    for (const unit of data) {
        await pool.request()
            .input('MaCoQuan', unit.ID)
            .input('TenCoQuan', unit.NAME)
            .input('AgentID', unit.AGENT_ID)
            .query(`
                IF EXISTS (SELECT 1 FROM CongVan_2025.dbo.DM_CoQuanPhatHanh_Ioffce WHERE MaCoQuan = @MaCoQuan)
                BEGIN
                    UPDATE CongVan_2025.dbo.DM_CoQuanPhatHanh_Ioffce
                    SET TenCoQuan = N'' + @TenCoQuan + '', AgentID = @AgentID
                    WHERE MaCoQuan = @MaCoQuan
                END
                ELSE
                BEGIN
                    INSERT INTO CongVan_2025.dbo.DM_CoQuanPhatHanh_Ioffce (MaCoQuan, TenCoQuan, AgentID)
                    VALUES (@MaCoQuan, N'' + @TenCoQuan + '', @AgentID)
                END
            `);
    }
}

module.exports = {
    insertUnitLienThong,
    // ...existing exports...
};
