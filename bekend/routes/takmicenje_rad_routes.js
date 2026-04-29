const express = require("express");
const router = express.Router();

const trKontroleri = require("../controlers/takmicenje_rad_controler");

router
    .route("/")
    .get(trKontroleri.getAllTR)
    .post(trKontroleri.insertTR);
router
    .route("/tra/:artID/")
    .get(trKontroleri.getTRByArtworkID);
router
    .route("/tr/:compID/")
    .get(trKontroleri.getTRByCompetitionID);
router
    .route("/:compID/:artworkID")
    .get(trKontroleri.getTRByCompetitionIDandArtworkID);


    
module.exports = router;