'use strict'
const ttl = 60*60*24; // 24 hours
exports.handler = async (event, context) => {
    const AWS = require('aws-sdk');
    AWS.config.update({region: 'us-west-2'});
    const documentClient = new AWS.DynamoDB.DocumentClient({region: "us-west-2"});
    const {id, decks, expiresAt} = JSON.parse(event.body);
    const params = {
        TableName: "Users",
        Item: {
            decks: decks,
            expiresAt: Math.floor(new Date().getTime()/1000.0 + ttl),
            id: id
        }
    }
    
    let statusCode = 0;
    let responseBody = '';
    try {
        await documentClient.put(params).promise();
        statusCode = 200;
    } catch (error) {
        responseBody = error;
        statusCode = 400;
    }

    const response = {
        statusCode: statusCode,
        body: responseBody
    }

    return response;
}