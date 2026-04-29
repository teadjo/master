const pool = require("../DBconnection/dbconnection");
const rknc = require("../repository/rad_korisnik_nagrada_repository");

const getAll = async (request, response) => {
    const results = await rknc.getAll();
    response.send(results);
};

const getByArtistID = async (request, response) => {
    const id = request.params.artistID;
    const results = await rknc.getByArtistID(id);
    response.send(results);
};

const check = async (request, response) => {
    const art = request.params.artID;
    const comp = request.params.compID;
    const results = await rknc.check(art,comp);
    response.send(results);
};


const getByArtworkID  = async (request, response) => {
    const id = request.params.artworkID;
    const results = await rknc.getByArtworkID(id);
    response.send(results);
};

const getByAwardName  = async (request, response) => {
    const name = request.params.awardName;
    const results = await rknc.getByAwardName(name);
    response.send(results);
};

const getByCompetitionID  = async (request, response) => {
    const id = request.params.compID;
    const results = await rknc.getByCompetitionID(id);
    response.send(results);
};

const insert  = async (request, response) => {
    const results = await rknc.insert(request.body);
    response.send(results);
};

  
module.exports = {
    getAll,
    getByArtistID,
    getByArtworkID,
    getByAwardName,
    getByCompetitionID,
    insert,
    check
   };
   