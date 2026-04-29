const pool = require("../DBconnection/dbconnection");
const {getCompetitionByID} = require('./tekmicenje_repository')
const {getArtworkByID} = require('./rad_repository');


const getAllTR = async () => {
    const results = await pool.query(
        'Select * From public."Takmicenje_Rad"'
    );
   return results.rows;
};

const getTRByCompetitionID = async (compID) => {
    const results = await pool.query(
        'Select * From public."Takmicenje_Rad" where "id_takmicenja_tr" = $1',
        [ compID ]
    );
    const updatedResults = await
    Promise.all(results.rows.map( async (row) => {
        const rad = await getArtworkByID(row.id_rada_tr);
        return {...row, ...rad[0]};
    }))
    return updatedResults;
};

const getTRByArtworkID = async (compID) => {
    const results = await pool.query(
        'Select DISTINCT * From public."Takmicenje_Rad" where "id_rada_tr" = $1',
        [ compID ]
    );
    const updatedResults = await
    Promise.all(results.rows.map(async(row) => {
        const rad = await getCompetitionByID(row.id_takmicenja_tr);
        return {...row, ...rad[0]};
    }))
    return updatedResults;
};


const getTRByCompetitionIDandArtworkID = async (compID, artworkID) => {
    const results = await pool.query(
        'Select * From public."Takmicenje_Rad" where "id_takmicenja_tr" = $1 and "id_rada_tr" = $2',
        [   
            compID,
            artworkID,
        ]
    );
    return results.rows;
};

const insertTR = async (comp) => {
    const results = await pool.query(
      'Insert into public."Takmicenje_Rad" ("id_takmicenja_tr", "id_rada_tr") Values ($1,$2) ON CONFLICT ("id_takmicenja_tr", "id_rada_tr") DO NOTHING RETURNING *',
      [
        comp.id_takmicenja_tr,
        comp.id_rada_tr,
      ]
    );
    console.log(results.rows)
    return results.rows;
  };

 
module.exports = {
    getAllTR,
    getTRByCompetitionID,
    getTRByArtworkID,
    getTRByCompetitionIDandArtworkID,
    insertTR,
};
