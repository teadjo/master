const express = require("express");
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const takmicenjaKontroleri = require("../controlers/takmicenje_controler");


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
        cb(null, 'competition-' + uniqueSuffix + ext);
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

// POST ruta za dodavanje takmičenja sa slikom
router.post("/", upload.single('slika'), takmicenjaKontroleri.insertCompetition);


router
    .route("/")
    .get(takmicenjaKontroleri.getAllCompetitions)
    .post(takmicenjaKontroleri.insertCompetition);
router
    .route('/search/:search')
    .get(takmicenjaKontroleri.getCompetitionBySearch);
router
    .route("/compName/:compName/")
    .get(takmicenjaKontroleri.getCompetitionByName);
router
    .route("/compID/:compID")
    .get(takmicenjaKontroleri.getCompetitionByID);

router
    .route("/start/:startDate")
    .get(takmicenjaKontroleri.getCompetitionByStartDate);
router
    .route("/category/:category/")
    .get(takmicenjaKontroleri.getCompetitionByCategory);

module.exports = router;