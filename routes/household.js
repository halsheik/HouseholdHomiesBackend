const express = require("express");
const groupModel = require("../models/group");
const freeclimbSDK = require('@freeclimb/sdk');
const axios = require("axios");
const app = express();

require('dotenv').config();
const accountId = 'AC6fd1d1c6d22f8904aa7a70985f5ba104b79ef7e4';
const apiKey = '4b225058cdaba2c6acb36c048a3df9e520fb98b5';
const freeclimb = freeclimbSDK(accountId, apiKey);

app.get("/", (req, res) => {
    res.send(req.user); // The req.user stores the entire user that has been authenticated inside of it.
});

app.get("/group", (req, res) => {
    if(req.user) {
        console.log("here");
        groupModel.findOne({ houseName: req.user["houseName"] })
        .then((group) => {
            if(group) {
                res.send(group);
            }
        })
    } else {
        res.sendStatus(200);
    }
});

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
}

// messaging handle
app.post('/createGroup', (req, res) => {
    const groupInfo = req.body;
    let errors = []

    const accountId = 'AC6fd1d1c6d22f8904aa7a70985f5ba104b79ef7e4';
    const apiKey = '4b225058cdaba2c6acb36c048a3df9e520fb98b5';
    const freeclimb = freeclimbSDK(accountId, apiKey);
    
    if(req.body.members.length < 2) {
        errors.push("PLEASE ADD AT LEAST TWO MEMBER");
    }

    if(errors.length > 0) {
        // MEANS SOMETHING WENT WRONG -- DECIDE WHAT WE WANT TO DISPLAY/HOW ------------------------------------------
        console.log(errors);
        res.send(errors);
      } else {
        groupModel.findOne({ houseName: req.user["houseName"] })
        .then((user) => {
            if(user) {
                // User with this username already exists
                errors.push("Account already has a group - if it enters here something is effed");
                // -----------------------------------------------------DISPLAY HOW WE WANT TO ----------------------
                console.log(errors);
                res.send("Account already has a group - if it enters here something is effed");
            } else {
                //create head before group save
                for(const user of groupInfo.members) { // inform members theyve joined the group
                    user["completed"] = false;
                }

                initialHead = Math.floor(getRandomInt(0, groupInfo.members.length));
                const newGroup = new groupModel({
                    houseName: req.user["houseName"],
                    members: groupInfo.members,
                    chores: groupInfo.chores,
                    head: initialHead
                });
                
                newGroup.save()
                .then(() => {              
                    let from = '+18162562790'
                    
                    for(const user of groupInfo.members) { // inform members theyve joined the group
                        let to = user["number"];
                        freeclimb.api.messages.create(from, to, 'Hey ' + user["name"] + '! You have joined the household ' + req.user["houseName"] + '!')
                        .catch(err => console.log(err))
                    }

                    setInterval(() => {
                        groupModel.findOne({ houseName: req.user["houseName"] })
                        .then((group) => {
                            if(group) {
                                console.log("Sending out chores...");
                                const accountId = 'AC6fd1d1c6d22f8904aa7a70985f5ba104b79ef7e4';
                                const apiKey = '4b225058cdaba2c6acb36c048a3df9e520fb98b5';
                                const freeclimb = freeclimbSDK(accountId, apiKey);

                                let from = '+18162562790'
                                member = 0

                                while(member < group.members.length) {
                                    let to = group.members[member]["number"];

                                    let chorePos = group.head + member;

                                    if(chorePos >= group.members.length) {
                                        chorePos = chorePos % group.members.length;
                                    }
                                    
                                    var chores = group.chores[chorePos];

                                    freeclimb.api.messages.create(from, to, 'Hey ' + group.members[member]["name"] + '! Your chores for the week are:\n' + chores)
                                    .catch(err => console.log(err))

                                    member++;
                                }
                            } else {
                                console.log("Couldnt find group");
                            }
                        })
                    }, 5000)

                    setInterval(() => {
                        console.log("Updating head...");
                        groupModel.findOne({ houseName: req.user["houseName"] })
                        .then((group) => {
                            let newHead = group.head + 1;

                            if(newHead >= group.members.length) {
                                newHead = newHead % group.members.length;
                            }
                            
                            groupModel.findOneAndUpdate({ houseName: group.houseName }, { head: newHead }, { new: true }, (err, group) => {
                                // Handle any possible database errors
                                if (err) 
                                    return res.status(500).send(err);

                                //return res.send(group);
                            })
                        });
                    }, 3000)
                    
                    res.sendStatus(200)
                }).catch((err) => console.log(err))
            }
        })
    }
})

app.get("/sendChores", (req, res) => {
    groupModel.findOne({ houseName: req.user["houseName"] })
    .then((group) => {
        if(group) {
            console.log("Sending out chores...");
            const accountId = 'AC6fd1d1c6d22f8904aa7a70985f5ba104b79ef7e4';
            const apiKey = '4b225058cdaba2c6acb36c048a3df9e520fb98b5';
            const freeclimb = freeclimbSDK(accountId, apiKey);

            let from = '+18162562790'
            member = 0

            while(member < group.members.length) {
                let to = group.members[member]["number"];

                let chorePos = group.head + member;

                if(chorePos >= group.members.length) {
                    chorePos = chorePos % group.members.length;
                }
                
                var chores = group.chores[chorePos];

                freeclimb.api.messages.create(from, to, 'Hey ' + group.members[member]["name"] + '! Your chores for the week are:\n' + chores)
                .catch(err => console.log(err))

                member++;
            }
        } else {
            console.log("Couldnt find group");
        }
        res.sendStatus(200);
    })
});

app.put("/updateHead", (req, res) => {
    console.log("Updating head...");
    groupModel.findOne({ houseName: req.user["houseName"] })
    .then((group) => {
        let newHead = group.head + 1;

        if(newHead >= group.members.length) {
            newHead = newHead % group.members.length;
        }
        
        groupModel.findOneAndUpdate({ houseName: group.houseName }, { head: newHead }, { new: true }, (err, group) => {
            // Handle any possible database errors
            if (err) 
                return res.status(500).send(err);
            
                console.log("testing");

           return res.send(group);
        })
    });
});
  
module.exports = app;