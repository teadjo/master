const pool = require("../DBconnection/dbconnection");
const competition = require("../repository/tekmicenje_repository");
const path = require('path');
const fs = require('fs');
const webpush = require('web-push');

const getAllCompetitions = async (request, response) => {
    const results = await competition.getAllCompetitions();
    response.send(results);
};

const getCompetitionByCategory = async (request, response) => {
    const name = request.params.category;
    const results = await competition.getCompetitionByCategory(name);
    response.send(results);
};

const getCompetitionByID = async (request, response) => {
    const id = request.params.compID;
    const results = await competition.getCompetitionByID(id);
    response.send(results);
};

const getCompetitionByName = async (request, response) => {
    const name = request.params.compName;
    const results = await competition.getCompetitionByName(name);
    response.send(results);
};

const getCompetitionByStartDate = async (request, response) => {
    const date = request.params.startDate;
    const results = await competition.getCompetitionByStartDate(date);
    response.send(results);
};

const insertCompetition = async (request, response) => {
     let slikaPath = null;
        
        // Ako je uploadovana slika, sačuvaj putanju
        if (request.file) {
            slikaPath = `/uploads/${request.file.filename}`;
        }
        
        const competitionData = {
            naziv_takmicenja: request.body.naziv_takmicenja,
            opis: request.body.opis,
            datum_poc: request.body.datum_poc,
            datum_kraja: request.body.datum_kraja,
            naziv_kategorije_t: request.body.naziv_kategorije_t,
            slika: slikaPath,
            ime: request.body.ime,
            svota:request.body.svota
        };
        
        const results = await competition.insertCompetition(competitionData);
     try {
        // Dobavi sve subscription-e
        const subscriptions = await pool.query(
            `SELECT endpoint, p256dh, auth FROM public."PushSubscriptions"`
        );
        
        const payload = JSON.stringify({
            title: '🏆 Novo takmičenje!',
            body: `${competitionData.naziv_takmicenja} - Prijavite se na vrijeme!`,
            icon: '/icons/192.png',
            badge: '/icons/192.png',
            url: `/competition/${results[0]?.id || ''}`,
            vibrate: [200, 100, 200]
        });
        
        // Pošalji svim pretplatnicima
        const notifications = subscriptions.rows.map(async (sub) => {
            try {
                const pushSubscription = {
                    endpoint: sub.endpoint,
                    keys: {
                        p256dh: sub.p256dh,
                        auth: sub.auth
                    }
                };
                await webpush.sendNotification(pushSubscription, payload);
            } catch (error) {
                console.error('Greška pri slanju notifikacije:', error);
                // Ako subscription nije više validan, obriši ga
                if (error.statusCode === 410 || error.statusCode === 404) {
                    await pool.query('DELETE FROM public."PushSubscriptions" WHERE endpoint = $1', [sub.endpoint]);
                }
            }
        });
        
        await Promise.all(notifications);
        console.log(`✅ Notifikacije poslate na ${subscriptions.rows.length} uređaja`);
    } catch (error) {
        console.error('Greška pri slanju notifikacija:', error);
    }
    // ===== KRAJ PUSH LOGIKE =====
    
    response.send(results);
 
};

const getCompetitionBySearch = async (request, response) => {
    const name = request.params.search;
    const results = await competition.getCompetitionBySearch(name);
    response.send(results);
};

  
module.exports = {
    getAllCompetitions,
    getCompetitionByID,
    getCompetitionByName, 
    getCompetitionByCategory,
    getCompetitionByStartDate,
    getCompetitionBySearch,
    insertCompetition,
   };
   