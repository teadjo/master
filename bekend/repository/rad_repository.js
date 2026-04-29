const pool = require("../DBconnection/dbconnection");
const getAllArtworks = async () => {
    const results = await pool.query('SELECT * FROM public."Rad"');
    return results.rows;
};

const getArtworkByID = async (ArtID) => {
    const results = await pool.query(
      'Select * From public."Rad" INNER join public."Korisnik" on "id_umjetnika" = "id_kor" where "id" = $1',
      [ArtID]
    );
    return results.rows;
  };

  const getArtworkByName = async (name) => {
    const results = await pool.query(
      'Select * From public."Rad" where "naziv" = $1',
      [name]
    );
    return results.rows;
  };

  const getArtworkByArtist = async (ArtistID) => {
    const results = await pool.query(
      'Select DISTINCT * From public."Rad" where "id_umjetnika" = $1',
      [ArtistID]
    );
   return results.rows;
  };

  const getArtworkByInnerJoin = async (ArtistID) => {
    const results = await pool.query(
      'Select DISTINCT * From public."Rad" inner join public."Takmicenje_Rad" on public."Rad"."id" = "id_rada_tr" inner join public."Takmicenje" on public."Takmicenje"."id" = "id_takmicenja_tr"  where "id_umjetnika" = $1',
      [ArtistID]
    );
   return results.rows;
  };


  const getArtworkByDescription = async (descriptor) => {
    const results = await pool.query(
      'Select * From public."Rad" where lower("opis_djela") like $1',
      [descriptor]
    );
    return results.rows;
  }

  const getArtworkByCategory = async (name) => {
    const results = await pool.query(
      'Select * From public."Rad" where "naziv_kategorije" = $1',
      [name]
    );
    return results.rows;
  };

  const insertArtwork = async (art) => {
    const results = await pool.query(
      'Insert into public."Rad" ("naziv", "opis_djela", "datum_slanja","id_umjetnika", "naziv_kategorije", "slika") Values ($1,$2,$3,$4,$5,$6) RETURNING *',
      [
       art.naziv,
       art.opis_djela,
       art.datum_slanja,
       art.id_umjetnika,
       art.naziv_kategorije,
       art.slika
      ]
    );
    return results.rows;
  };

  const UpdateArtworkTitle = async (id, title) => {
    const results = await pool.query(
      'Update public."Rad" SET "naziv" = $2 Where "id" = $1',
      [
        id,
        title,
      ]
    );
    return results.rows;
  };

  const UpdateArtworkDesctiption = async (id, desc) => {
    const results = await pool.query(
      'Update public."Rad" SET "opis" = $2 Where "id" = $1',
      [
        id,
        desc,
      ]
    );
    return results.rows;
  };

  const deleteArtwork = async(id)=>{
    const gett = await pool.query(
      'Select DISTINCT * From public."Rad" where "id_umjetnika" = $1',
      [id]
    ); 
    for(i=0; i<gett.rows.length;i++){
      const results1 = await pool.query(
        'DELETE FROM public."Takmicenje_Rad" WHERE "id_rada_tr" = $1 RETURNING *',
        [gett.rows[i].id]
      );
  }
    const results = await pool.query(
        'DELETE FROM public."Rad" WHERE "id_umjetnika" = $1 RETURNING *',
        [id]
      );
      return results.rows;
  }

module.exports = {
    getAllArtworks,
    getArtworkByArtist,
    getArtworkByID, 
    getArtworkByName,
    getArtworkByDescription, 
    UpdateArtworkDesctiption,
    UpdateArtworkTitle,
    insertArtwork,
    getArtworkByCategory,
    getArtworkByInnerJoin,
    deleteArtwork,
  };
  