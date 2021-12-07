const express = require("express");
const groupModel = require("../models/group");
const freeclimbSDK = require('@freeclimb/sdk');
var util = require('util');
const Group = require("../models/group");
const app = express();

require('dotenv').config();
const accountId = 'ACcabe723dfe4021d7a77923476fa5bd43454d8c3e';
const apiKey = 'f750bdbec90a4febc3aee6a6bbd88f70e8418d37';
const freeclimb = freeclimbSDK(accountId, apiKey);



app.post('/incomingSms', (req, res) => {
    
    console.log(util.inspect(req));

    //your Verified Number
    let from = '+18333412057' //your FreeClimb Number
    let to=req.body.from;
    let split_text = req.body.text.split(' ')

    //nonOrganizer responses
    if(split_text.length === 1){
        if(req.body.text === "Yes" || req.body.text === "yes"|| req.body.text === "Y" || req.body.text === "y"){
            freeclimb.api.messages.create(from, to, 'Thank you for completing your chores for the week, the organizer will check them and we will let you know!').catch(err => {console.log(err)})
            notifyHead(req.body.from);
        }
        else if (req.body.text === "No" || req.body.text === "no"|| req.body.text === "N" || req.body.text === "n"){
        }
        else{
            freeclimb.api.messages.create(from, to, 'Unknown input, please respond with Y or N').catch(err => {console.log(err)});
        }
    } 
    //organizer Responses
    else if(split_text.length === 2){ // split the message into separate words if 2 words continue
        console.log(split_text[0])
        console.log(split_text[1])
        confirmChores(to, split_text[0].toLowerCase(), split_text[1]);
    }
    else{
        freeclimb.api.messages.create(from, to, 'Unknown input').catch(err => {console.log(err)});
    }
    
   
  });

function confirmChores(head, check, confirm){
    groupModel.findOne({ "members.number": head  })
      .then((group) => {
          if(group) {
              console.log("I have found the group")
              console.log((check.charCodeAt(0)-'a'.charCodeAt(0)));
              console.log(check.length);
            if((check.length === 1) && ((check.charCodeAt(0)-'a'.charCodeAt(0)) < group.members.length)){
                // get the person corresponding to a-e
                let person_to_check = 0;
                let find_index_of_person = -1;
                // head@1 find=2 check=1
                for(let i =0; i < group.members.length; i++){
                    if(i != group.head){
                        find_index_of_person++;
                    }
                    if(find_index_of_person === (check.charAt(0)-'a')){
                        person_to_check=i;
                        break;
                    }
                }
                
                let to=group.members[person_to_check].number;
                console.log("about to check completion")
                // check completion
                if(confirm === "1") //the organizer is confirming the chore is completed 
                {
                    console.log("we are in 1")
                    group.members[person_to_check].completed = true;
                    group.save();
                    group.markModified('members');
                    // var stringtocheck='members[' + person_to_check + '].completed';
                    // groupModel.findOneAndUpdate({ "members.number": head  }, { stringtocheck: true }, { new: true }, (err, group) => {
                    //     // Handle any possible database errors
                    //     if (err) 
                    //         return res.status(500).send(err);

                    //     //return res.send(group);
                    // })
                    console.log("we have passed save")
                    freeclimb.api.messages.create('+18333412057', to, 'Your chore has been marked completed by the organizer!').catch(err => {console.log(err)});
                }
    
                else if(confirm === "2") //the orgnaizer is denying the chore is completed
                {
                    freeclimb.api.messages.create('+18333412057', to, 'Please do your chore better').catch(err => {console.log(err)});
    
                }
                else{
                    freeclimb.api.messages.create('+18333412057', to, 'Unknown input, please respond letter corresponding to person you are checking followed by 1 or 2').catch(err => {console.log(err)});
                }
            }
              
          }
          else{
              console.log("Sadness no group was found");
          }
      })
    
        
}

function notifyHead(notHead){
      groupModel.findOne({ "members.number": notHead  })
      .then((group) => {
          if(group) {
              console.log("Success now doing something with this group");
              console.log(group);
              var to=group.members[group.head].number;
              var index = 0;
              for(let i =0; i < group.members.length; i++){
                if(group.members[i].number === notHead){
                    index = i;
                }
              }
              //we need to search the members array for the name that matches the notHead number and then use that index to also say their chore
              var name=group.members[index].name;
              let chorePos = group.head + index;

              if(chorePos >= group.members.length) {
                chorePos = chorePos % group.members.length;
            }
            
              var chores = group.chores[chorePos];

        
         
            

            

    
              freeclimb.api.messages.create('+18333412057', to, 'Greetings organizer, it looks like ' + name + ' has completed this list of chores: ' + chores).catch(err => {console.log(err)});
              var names = 'Please respond with the letter corresponding to the person you are checking followed by a 1 for complete or a 2 for incomplete. For example, a 1.\n';
              var letter = 97;
              for(let i = 0; i < group.members.length; i++){
                  if(i!=group.head){
                    var m_name = group.members[i].name;
                    var print_name = String.fromCharCode(letter)+") "+ m_name + "\n";
                    names+=print_name;
                    letter++;
                  }
              }
              freeclimb.api.messages.create('+18333412057', to, names).catch(err => {console.log(err)});
              
          }
          else{
              console.log("Sadness no group was found");
          }
      })
}
app.get("/", (req, res) => {
    res.send(req.user); // The req.user stores the entire user that has been authenticated inside of it.
});

