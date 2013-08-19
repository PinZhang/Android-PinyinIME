/* -*- Mode: js; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- /
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */

(function() {
  if (typeof Module == 'undefined') Module = {};
  if (!Module['preRun']) Module['preRun'] = [];

  function getLoggerTime() {
    var date = new Date();
    return date.getHours() + ':' + date.getMinutes() +
           ':' + date.getSeconds() + ':' + date.getMilliseconds();
  }

  function log(msg) {
    var parent = document.getElementById('log');
    if (parent.childNodes.length > 200) {
      parent.removeChild(parent.childNodes[0]);
    }

    if (typeof msg == 'string') {
      var logElem = document.createElement('div');
      logElem.textContent = getLoggerTime() + ': ' + msg;
      parent.appendChild(logElem);
    } else {
      parent.appendChild(msg);
    }
  }

  Module['preRun'].push(function() {
    Module['addRunDependency']('fp data/user_dict.data');

    function removeRunDependency() {
      Module['removeRunDependency']('fp data/user_dict.data');
    }

    // Load user.dict from IndexedDB
    var indexedDB = window.indexedDB;
    var dbVersion = 1;
    var STORE_NAME = 'files';
    var USER_DICT = 'user_dict';
    var db;

    var request = indexedDB.open('EmpinyinDatabase', dbVersion);

    request.onerror = function opendb_onerror(event) {
      log('Error occurs when openning database: ' + event.target.errorCode);
    };

    request.onsuccess = function opendb_onsuccess(event) {
      db = event.target.result;
      readUserDictFileFromDB();
    };

    request.onupgradeneeded = function opendb_onupgradeneeded(event) {
      db = event.target.result;

      // delete the old ObjectStore if present
      if (db.objectStoreNames.length !== 0) {
        db.deleteObjectStore(STORE_NAME);
      }

      // create ObjectStore
      db.createObjectStore(STORE_NAME, { keyPath: 'name' });
    };

    function readUserDictFileFromDB() {
      var request = db.transaction([STORE_NAME], 'readonly')
                      .objectStore(STORE_NAME).get(USER_DICT);

      request.onsuccess = function readdb_oncomplete(event) {
        if (!event.target.result) {
          // Create an empty file if it doesn't exist.
          var request = saveFileToDB(USER_DICT, []);
          request.onsuccess = readUserDictFileFromDB;
          request.onerror = removeRunDependency;
          return;
        }

        // Got the blob object of user dict, write it to FS
        var byteArray = event.target.result.content;

        // Write user dict data into FS
        Module['FS_createPreloadedFile']('/data', 'user_dict.data',
                                         byteArray, true, true, function() {
          removeRunDependency();
        });
      };

      request.onerror = function readdb_oncomplete(event) {
        log('error to get file: ' + event.target.result.name);
        removeRunDependency();
      };
    }

    function saveFileToDB(name, byteArray) {
      var obj = {
        name: name,
        content: byteArray
      };

      return db.transaction([STORE_NAME], 'readwrite')
               .objectStore(STORE_NAME).put(obj);
    }

    if (!Module['saveUserDictFileToDB']) {
      Module['saveUserDictFileToDB'] = function(name, callback) {
        if (!FS) {
          log('No FS is Found');
          return null;
        }

        return saveFileToDB(USER_DICT,
                            FS.findObject(name).contents,
                            callback);
      };
    }
  });
})();

