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
    const generateResponse = () => {
        return {
            status: 200,
            json: () => ({results: stubs.userData.Item.decks})
        };
    };

    return jest
        .fn()
        .mockResolvedValue(generateResponse());
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

    test('the db was missing the user', async () => {
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
                fetch: () => ({promise: getMissingMockUser})
            }
        });
        const response = await handler({pathParameters:{id:'Wildcard'}}, {});
        expect(response.statusCode).toEqual(202);
        const body = JSON.parse(response.body);
        expect(body.decks).toMatchSnapshot();
    });
});