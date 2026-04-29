const pool = require("../DBconnection/dbconnection");
const artwork = require("../repository/rad_repository");
const path = require('path');
const fs = require('fs');

const getAllArtworks = async (request, response) => {
    const results = await artwork.getAllArtworks();
    response.send(results);
};

const getArtworkByArtist = async (request, response) => {
    const artist = request.params.artistID;
    const results = await artwork.getArtworkByArtist(artist);
    response.send(results);
};


const getArtworkByID  = async (request, response) => {
    const id = request.params.artworkID;
    const results = await artwork.getArtworkByID(id);
    response.send(results);
};

const getArtworkByInnerJoin  = async (request, response) => {
  const id = request.params.artworkID;
  const results = await artwork.getArtworkByInnerJoin(id);
  response.send(results);
};

const getArtworkByName  = async (request, response) => {
    const name = request.params.name;
    const results = await artwork.getArtworkByName(name);
    response.send(results);
};

const insertArtwork  = async (request, response) => {
    let slikaPath = null;
    console.log(request.file)
    if (request.file) {
        slikaPath = `/uploads/${request.file.filename}`;
    }
    
    const artworkData = {
        naziv: request.body.naziv,
        opis_djela: request.body.opis_djela,
        slika: slikaPath, 
        id_umjetnika: request.body.id_umjetnika,
        naziv_kategorije: request.body.naziv_kategorije,
        datum_slanja: request.body.datum_slanja
    };
    
    const results = await artwork.insertArtwork(artworkData);
    response.send(results);
};

const UpdateArtworkTitle = async (request, response) => {
    const result = await artwork.UpdateArtworkTitle(
      request.params.userID,
      request.body
    );
    response.send(result);
  };

  
const getArtworkByCategory  = async (request, response) => {
  const name = request.params.category;
  const results = await artwork.getArtworkByCategory(name);
  response.send(results);
};

  
const UpdateArtworkDesctiption = async (request, response) => {
    const result = await artwork.UpdateArtworkDesctiption(
      request.params.userID,
      request.body
    );
    response.send(result);
  };

module.exports = {
    getAllArtworks,
    getArtworkByArtist,
    getArtworkByID, 
    getArtworkByName,
    UpdateArtworkDesctiption,
    UpdateArtworkTitle,
    insertArtwork,
    getArtworkByCategory,
    getArtworkByInnerJoin,
  };
  