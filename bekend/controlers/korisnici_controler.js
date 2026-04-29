const pool = require("../DBconnection/dbconnection");
const users = require("../repository/korisnici_repository");
const jwt = require("jsonwebtoken");

const getAllUsers = async (request, response) => {
    const result = await users.getAllUsers();
    response.send(result);
};

const getUserByID = async (request, response) => {
    const userID = request.params.id;
    const results = await users.getUserByID(userID);
    response.send(results);
};

const getUserByEmail = async (request, response) => {
    const email = request.params.email;
    const results = await users.getUserByEmail(email);
    response.send(results);
};

const getUserByType = async (request, response) => {
  const t = request.params.type;
  const results = await users.getUserByType(t);
  response.send(results);
};

const getUserByUsername = async (request, response) => {
    const username = request.params.username;
    const results = await users.getUserByUsername(username);
    response.send(results);
};

const insertUser = async (request, response) => {
    try {
        let slikaPath = null;
        // Ako je uploadovana slika, sačuvaj putanju
        if (request.file) {
            slikaPath = `/uploads/${request.file.filename}`;
        }
        
        const userData = {
            Name: request.body.Name,
            Surname: request.body.Surname,
            Email: request.body.Email,
            Phone: request.body.Phone,
            Username: request.body.Username,
            Password: request.body.Password,
            Type: request.body.Type,
            Description: request.body.Description,
            slika: slikaPath
        };
        
        
        const result = await users.insertUser(userData);
        let returnValue = { token: null, msg: "", status: 200, id: "", tip: "" };
        
        if (typeof result[0] === "undefined") {
            returnValue.msg = "Netacan email ili lozinka, pokušajte ponovo";
            response.send(returnValue);
            return;
        }
      
        let toSend = {
            userID: result[0].id_kor,
            Name: result[0].ime_kor,
            Surname: result[0].prezime,
            Email: result[0].mail,
            Phone: result[0].br_tel,
            Username: result[0].korisnicko_ime,
            Password: result[0].lozinka,
            Description: result[0].opis_kor,
            Type: result[0].tip,
        };
        
        returnValue.id = toSend.userID;
        returnValue.tip = toSend.Type;
        
        jwt.sign(
            toSend,
            "SECRET",
            (err, token) => {
                returnValue.token = token;
                response.send(returnValue);
            },
            { expiresIn: "1h" }
        );
    } catch (error) {
        console.error('Greška:', error);
        // Ako dođe do greške, obriši uploadovanu sliku
        if (request.file) {
            fs.unlink(request.file.path, (err) => {
                if (err) console.error('Greška pri brisanju slike:', err);
            });
        }
        response.status(500).json({ error: error.message });
    }
};



const updateUserPass = async (request, response) => {
    const result = await users.updatePass(
      request.params.userID,
      request.body
    );
    response.send(result);
};
const updateUser = async (request, response) => {
  const result = await users.updateUser(request.body);
  response.send(result);
};
const deleteUser = async (request, response) => {
  const id = request.params.id;
  const result = await users.deleteUser(id);
  response.send(result);
};

const login = async (request, response) => {
    const result = await users.registerUser(request.body);
    let returnValue = { token: null, msg: "", status: 200, id: "", tip: "" };    
    if (typeof result[0] === "undefined") {
      returnValue.msg = "Netacan email ili lozinka, pokušajte ponovo";
      response.send(returnValue);
      return;
    }
  
    let toSend = {
      userID: result[0].id_kor,
      Name: result[0].ime_kor,
      Surname: result[0].prezime,
      Email: result[0].mail,
      Phone: result[0].br_tel,
      Username: result[0].korisnicko_ime,
      Password: result[0].lozinka,
      Description: result[0].opis_kor,
      Type: result[0].tip,
    };
    returnValue.id = toSend.userID;
    returnValue.tip = toSend.Type;
    jwt.sign(
      toSend,
      "SECRET",
      (err, token) => {
        returnValue.token = token;
        response.send(returnValue);
      },
      { expiresIn: "1h" }
    );
  };


module.exports = {
  getAllUsers,
  getUserByEmail,
  getUserByType,
  getUserByID,
  getUserByUsername,
  insertUser,
  updateUserPass,
  login,
  updateUser, 
  deleteUser,
};
