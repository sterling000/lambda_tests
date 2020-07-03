// stubs
const stubs = require('./stubs');

// mocks
const getValidMockUser = () => {
    return stubs.userData;
};

const getMissingMockUser = () => {
    return {};
};

jest.mock('node-fetch', () => {
    const stubs = require('./stubs')
    const generateResolvedResponse = () => {
        return {
            status: 200,
            json: () => ({results: stubs.userData.Item.decks})
        };
    };

    const generateRejectedResponse = () => {
        return {
            status: 401
        };
    };

    return jest
        .fn()
        .mockResolvedValueOnce(generateResolvedResponse())
        .mockRejectedValueOnce(generateRejectedResponse);
});

// target code for tests
const { handler } = require('./index.js');

// tests
describe('handler', () => {
    test('the handler function should work',async () => {
        jest.resetModules();
        jest.doMock('aws-sdk', () => {
            return {
                ...jest.requireActual("aws-sdk"),
                DynamoDB: {
                    DocumentClient: jest.fn(() => ({get: () => ({promise: getValidMockUser})}))
                }
            }
        });
        const response = await handler({pathParameters:{id:'Wildcard'}}, {});
        expect(response.body).toBeDefined();
        expect(response.statusCode).toBeDefined();
    });

    test('the response should be successful', async () => {
        jest.resetModules();
        jest.doMock('aws-sdk', () => {
            return {
                ...jest.requireActual("aws-sdk"),
                DynamoDB: {
                    DocumentClient: jest.fn(() => ({get: () => ({promise: getValidMockUser})}))
                }
            }
        });
        const response = await handler({pathParameters:{id:'Wildcard'}}, {});
        expect(response.statusCode).toEqual(200);
    });

    test('the db\'s get should throw an error', async () => {
        jest.resetModules();
        jest.doMock('aws-sdk', () => {
            return {
                ...jest.requireActual("aws-sdk"),
                DynamoDB: {
                    DocumentClient: jest.fn(() => ({get: () => ({promise: jest.fn().mockRejectedValueOnce(() => {return Promise.reject({})})})}))
                }
            }
        });

        

        const response = await handler({pathParameters:{id:'Wildcard'}}, {});
        expect(response.statusCode).toEqual(400);
    });

    test('the response body should match the snapshot', async () => {
        jest.resetModules();
        jest.doMock('aws-sdk', () => {
            return {
                ...jest.requireActual("aws-sdk"),
                DynamoDB: {
                    DocumentClient: jest.fn(() => ({get: () => ({promise: getValidMockUser})}))
                }
            }
        });
        const response = await handler({pathParameters:{id:'Wildcard'}}, {});
        expect(response.statusCode).toEqual(200);
        const body = JSON.parse(response.body);
        expect(body.decks).toMatchSnapshot();
    });

    test('the db was missing the user, fetch should succeed', async () => {
        jest.resetModules();
        jest.doMock('aws-sdk', () => {
            return {
                ...jest.requireActual('aws-sdk'),
                DynamoDB: {
                    DocumentClient: jest.fn(() => ({
                        get: () => ({promise: getMissingMockUser}),
                        put: () => ({promise: jest.fn().mockImplementation(() => {return Promise.resolve({})})
                    }),  
                }))
                }
            }            
        });
        
        const response = await handler({pathParameters:{id:'Wildcard'}}, {});
        expect(response.statusCode).toEqual(202);
        const body = JSON.parse(response.body);
        expect(body.decks).toMatchSnapshot();
    });

    test('the db was missing the user and threw an error when we tried to write a new one to it.', async () => {
        jest.resetModules();
        jest.doMock('aws-sdk', () => {
            return {
                ...jest.requireActual('aws-sdk'),
                DynamoDB: {
                    DocumentClient: jest.fn(() => ({
                        get: () => ({promise: getMissingMockUser}),
                        put: () => ({promise: jest.fn().mockImplementation(() => {return Promise.reject({})})
                    }),  
                }))
                }
            }            
        });
        
        const response = await handler({pathParameters:{id:'Wildcard'}}, {});
        expect(response.statusCode).toEqual(401);
    });

    test('the db was missing the user and archidekt failed', async () => {
        jest.resetModules();
        jest.doMock('aws-sdk', () => {
            return {
                ...jest.requireActual('aws-sdk'),
                DynamoDB: {
                    DocumentClient: jest.fn(() => ({
                        get: () => ({promise: getMissingMockUser}),
                        put: () => ({promise: jest.fn()})
                    })),  
                }
            }
        });
        jest.doMock('node-fetch', ()=> {
            return {
                ...jest.requireActual('node-fetch'),
                fetch: () => ({promise: (() => {return Promise.reject({})})})
            }
        });
        const response = await handler({pathParameters:{id:'Wildcard'}}, {});
        expect(response.statusCode).toEqual(401);
    });

    // test('the db was missing the user and our fetch promise failed', async () => {
    //     jest.resetModules();
    //     jest.doMock('aws-sdk', () => {
    //         return {
    //             ...jest.requireActual('aws-sdk'),
    //             DynamoDB: {
    //                 DocumentClient: jest.fn(() => ({
    //                     get: () => ({promise: getMissingMockUser}),
    //                     put: () => ({promise: jest.fn()})
    //                 })),  
    //             }
    //         }
    //     });
        
    //     handler.fetchDecks = jest.fn().mockRejectedValueOnce(new Error('mocked error'));

    //     const response = await handler({pathParameters:{id:'Wildcard'}}, {});
    //     expect(response.statusCode).toEqual(402); 
    // });
});