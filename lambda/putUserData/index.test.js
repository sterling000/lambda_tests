const { handler } = require('./index.js');

const stubs = require('./stubs');
const putMock = jest.fn();
jest.doMock('aws-sdk', () => {
    return {
        ...jest.requireActual("aws-sdk"),
        DynamoDB: {
            DocumentClient: jest.fn(() => ({put: () => ({promise: putMock})}))
        }
    }
});

describe('handler', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('the response should be successful', async () => {
        const response = await handler({body:JSON.stringify(stubs.userData)}, {});
        expect(response.statusCode).toEqual(200);
    });
});