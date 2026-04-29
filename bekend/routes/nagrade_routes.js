
const express = require("express");
const router = express.Router();

const nagradekontroler = require("../controlers/nagrade_controler");

router
    .route("/")
    .get(nagradekontroler.getAllAwards)
    .post(nagradekontroler.insertAward);
router
    .route("/awrdName/:awardName")
    .get(nagradekontroler.getAwardByName);
router
    .route("/compID/:compID")
    .get(nagradekontroler.getAwardkByCompetition);

    
module.exports = router;