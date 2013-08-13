(function() {

  function $(id) {
    return document.getElementById(id);
  }

  if (typeof Module == 'undefined') Module = {};

  if (typeof Module['setStatus'] == 'undefined') {
    Module['setStatus'] = function (status) {
      $('status').textContent = status;
    };
  }

  if (typeof Module['canvas'] == 'undefined') {
    Module['canvas'] = $('canvas');
  }

  function getLoggerTime() {
    var date = new Date();
    return date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds() + ":" + date.getMilliseconds();
  }

  var MAX_LOG_NUM = 20;

  function log(msg) {
    var parent = $('log');
    if (parent.childNodes.length > MAX_LOG_NUM) {
      parent.removeChild(parent.childNodes[0]);
    }

    if (typeof msg == 'string') {
      var logElem = document.createElement('div');
      logElem.textContent = getLoggerTime() + ": " + msg;
      parent.appendChild(logElem);
    } else {
      parent.appendChild(msg);
    }
  }

  function clearLog() {
    $('log').textContent = '';
  }

  if (!Module['_main']) Module['_main'] = function() {
    var im_open_decoder = Module.cwrap('im_open_decoder', 'number', ['string', 'string']);
    var im_reset_search = Module.cwrap('im_reset_search', '', []);
    var im_search = Module.cwrap('im_search', 'number', ['string', 'number']);
    var im_get_candidate = Module.cwrap('im_get_candidate', 'string', ['number', 'string', 'number']);
    var im_get_candidate_utf8 = Module.cwrap('im_get_candidate_utf8', 'string', ['number']);
    var im_get_predicts = Module.cwrap('im_get_predicts_utf8', 'number', ['string']);
    var im_get_predict_at = Module.cwrap('im_get_predict_at', 'string', ['number']);
    var im_choose = Module.cwrap('im_choose', '', ['number']);
    var im_flush_cache = Module.cwrap('im_flush_cache', '', []);

    log('Data file is ready');
    log('Opening data/dict.data ....');
    if (im_open_decoder('data/dict.data', 'data/user_dict.data')) {
      log('Success to open data/dict.data!');
    } else {
      log('Failed to open data/dict.data!');
    }

    var keywords = [];
    $('test').onclick = function() {
      currentIdx = 0;
      keywords = $('pinyin').value.trim().split(' ');
      testNextKeyword();
    };

    $('getCandidates').onclick = function() {
      im_reset_search();
      var keyword = $('pinyin').value.trim();
      var size = im_search(keyword, keyword.length);
      printCandidates(size);
    };

    document.getElementById('get_predicts').onclick = function() {
      getPredicts(document.getElementById('pinyin').value.trim());
    };

    $('clear_log').onclick = clearLog;

    var TIMES = 100;

    function testNextKeyword() {
      window.setTimeout(function() {
        var keyword = keywords.shift();
        if (!keyword) {
          return;
        }
        test(keyword);
        testNextKeyword();
      }, 0);
    }

    function printCandidates(size) {
      var candidates = document.createElement('div');
      for (var i = 0; i < size; i++) {
        var candidate = document.createElement('a');
        candidate.href = "javascript:void(0);"
        candidate.style.marginRight = '5px';
        var str = im_get_candidate_utf8(i);
        candidate.textContent = str;
        candidates.appendChild(candidate);

        candidate.dataset.value = str;
        candidate.dataset.id = i;
        candidate.onclick = function() {
          var nextSize = im_choose(this.dataset.id);
          clearLog();
          printCandidates(nextSize);

          // nextSize equals 1 means we finished candidates selection.
          if (nextSize == 1) {
            im_flush_cache();
            Module['saveFileToDB']('data/user_dict.data', function(success) {
              alert('Saved user dict: ' + success);
            });
          }
        };
      }

      log(size + ' candidates: ')
      log(candidates);
    }

    function getPredicts(key) {
      var n = im_get_predicts(key);
      log('Get ' + n + ' predicts for "' + key + '": ');

      var predicts = [];
      for (var i = 0; i < n; i++) {
        predicts.push(im_get_predict_at(i));
      }

      log(predicts.join(' '));
    }

    window.test = function (keyword) {
      try {
        var times = parseInt($('times').value);
        log('search ' + times + ' times keyword "' + keyword + '"');

        var startTime = new Date().getTime();
        var size = 0;

        for (var i = 0; i < times; i++) {
          im_reset_search();
          size = im_search(keyword, keyword.length);
        }

        var endTime = new Date().getTime();

        log('got ' + size + ' candidates, cost ' + (endTime - startTime) + ' milliseconds.');
      } catch (e) {
        log('error: ' + e);
      }
    };
  }

})();

