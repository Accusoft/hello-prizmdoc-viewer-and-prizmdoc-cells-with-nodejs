const express = require('express');
const router = express.Router();
const joinPath = require('path').join;
const fs = require('fs');
const promisify = require('util').promisify;
const readFile = promisify(fs.readFile);
const pas = require('../pas/pasRequest');
const cellsServer = require('../cellsServer/cellsServerRequest');

router.get('/', async (req, res /*, next*/) => {
  createPrizmDocViewerSession('example.pdf', function (viewingSessionId) {
    res.render('index', {
      viewingSessionId
    });
  });
});

router.get('/documentSession', async (req, res /*, next*/) => {
  const filename = req.query.filename || 'example.pdf';

  if (filename.toLowerCase().endsWith('.xlsx')) {
    createPrizmDocCellsSession(filename, function (sessionId) {
      res.json({
        isForCells: true,
        sessionId: sessionId
      });
    });
  } else {
    createPrizmDocViewerSession(filename, function (viewingSessionId) {
      res.json({
        isForViewer: true,
        viewingSessionId
      });
    });
  }
});

async function createPrizmDocViewerSession(filename, sendSessionToBrowser) {
  let prizmdocResponse;

  // 1. Create a new viewing session.
  prizmdocResponse = await pas.post('/ViewingSession', {
    json: {
      source: {
        type: 'upload',
        displayName: filename
      }
    }
  });
  const viewingSessionId = prizmdocResponse.body.viewingSessionId;

  // 2. Send the viewingSessionId to the browser right away so the viewer UI can start loading.
  sendSessionToBrowser(viewingSessionId);

  // 3. Upload the source document to PrizmDoc so that it can start being converted to SVG.
  //    The viewer will request this content and receive it automatically once it is ready.
  prizmdocResponse = await pas.put(`/ViewingSession/u${viewingSessionId}/SourceFile`, {
    body: await(readFileFromDocumentsDirectory(filename))
  });
}

async function createPrizmDocCellsSession(filename, sendSessionToBrowser) {
  let cellsServerResponse;

  // 1. Upload the workbook (XLSX file). This only needs to be done once.
  cellsServerResponse = await cellsServer.post('/api/v1/workbooks', {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      filename: filename
    },
    body: await(readFileFromDocumentsDirectory(filename))
  });

  const body = JSON.parse(cellsServerResponse.body);

  // 2. Create a session for an end user to view the workbook.
  cellsServerResponse = await cellsServer.post('/api/v1/sessions', {
    json: {
      workbookId: body.workbookId,
      user: {
        uniqueId: 'some-test-user',
        displayName: 'Test User',
        initials: 'TU'
      }
    }
  });

  // 3. Send the sessionId to the browser to initialize the Workbook Control with it.
  sendSessionToBrowser(cellsServerResponse.body.sessionId);
}

// Util function to read a document from the documents directory
async function readFileFromDocumentsDirectory(filename) {
  return readFile(joinPath(__dirname, '..', 'documents', filename));
}

module.exports = router;