app.get("/group", (req, res) => {
    if(req.user) {
        groupModel.findOne({ address: req.user["address"] })
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

    console.log("I have entered create group");

    const accountId = 'ACcabe723dfe4021d7a77923476fa5bd43454d8c3e';
    const apiKey = 'f750bdbec90a4febc3aee6a6bbd88f70e8418d37';
    const freeclimb = freeclimbSDK(accountId, apiKey);
    
    if(req.body.members.length < 2) {
        errors.push("PLEASE ADD AT LEAST TWO MEMBER");
    }

    if(errors.length > 0) {
        // MEANS SOMETHING WENT WRONG -- DECIDE WHAT WE WANT TO DISPLAY/HOW ------------------------------------------
        console.log(errors);
        res.send(errors);
      } else {
        groupModel.findOne({ address: req.user["address"] })
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
                    address: req.user["address"],
                    members: groupInfo.members,
                    chores: groupInfo.chores,
                    head: initialHead
                });
                
                newGroup.save()
                .then(() => {              
                    let from = '+18333412057'
                    
                    console.log("about to send created group text");
                    for(const user of groupInfo.members) { // inform members theyve joined the group
                        let to = user["number"];
                        freeclimb.api.messages.create(from, to, 'Hey ' + user["name"] + '! You have joined the household ' + req.user["address"] + '!')
                        .catch(err => console.log(err))
                    }

                    
                    // setInterval(() => {
                        groupModel.findOne({ address: req.user["address"] })
                        .then((group) => {
                            if(group) {
                                console.log("Sending out chores...");
                                const accountId = 'ACcabe723dfe4021d7a77923476fa5bd43454d8c3e';
                                const apiKey = 'f750bdbec90a4febc3aee6a6bbd88f70e8418d37';
                                const freeclimb = freeclimbSDK(accountId, apiKey);

                                let from = '+18333412057'
                                member = 0

                                while(member < group.members.length) {
                                    let to = group.members[member]["number"];

                                    let chorePos = group.head + member;

                                    if(chorePos >= group.members.length) {
                                        chorePos = chorePos % group.members.length;
                                    }
                                    
                                    var chores = group.chores[chorePos];

                             
                                    freeclimb.api.messages.create(from, to, 'Hey ' + group.members[member]["name"] + '! Your chores for the week are:\n' + chores + " Please respond with a Y or N indicating if you have or haven't completed your chores")
                                    .catch(err => console.log(err))
                                    
                                    
                                    // getMessages().then(messages => {
                                    //     // Use messages
                                    //     console.log(messages)
                                    // }).catch(err => {
                                    //     // Catch Errors
                                    // })
                                    

                                    member++;
                                }
                            } else {
                                console.log("Couldnt find group");
                            }

                            
                        //send chores text again(already handled)
                        //send FINAL TEXT (remind all your housemates to do their chores)
                        
                            var d = new Date();
                            if(d.getDay()===0){ //if it becomes sunday
                                //then update head
                                console.log("Updating head...");
                                groupModel.findOne({ address: req.user["address"] })
                                .then((group) => {
                                    let newHead = group.head + 1;

                                    if(newHead >= group.members.length) {
                                        newHead = newHead % group.members.length;
                                    }
                                    
                                    groupModel.findOneAndUpdate({ address: group.address }, { head: newHead }, { new: true }, (err, group) => {
                                        // Handle any possible database errors
                                        if (err) 
                                            return res.status(500).send(err);

                                        //return res.send(group);
                                    })
                                });
                            }
                            

                        })

                        
                    // }, 86400000)

                    
                    res.sendStatus(200)
                }).catch((err) => console.log(err))
            }
        })
    }
})

app.get("/sendChores", (req, res) => {
    groupModel.findOne({ address: req.user["address"] })
    .then((group) => {
        if(group) {
            console.log("Sending out chores...");
            const accountId = 'ACcabe723dfe4021d7a77923476fa5bd43454d8c3e';
            const apiKey = 'f750bdbec90a4febc3aee6a6bbd88f70e8418d37';
            const freeclimb = freeclimbSDK(accountId, apiKey);

            let from = '+18333412057'
            member = 0

            while(member < group.members.length) {
                let to = group.members[member]["number"];

                let chorePos = group.head + member;

                if(chorePos >= group.members.length) {
                    chorePos = chorePos % group.members.length;
                }
                
                var chores = group.chores[chorePos];

                freeclimb.api.messages.create(from, to, 'Hey ' + group.members[member]["name"] + '! Your chores for the week are:\n' + chores + " Please respond with a Yes or No indicating if they have been completed")
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
    groupModel.findOne({ address: req.user["address"] })
    .then((group) => {
        let newHead = group.head + 1;

        if(newHead >= group.members.length) {
            newHead = newHead % group.members.length;
        }
        
        groupModel.findOneAndUpdate({ address: group.address }, { head: newHead }, { new: true }, (err, group) => {
            // Handle any possible database errors
            if (err) 
                return res.status(500).send(err);
            
                console.log("testing");

           return res.send(group);
        })
    });
});

module.exports = app;