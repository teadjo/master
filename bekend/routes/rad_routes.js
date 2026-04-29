const express = require("express");
const router = express.Router();
const multer = require('multer'); 
const path = require('path');
const fs = require('fs');

const radKontroler = require("../controlers/rad_controler");


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'artwork-' + uniqueSuffix + ext);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Samo slike su dozvoljene!'));
        }
    }
});

// POST za dodavanje rada sa slikom
router.post("/", upload.single('slika'), radKontroler.insertArtwork);


router
    .route("/")
    .get(radKontroler.getAllArtworks)
    .post(radKontroler.insertArtwork);
router
    .route("/category/:category/")
    .get(radKontroler.getArtworkByCategory);
router
    .route("/artist/:artistID")
    .get(radKontroler.getArtworkByArtist);
router
    .route("/artwork/:artworkID")
    .get(radKontroler.getArtworkByID)
router
    .route("/name/:name")
    .get(radKontroler.getArtworkByName);
router
    .route("/user/:userID")
    .put(radKontroler.UpdateArtworkDesctiption);
router
    .route("/inn/:artworkID")
    .get(radKontroler.getArtworkByInnerJoin);
 

module.exports = router;