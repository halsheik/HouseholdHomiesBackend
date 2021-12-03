const express = require("express");
const groupModel = require("../models/group");
const freeclimbSDK = require('@freeclimb/sdk');
const app = express();

require('dotenv').config();
const accountId = 'ACcabe723dfe4021d7a77923476fa5bd43454d8c3e';
const apiKey = 'f750bdbec90a4febc3aee6a6bbd88f70e8418d37';
const freeclimb = freeclimbSDK(accountId, apiKey);


async function getMessages() {
    // Create array to store all members 
    const messages = []
    // Invoke GET method to retrieve initial list of members information
    const first = await freeclimb.api.messages.getList()
    messages.push(...first.messages)
    // Get Uri for next page
    let nextPageUri = first.nextPageUri
    // Retrieve entire members list 
    while (nextPageUri) {
        const nextPage = await freeclimb.api.messages.getNextPage(nextPageUri)
        messages.push(...nextPage.messages)
        nextPageUri = nextPage.nextPageUri
    }
    return messages
}
