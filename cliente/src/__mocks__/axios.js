// Manual mock para axios para evitar problemas con la versión ESM en node_modules durante Jest
const mockAxios = {
    post: jest.fn(() => Promise.resolve({ data: {} })),
    get: jest.fn(() => Promise.resolve({ data: {} })),
    create: function () { return this; }
};

module.exports = mockAxios;
