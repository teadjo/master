const pool = require("../DBconnection/dbconnection");
const {insertAward } = require('./nagrade_repository')
const {getAwardkByCompetition} = require('./nagrade_repository')

const getAllCompetitions = async () => {
    const results = await pool.query('SELECT * FROM public."Takmicenje"');
    return results.rows;
};


const getCompetitionByID = async (CompetitionID) => {
    const results = await pool.query(
      'Select * From public."Takmicenje" where "id" = $1',
      [CompetitionID]
    );
    const updatedResults = await
    Promise.all(results.rows.map(async(row) => {
      const user = await getAwardkByCompetition(row.id);
      return {...row, ...user[0]};
  }))
  return updatedResults;
  };

  const getCompetitionByName = async (name) => {
    const results = await pool.query(
      'Select * From public."Takmicenje" where "naziv_takmicenja" = $1',
      [name]
    );
    return results.rows;
  };

  const getCompetitionByStartDate = async (date) => {
    const results = await pool.query(
      'Select * From public."Takmicenje" where "datum_poc" = $1',
      [date]
    );
    return results.rows;
  };

  const getCompetitionByCategory = async (category) => {
    const results = await pool.query(
      'Select * From public."Takmicenje" where "naziv_kategorije_t" = $1',
      [category]
    );
    return results.rows;
  };
  const getCompetitionBySearch = async (category) => {
    const searchTerm = `%${category}%`; 

    const results = await pool.query(
        `SELECT * 
        FROM public."Takmicenje" 
        WHERE "naziv_kategorije_t" ILIKE $1 
            OR "naziv_takmicenja" ILIKE $1`,
        [searchTerm]
    );

    return results.rows;
  };


  const insertCompetition = async (comp) => {
    const results = await pool.query(
      'Insert into public."Takmicenje" ("naziv_takmicenja", "opis", "datum_poc", "datum_kraja", "naziv_kategorije_t", "slika") Values ($1,$2,$3,$4,$5,$6) RETURNING id',
      [
        comp.naziv_takmicenja,
        comp.opis,
        comp.datum_poc,
        comp.datum_kraja,
        comp.naziv_kategorije_t,
        comp.slika
      ]
    );
    const part = {id : results.rows[0].id}
    const whole = ({...comp, ...part});
    console.log(whole)
    const award = await insertAward(whole);

    return results.rows;
  };
  
module.exports = {
   getAllCompetitions,
   getCompetitionByID,
   getCompetitionByName, 
   getCompetitionByCategory,
   getCompetitionByStartDate,
   getCompetitionBySearch,
   insertCompetition,
  };
  