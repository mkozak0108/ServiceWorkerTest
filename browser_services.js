(function () {
  window.PushResponder.getRegisteredUser = function (callback) {
    console.log('Checking if user is already registered.');
    const DB_NAME = 'PushResponder',
      DB_VERSION = 8,
      DB_STORE_NAME = 'clients';

    var db, connectionRequest,
      scope = location.host;

    connectionRequest = indexedDB.open(DB_NAME, DB_VERSION);

    connectionRequest.onsuccess = function () {
      db = this.result;

      var transaction = db.transaction([DB_STORE_NAME], 'readonly'),
        store = transaction.objectStore(DB_STORE_NAME),
        request = store.get(scope);

      request.onsuccess = function () {
        if (this.result) {
          console.log('Found a user for this scope: ' + this.result.id);
          callback(this.result);
        } else {
          console.log('Any records for this scope were not found.');
          callback(false);
        }
      };

      request.onerror = function () {
        console.log('Failed to get records from database.');
        callback(false);
      };
    };
    connectionRequest.onupgradeneeded = function (event) {
      event.target.transaction.abort();
      console.log('Database doesn\'t exist.');
    };
    connectionRequest.onerror = function () {
      console.log('Failed to connect to database.');
      callback(false);
    };
  };
})();

(function () {
  window.PushResponder.getRegisteredUser(function (user) {
    if (!(user && user.id)) {
      console.log('Need to show banner.');
      var pushResponderBanner = new PushResponderBanner(window.PushResponder.params);
      pushResponderBanner.start();
    }
  });

  const BANNER_STYLE = '<style> #push-responder-banner {border: 1px solid #000; display:none; cursor: pointer; width: 400px; height: 200px; position: fixed; top: 0; right: 0; z-index: 10000} </style>';

  function PushResponderBanner(params) {
    this.timeout = params.timeout || 0;
    this.message = params.message;
    this.position = params.position || 0;
    this.banner = document.createElement('div');
    var that = this;

    initBanner();

    function initBanner() {
      that.banner.setAttribute('id', 'push-responder-banner');
      that.banner.innerHTML = BANNER_STYLE + that.message;
      that.banner.onclick = function () {
        that.hide();
        window.PushResponder.registerServiceWorker();
      };
      document.body.appendChild(that.banner);
    }

    this.start = function () {
      console.log('Showing banner.');
      setTimeout(function () {
        that.show();
      }, that.timeout);
    };

    this.show = function () {
      that.banner.setAttribute('style', 'display: block');
    };

    this.hide = function () {
      that.banner.setAttribute('style', 'display: none');
    };
  }
})();

(function () {

}());

(function () {
  window.PushResponder.getRegisteredUser(function (user) {
    if (user && user.id) {
      window.PushResponder.registerServiceWorker();
    }
  });

  window.PushResponder.registerServiceWorker = function () {
    registerServiceWorker()
    .then(connectToDb)
    .then(processData)
    .then(function (subscription) {
      console.log(subscription);
    })
    .catch(function (error) {
      console.error(error);
    });
  };

  const SUBSCRIPTIONS_URL = 'http://localhost:5000/subscription',
    DB_NAME = 'PushResponder',
    DB_VERSION = 8,
    DB_STORE_NAME = 'clients',
    PATH_TO_WORKER = './load_manager.js';

  var scope, endpoint;

  function registerServiceWorker() {
    return new Promise(function (resolve, reject) {
      navigator.serviceWorker.register(PATH_TO_WORKER).then(function () {
        console.log('Successfully registered a ServiceWorker.');
        navigator.serviceWorker.ready.then(function (registration) {
          registration.pushManager.subscribe({
            userVisibleOnly: true
          }).then(function (subscription) {
            scope = location.host;
            endpoint = subscription.endpoint;
            resolve();
          }).catch(reject);
        });
      }).catch(reject);
    });
  }

  function connectToDb() {
    return new Promise(function (resolve, reject) {
      var db, request;

      request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = reject;
      request.onsuccess = function () {
        console.log('Successfully connected to the database.');
        db = this.result;
        resolve(db);
      };
      request.onupgradeneeded = function (event) {
        var store;
        db = event.currentTarget.result;

        if (event.oldVersion > 0) {
          console.log('Database needs an upgrade. Upgrading...');
          db.deleteObjectStore(DB_STORE_NAME);
        } else {
          console.log('Creating the database...');
        }

        store = db.createObjectStore(DB_STORE_NAME, { keyPath: 'scope' });

        store.createIndex('id', 'id');
        store.createIndex('scope', 'scope');
        store.createIndex('endpoint', 'endpoint');

        store.transaction.oncomplete = function () {
          console.log('Successfully upgraded the database.');
          resolve(db);
        };
      };
    });
  }

  function processData(db) {
    return new Promise(function (resolve, reject) {
      var transaction, store, request;

      transaction = db.transaction([DB_STORE_NAME], 'readonly');
      store = transaction.objectStore(DB_STORE_NAME);
      request = store.get(scope);

      request.onsuccess = function () {
        var currentSubscription = this.result;
        if (currentSubscription) { //if the record exists maybe we need to update the endpoint
          if (currentSubscription.endpoint !== endpoint) {
            resolve(updateSubscription({
              id: currentSubscription.id,
              scope: currentSubscription.scope,
              endpoint: endpoint
            }));
          } else {
            console.log('The endpoint in the database is up-to-date.');
            resolve(currentSubscription);
          }
        } else { //if the record doesn't exist we just create it
          resolve(createSubscription({
            scope: scope,
            endpoint: endpoint
          }));
        }
      };

      request.onerror = reject;
    });

    function createSubscription(data) {
      return new Promise(function (resolve, reject) {
        console.log('Sending data to broker.');
        fetch(
          SUBSCRIPTIONS_URL,
          {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
          }
        )
        .then(response => response.json())
        .then(function (subscription) {
          console.log('Creating a new record in the database.');
          var transaction, store, request;

          transaction = db.transaction([DB_STORE_NAME], 'readwrite');
          store = transaction.objectStore(DB_STORE_NAME);

          request = store.add(subscription);
          request.onsuccess = function () {
            console.log('Created.');
            resolve(subscription);
          };
          request.onerror = reject;
        })
        .catch(reject);
      });
    }

    function updateSubscription(data) {
      return new Promise(function (resolve, reject) {
        console.log('Updating data on broker.');
        fetch(
          `${SUBSCRIPTIONS_URL}/${data.id}`,
          {
            method: 'PUT',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
          }
        )
        .then(response => response.json())
        .then(function (subscription) {
          var transaction, store, request;

          transaction = db.transaction([DB_STORE_NAME], 'readwrite');
          store = transaction.objectStore(DB_STORE_NAME);

          console.log('Updating endpoint in database.');

          request = store.put(subscription);
          request.onerror = reject;
          request.onsuccess = function () {
            console.log('Updated.');
            resolve(subscription);
          };
        }).catch(reject);
      });
    }
  }
})();
