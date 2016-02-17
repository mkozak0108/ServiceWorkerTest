(function () {
  var SCRIPTS_PATH = { //to do: change pathes dynamically according to environment
      browser_services: 'browser_services.js',
      service_worker: 'service_worker.js'
    },

    initBrowser = function () {
      runScript(SCRIPTS_PATH.browser_services);
    },

    initWorker = function () {
      fetch(SCRIPTS_PATH.service_worker)
      .then(function (response) {
        return response.text();
      })
      .then(eval)
      .catch(function (error) {
        console.error(error);
      });
    },

    runScript = function (url, callback) {
      ajaxGet(url, function (code) {
        eval(code);

        if (callback) {
          callback();
        }
      });
    },

    ajaxGet = function (url, callback) {
      var xhr = new XMLHttpRequest();
      xhr.withCredentials = true;
      xhr.open('GET', url, true);
      xhr.onload = function () {
        if (xhr.readyState === 4) {
          if (xhr.status === 200) {
            callback(xhr.responseText);
          } else {
            console.error(xhr.statusText);
          }
        }
      };
      xhr.send();
    };

  if (self.window) {
    console.log('We are in browser.');
    initBrowser();
  } else {
    console.log('We are in Service Worker.');
    initWorker();
  }
}());
