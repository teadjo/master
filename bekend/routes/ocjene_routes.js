
const express = require("express");
const router = express.Router();

const ocjneakontroler = require("../controlers/ocjene_controler");

router
    .route("/")
    .get(ocjneakontroler.getAllGrades)
    .post(ocjneakontroler.insertGrade);
router
    .route("/artID/:artID")
    .get(ocjneakontroler.getGradeByArtwork);
router
    .route("/evalID/:evaluatorID")
    .get(ocjneakontroler.getGradeByEvaluator);
router
    .route("/gradeID/:gradeID")
    .get(ocjneakontroler.getGradeByID);
router
    .route("/compID/:compID/artID/:artID")
    .get(ocjneakontroler.getGradeByCompIDandArt);
router
    .route("/kmp/:compID")
    .get(ocjneakontroler.getGradeByCompID);

module.exports = router;