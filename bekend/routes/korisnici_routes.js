const express = require("express");
const router = express.Router();
const korisnicikontroler = require("../controlers/korisnici_controler");
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = '/uploads';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'profile-' + uniqueSuffix + ext);
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

router
    .route("/")
    .get(korisnicikontroler.getAllUsers);
router
    .route("/login")
    .post(korisnicikontroler.login);
router
    .route("/user/:id/")
    .get(korisnicikontroler.getUserByID)
    .put(korisnicikontroler.updateUser)
    .delete(korisnicikontroler.deleteUser);
router
    .route("/username/:username/")
    .get(korisnicikontroler.getUserByUsername);
router
    .route("email/:email/")
    .get(korisnicikontroler.getUserByEmail);
router
    .route("/type/:type/")
    .get(korisnicikontroler.getUserByType);
router
    .route("/add/")
    .post(upload.single('slika'), async (req, res) => {
      try {
        const originalPath = req.file.path;
    
        const webpFilename =
          req.file.filename.split('.')[0] + '.webp';
    
        const outputPath = path.join(
          __dirname,
          '../uploads',
          webpFilename
        );
    
        await sharp(originalPath)
          .resize({
            width: 1200,
            withoutEnlargement: true
          })
          .webp({
            quality: 80
          })
          .toFile(outputPath);
    
        fs.unlinkSync(originalPath);
    
        req.file.filename = webpFilename;
        req.file.path = outputPath;
    
        await korisnicikontroler.insertUser(req, res);
    
      } catch (error) {
        console.error(error);
        res.status(500).json({
          error: 'Image optimization failed'
        });
      }
    });
    


module.exports = router;