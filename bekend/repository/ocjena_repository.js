const pool = require("../DBconnection/dbconnection");
const {getArtworkByID} = require('./rad_repository');

const getAllGrades = async () => {
    const results = await pool.query('SELECT * FROM public."Ocjena"');
    const updatedResults = await
    Promise.all(results.rows.map(async(row) => {
        const rad = await getArtworkByID(row.id_rada);
        return {...row, ...rad[0]};
    }))
    return updatedResults;
};


const getGradeByID = async (GradeID) => {
    const results = await pool.query(
      'Select * From public."Ocjena" where "id" = $1',
      [GradeID]
    );
    return results.rows;
  };

  const getGradeByEvaluator = async (evaluatorID) => {
    const results = await pool.query(
      'Select * From public."Ocjena" where "id_ocenjivaca" = $1',
      [evaluatorID]
    );
    return results.rows;
  };

  const getGradeByArtwork = async (artworkID) => {
    const results = await pool.query(
      'Select * From public."Ocjena" where "id_rada" = $1',
      [artworkID]
    );
    return results.rows;
  };

  const getGradeByCompIDandArt = async (CompID, ArtID) => {
    const results = await pool.query(
      'Select * From public."Ocjena" where "id_takmicenja" = $1 and "id_rada" = $2',
      [CompID, ArtID]
    );
    return results.rows;
  };
  const getGradeByCompID = async (CompID, ArtID) => {
    const results = await pool.query(
      'Select * From public."Ocjena" where "id_takmicenja" = $1',
      [CompID]
    );
    return results.rows;
  };

  const insertGrade = async (grade) => {
    const results= await pool.query(
      'Insert into public."Ocjena" ("ocjena", "komentar", "id_rada", "id_ocenjivaca", "id_takmicenja") Values ($1,$2,$3,$4,$5)',
      [
        grade.ocjena,
        grade.komentar,
        grade.id_rada,
        grade.id_ocenjivaca,
        grade.id_takmicenja
      ]
    );
    return results.rows;
  };
  
  const deleteGrade = async(id)=>{
    const results = await pool.query(
        'DELETE FROM public."Ocjena" WHERE "id_ocenjivaca" = $1 or "id_ocenjivaca" = $1 RETURNING *',
        [id]
      );
      return results.rows;
  }

module.exports = {
   getAllGrades,
   getGradeByID,
   getGradeByArtwork,
   getGradeByEvaluator,
   getGradeByCompID,
   getGradeByCompIDandArt,
   insertGrade,
   deleteGrade,
  };
  