const pool = require("../DBconnection/dbconnection");
const category = require("../repository/kategorije_repository");


const getAllCategories = async (request, response) => {
    const result = await category.getAllCategories();
    response.send(result);
};

const getCategorydByName = async (request, response) => {
    const name = request.params.categoryName;
    const result = await category.getCategorydByName(name);
    response.send(result);
};

const insertCategory = async (request, response) => {
    const result = await category.insertCategory(request.body);
    response.send(result);
};


module.exports = {
    getAllCategories,
    getCategorydByName, 
    insertCategory,
  };
  