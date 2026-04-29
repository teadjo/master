const pool = require("../DBconnection/dbconnection");
const tr = require("../repository/takmicenje_rad_repository");

const getAllTR = async (request, response) => {
    const results = await tr.getAllTR();
    response.send(results);
};

const getTRByCompetitionID = async (request, response) => {
    const comp = request.params.compID;
    const results = await tr.getTRByCompetitionID(comp);
    response.send(results);
};

const getTRByArtworkID = async (request, response) => {
    const comp = request.params.artID;
    const results = await tr.getTRByArtworkID(comp);
    response.send(results);
};

const getTRByCompetitionIDandArtworkID = async (request, response) => {
    const comp = request.params.compID;
    const results = await tr.getTRByCompetitionIDandArtworkID(comp,art);
    response.send(results);
};

const insertTR = async (request, response) => {
    const results = await tr.insertTR(request.body);
    response.send(results);
};

module.exports = {
   getAllTR,
   getTRByArtworkID,
   getTRByCompetitionID,
   getTRByCompetitionIDandArtworkID,
   insertTR,
  };
  