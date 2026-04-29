const pool = require("../DBconnection/dbconnection");
const award = require("../repository/nagrade_repository");

const getAllAwards = async (request, response) => {
    const results = await award.getAllAwards();
    response.send(results);
};

const getAwardByName = async (request, response) => {
    const name = request.params.awardName;
    const results = await award.getAwardByName(name);
    response.send(results);
};

const getAwardkByCompetition = async (request, response) => {
    const comp = request.params.compID;
    const results = await award.getAwardkByCompetition(comp);
    response.send(results);
};

const insertAward = async (request, response) => {
    const results = await award.insertAward(request.body);
    response.send(results);
};

module.exports = {
    getAllAwards,
    getAwardByName,
    getAwardkByCompetition,
    insertAward,
  };
  