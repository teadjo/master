const pool = require("../DBconnection/dbconnection");

const getAllAwards = async () => {
    const results = await pool.query('SELECT * FROM public."Nagrada"');
    return results.rows;
};


const getAwardByName = async (name) => {
    const results = await pool.query(
      'Select * From public."Nagrada" where "ime" = $1',
      [name]
    );
    return results.rows;
  };

  const getAwardkByCompetition = async (competitionID) => {
    const results = await pool.query(
      'Select * From public."Nagrada" where "id_takmicenja" = $1',
      [competitionID]
    );
    return results.rows;
  };

  const insertAward = async (award) => {
    const results = await pool.query(
      'Insert into public."Nagrada" ("ime", "id_takmicenja", "svota") Values ($1,$2,$3)',
      [
       award.ime,
       award.id,
       award.svota,
      ]
    );
    return results.rows;
  };

module.exports = {
    getAllAwards,
    getAwardByName,
    getAwardkByCompetition,
    insertAward,
  };
  