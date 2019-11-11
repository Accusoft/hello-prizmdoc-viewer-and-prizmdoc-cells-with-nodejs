const config = require('../config/loadConfig');

// Configure a request instance for making HTTP calls to PAS
const cellsRequest = require('request-promise').defaults({
  baseUrl: config.cellsServerBaseUrl,
  headers: {
    'acs-api-key': config.apiKey // Inject our API key (for PrizmDoc Cloud)
  },
  resolveWithFullResponse: true
});
cellsRequest.debug = true;

module.exports = cellsRequest;
