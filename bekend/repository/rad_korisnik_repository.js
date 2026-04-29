const pool = require("../DBconnection/dbconnection");


const getAllRK = async () => {
    const results = await pool.query('SELECT * FROM public."Rad_Korisnik"');
    return results.rows;
};


const getRKByArtistID = async (ArtistID) => {
    const results = await pool.query(
      'Select * From public."Rad_Korisnik" where "id_umjetnika_rk" = $1',
      [ArtistID]
    );
    return results.rows;
  };

  const getRKByArtworkID = async (artworkID) => {
    const results = await pool.query(
      'Select * From public."Rad_Korisnik" where "id_rada_rk" = $1',
      [artworkID]
    );
    return results.rows;
  };

  const insertRK = async (rk) => {
    const results = await pool.query(
      'Insert into public."Rad_Korisnik" ("id_umjetnika_rk", "id_rada_rk") Values ($1,$2)',
      [
        rk.id_umjetnika_rk,
        rk.id_rada_rk,
      ]
    );
    return results.rows;
  };

  const deleteRK = async(id)=>{
    const results = await pool.query(
        'DELETE FROM public."Rad_Korisnik" WHERE "id_umjetnika_rk" = $1 RETURNING *',
        [id]
      );
      return results.rows;
  }
  
module.exports = {
   getAllRK,
   getRKByArtistID,
   getRKByArtworkID,
   insertRK,
   deleteRK,
  };
  