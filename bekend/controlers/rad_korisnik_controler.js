const pool = require("../DBconnection/dbconnection");
const art_user = require("../repository/rad_korisnik_repository");

const getAllRK = async (request, response) => {
    const results = await artwork.getAllRK();
    response.send(results);
};

const getRKByArtistID = async (request, response) => {
    const id = request.params.artistID;
    const results = await art_user.getRKByArtistID(id);
    response.send(results);
};

const getRKByArtworkID = async (request, response) => {
    const id = request.params.artworkID;
    const results = await art_user.getRKByArtworkID(id);
    response.send(results);
};

const insertRK = async (request, response) => {
    const results = await art_user.insertRK(request.body);
    response.send(results);
};

module.exports = {
    getAllRK,
    getRKByArtistID,
    getRKByArtworkID,
    insertRK,
   };