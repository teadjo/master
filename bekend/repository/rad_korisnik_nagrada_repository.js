const pool = require("../DBconnection/dbconnection");


const getAll = async () => {
    const results = await pool.query('SELECT * FROM public."Rad_Korisnik_Nagrada"');
    return results.rows;
};


const getByArtistID = async (ArtistID) => {
    const results = await pool.query(
      'Select * From public."Rad_Korisnik_Nagrada" where "id_umjetnika_okn" = $1',
      [ArtistID]
    );
    return results.rows;
  };

  const check = async (artID, compID) => {
    const results = await pool.query(
      'Select * From public."Rad_Korisnik_Nagrada" where "id_rada_okn" = $1 and "id_takmicenja_okn" = $2',
      [artID, compID]
    );
    return results.rows.length >= 1;
  };


  const getByArtworkID = async (artworkID) => {
    const results = await pool.query(
      'Select * From public."Rad_Korisnik_Nagrada" where "id_rada_okn" = $1',
      [artworkID]
    );
    return results.rows;
  };

  const getByCompetitionID = async (compID) => {
    const results = await pool.query(
      'Select * From public."Rad_Korisnik_Nagrada" where "id_takmicenja_okn" = $1',
      [compID]
    );
    return results.rows;
  };
  

  const getByAwardName = async (awardName) => {
    const results = await pool.query(
      'Select * From public."Rad_Korisnik_Nagrada" where "ime_nagrade" = $1',
      [awardName]
    );
    return results.rows;
  };

  const insert = async (agg) => {
    const results = await pool.query(
      'Insert into public."Rad_Korisnik_Nagrada" ("id_umjetnika_okn", "id_rada_okn", "ime_nagrade", "id_takmicenja_okn") Values ($1,$2,$3,$4)',
      [
        agg.id_umjetnika_okn,
        agg.id_rada_okn,
        agg.ime_nagrade,
        agg.id_takmicenja_okn,
      ]
    );
    return results.rows;
  };

  const deleteRKN = async(id)=>{
    const results = await pool.query(
        'DELETE FROM public."Rad_Korisnik_Nagrada" WHERE "id_umjetnika_okn" = $1 RETURNING *',
        [id]
      );
      return results.rows;
  }
  
module.exports = {
   getAll,
   getByArtistID,
   getByArtworkID,
   getByAwardName,
   getByCompetitionID,
   insert,
   deleteRKN,
   check
  };
  