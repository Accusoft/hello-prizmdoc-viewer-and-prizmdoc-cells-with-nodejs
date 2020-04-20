// Proxy which allows the WorkbookControl to send requests through this web application back to PrizmDoc Cells.
const httpProxyMiddleware = require('http-proxy-middleware');

function createProxyRouteToCellsServer(path, cellsServerBaseUrl, apiKey) {
  if (cellsServerBaseUrl === undefined) {
    throw new Error('cellsServerBaseUrl argument is required when constructing the proxy route to PrizmDoc Cells');
  }

  if (typeof(cellsServerBaseUrl) !== 'string') {
    throw new Error('cellsServerBaseUrl must be a string');
  }

  if (apiKey !== undefined && typeof(apiKey) !== 'string') {
    throw new Error('When provided, apiKey must be a string');
  }

  let pathRewrite = {};
  pathRewrite['^/cells-server-proxy'] = ''; // remove the proxy path part of the route when forwarding the request
  let headers = {};

  if (apiKey !== undefined) {
    headers['acs-api-key'] = apiKey;
  }

  return httpProxyMiddleware(path, {
    pathRewrite: pathRewrite,
    target: cellsServerBaseUrl,
    changeOrigin: true, // necessary when converting from HTTP to HTTPS
    headers,
    logLevel: 'debug'
  });
}

module.exports = createProxyRouteToCellsServer;
