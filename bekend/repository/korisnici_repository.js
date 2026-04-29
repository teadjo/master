const pool = require("../DBconnection/dbconnection");
const crypto = require("crypto");
const {deleteGrade} = require("./ocjena_repository")
const {deleteRK} = require('./rad_korisnik_repository')
const {deleteRKN} = require('./rad_korisnik_nagrada_repository')
const {deleteArtwork} = require('./rad_repository')

function encrypt_text(pass) {
    const algorithm = "aes-256-cbc";
    const secretKey = "0123456789abcdef0123456789abcdef";
  
    const plainText = pass;
    const iv = "0123456789abcdef";
    const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
  
    let encryptedData = cipher.update(plainText, "utf8", "hex");
    encryptedData += cipher.final("hex");
  
    return encryptedData;
  }

const getAllUsers = async () => {
    const results = await pool.query('SELECT * FROM public."Korisnik"');
    return results.rows;
};

const getUserByID = async (UserID) => {
    const results = await pool.query(
      'Select * From public."Korisnik" where "id_kor" = $1',
      [UserID]
    );
    return results.rows;
  };

  const getUserByUsername = async (username) => {
    const results = await pool.query(
      'Select * From public."Korisnik" where "korisnicko_ime" = $1',
      [username]
    );
    return results.rows;
  };

  const getUserByType = async (type) => {
    const results = await pool.query(
      'Select * From public."Korisnik" where "tip" = $1',
      [type]
    );
    return results.rows;
  };

  const getUserByEmail = async (email) => {
    const results = await pool.query(
      'Select * From public."Korisnik" where "mail" = $1',
      [email]
    );
    return results.rows;
  };

  const registerUser = async (credencials) => {
    const results = await pool.query(
      'Select * From public."Korisnik" where "korisnicko_ime" = $1 and "lozinka" = $2',
      [credencials.Username, encrypt_text(credencials.Password)]
    );
    return results.rows;
  };

  const insertUser = async (user) => {
    const results = await pool.query(
      'Insert into public."Korisnik" ("ime_kor", "prezime", "mail","br_tel", "korisnicko_ime", "lozinka","tip", "profilna_slika", "opis_kor") Values ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',
      [
        user.Name,
        user.Surname,
        user.Email,
        user.Phone,
        user.Username,
        encrypt_text(user.Password),
        user.Type,
        user.slika,
        user.Description,
      ]
    );
    return results.rows;
  };

  const updatePass = async (ID, credencial) => {
    const results = await pool.query(
      'Update public."Korisnik" set "lozinka" = $1 where "id_kor" = $2',
      [encrypt_text(credencial.pass), ID]
    );
    return results.rows;
  };

  const updateUser = async (user) => {
    const results = await pool.query(
      'UPDATE public."Korisnik" SET "ime_kor" = $1, "prezime" = $2, "mail"=$3, "br_tel" = $4, "korisnicko_ime" = $5, "tip"=$6, "opis_kor"=$7 WHERE "id_kor" = $8',
      [user.ime, user.prezime, user.mail, user.br_tel, user.korisnicko_ime, user.tip, user.opis, user.id]
    );
    return results.rows;
}; 

const deleteUser = async(id)=>{
  await deleteRKN(id);
  await deleteRK(id);
  await deleteGrade(id)
  await deleteArtwork(id);
  const results = await pool.query(
      'DELETE FROM public."Korisnik" WHERE "id_kor" = $1 RETURNING *',
      [id]
    );
    return results.rows;
}
  
module.exports = {
    getAllUsers,
    getUserByID,
    getUserByType,
    getUserByUsername,
    getUserByEmail,
    insertUser,
    updatePass,
    registerUser,
    updateUser,
    deleteUser,
  };
  