const express = require("express");
const router = express.Router();

const rknkontroler = require("../controlers/rad_korisnik_nagrada_controler");

router
    .route("/")
    .get(rknkontroler.getAll)
    .post(rknkontroler.insert);
router
    .route("/:artistID/")
    .get(rknkontroler.getByArtistID);
router
    .route("/artwork/:artworkID/")
    .get(rknkontroler.getByArtworkID);
router
    .route("/:awardName/")
    .get(rknkontroler.getByAwardName);
router
    .route("/:compID/")
    .get(rknkontroler.getByCompetitionID);
router
    .route("/check/:artID/:compID")
    .get(rknkontroler.check)

module.exports = router;