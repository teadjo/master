const express = require("express");
const app = express();
const cors = require("cors");
const compression = require('compression');
const path = require('path'); 
const fs = require('fs'); 
require('dotenv').config();

const userrouter = require("./routes/korisnici_routes");
const categoryrouter = require("./routes/kategorija_routes");
const artworkrouter = require("./routes/rad_routes");
const comprouter = require("./routes/takmicenja_routes");
const awardrouter = require("./routes/nagrade_routes");
const gradesrouter = require("./routes/ocjene_routes");
const artwork_userrouter = require("./routes/rad_korisnik_routes");
const artwork_user_award = require("./routes/rad_korisnik_nagrada_routes");
const trroutes = require("./routes/takmicenje_rad_routes");

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cors({
  origin: [
    'https://master-spa2.vercel.app',
    'https://master-azure-two.vercel.app',
    'http://localhost:5173',
    'https://master-spa2-git-main-teadjos-projects.vercel.app',
    'https://master-git-main-teadjos-projects.vercel.app'
  ],
  credentials: true
}));
app.use(compression());

app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res) => {
    res.set('Cache-Control', 'public, max-age=31536000, immutable')
  }
}));

app.use("/competitions/", comprouter);
app.use("/aua/", artwork_user_award);
app.use("/category/", categoryrouter);
app.use("/artworks/", artworkrouter);
app.use("/awards/", awardrouter);
app.use("/grades/", gradesrouter);
app.use("/spec/", trroutes);
app.use("/rk/", artwork_userrouter);
app.use("/", userrouter);

app.listen(3021, () => {
    console.log("server slusa na portu 3021");
});