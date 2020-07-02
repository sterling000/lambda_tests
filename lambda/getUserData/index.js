'use strict'
const fetch = require('node-fetch');

const utils = require('/opt/nodejs/utils');

exports.handler = async (event, context) => {
    const AWS = require('aws-sdk');
    AWS.config.update({region: 'us-west-2'});
    const documentClient = new AWS.DynamoDB.DocumentClient({region: "us-west-2"});
    const {id} = event.pathParameters;
    const params = {
        TableName: "Users",
        Key: {
            id: id,
        }
    };

    let statusCode = 0;
    let body = '';
    
    try {
        const data = await documentClient.get(params).promise();
        if(utils.isEmpty(data)){
            try {
                const fetchResponse = await fetchDecks(id, documentClient);
                statusCode = fetchResponse.statusCode;
                body = fetchResponse.body;
            } catch (error) {
                statusCode = 402;
                body = "Error with fetchDecksPromise. => " + error;
            }
        }
        else{
            statusCode = 200;
            body = JSON.stringify(data.Item)
        }
    } catch (error) {
        statusCode = 400,
        body = "Error getting user from database. => " + error;
    }

    const response = {
        statusCode: statusCode,
        body: body
    }

    return response;
}

async function fetchDecks(id, documentClient) {
    let statusCode = 0;
    let body = '';

    try {
        const archidektData = await fetchUserData(id);
        if (archidektData.statusCode == 200) {
            const ttl = 60 * 60 * 24; // 24 hours
            const params = {
                TableName: "Users",
                Item: {
                    decks: archidektData.body,
                    expiresAt: Math.floor(new Date().getTime() / 1000.0 + ttl),
                    id: id
                }
            };
            statusCode = 201;
            try {
                await documentClient.put(params).promise();
                statusCode = 202;
                body = JSON.stringify(params.Item);
            }
            catch (error) {
                statusCode = 402;
                body = "Error adding new user to database => " + error;
            }
        }
        else{
            statusCode = archidektData.statusCode;
            body = archidektData.body;
        }
    } catch (error) {
        statusCode = 401;
        body = "Error getting user from archidekt. => " + error;
    }

    return {
        statusCode: statusCode,
        body: body
    }
}

async function fetchUserData(username){
    let statusCode = 0;
    let body = {};

    try {
        const response = await fetch(`http://archidekt.com/api/decks/cards/?orderBy=-createdAt&owner=${username}&ownerexact=true&pageSize=50`);
        statusCode = response.status;
        const fetchBody = await response.json();
        const {results} = fetchBody;
        const newArray = results.map(function(val){
            const {owner, deckFormat, featured, customFeatured, ...deck} = val;
            return deck;
        });
        body = newArray
    } catch (error) {
        statusCode = 401;
        body = "Error getting user from archidekt. => " + error;
    }

    return { 
        statusCode: statusCode,
        body: body
    };
}