const pool = require("../DBconnection/dbconnection");

const getAllCategories = async () => {
    const results = await pool.query('SELECT * FROM public."Kategorija"');
    return results.rows;
};


const getCategorydByName = async (name) => {
    const results = await pool.query(
      'Select * From public."Kategorija" where "naziv" = $1',
      [name]
    );
    return results.rows;
  };

  const insertCategory = async (ctgr) => {
    const results = await pool.query(
      'Insert into public."Kategorija" ("naziv") Values ($1)',
      [ ctgr.naziv,]
    );
    return results.rows;
  };
  

module.exports = {
    getAllCategories,
    getCategorydByName, 
    insertCategory,
  };
  