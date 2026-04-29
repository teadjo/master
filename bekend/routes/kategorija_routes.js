const express = require("express");
const router = express.Router();

const kategorijeKontroler = require("./../controlers/kategorije_controler");


router
    .route("/")
    .get(kategorijeKontroler.getAllCategories)
    .post(kategorijeKontroler.insertCategory);
router
    .route("/:categoryName/")
    .get(kategorijeKontroler.getCategorydByName)
    .post(kategorijeKontroler.insertCategory);


module.exports = router;