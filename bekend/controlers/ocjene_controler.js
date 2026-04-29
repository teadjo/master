const pool = require("../DBconnection/dbconnection");
const grade = require("../repository/ocjena_repository");

const getAllGrades = async (request, response) => {
    const results = await grade.getAllGrades();
    response.send(results);
};

const getGradeByArtwork = async (request, response) => {
    const art = request.params.artID;
    const results = await grade.getGradeByArtwork(art);
    response.send(results);
};

const getGradeByEvaluator = async (request, response) => {
    const evaluator = request.params.evaluatorID;
    const results = await grade.getGradeByEvaluator(evaluator);
    response.send(results);
};

const getGradeByID = async (request, response) => {
    const id = request.params.gradeID;
    const results = await grade.getGradeByID(id);
    response.send(results);
};
const getGradeByCompIDandArt = async (request, response) => {
    const id = request.params.compID;
    const idA = request.params.artID;
    const results = await grade.getGradeByCompIDandArt(id, idA);
    response.send(results);
};
const getGradeByCompID = async (request, response) => {
    const id = request.params.compID;
    const results = await grade.getGradeByCompID(id);
    response.send(results);
};


const insertGrade = async (request, response) => {
    const results = await grade.insertGrade(request.body);
    response.send(results);
};

module.exports = {
    getAllGrades,
    getGradeByID,
    getGradeByArtwork,
    getGradeByEvaluator,
    getGradeByCompID,
    getGradeByCompIDandArt,
    insertGrade,
   };
   