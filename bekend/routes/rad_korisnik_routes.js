const express = require("express");
const router = express.Router();

const rad_korisnik_controler = require("../controlers/rad_korisnik_controler");

router
    .route("/")
    .get(rad_korisnik_controler.getAllRK)
    .post(rad_korisnik_controler.insertRK);
router
    .route("/:artistID/")
    .get(rad_korisnik_controler.getRKByArtistID)
router
    .route("/:artworkID/")
    .get(rad_korisnik_controler.getRKByArtworkID);


module.exports = router;