(function () {
  const MESSAGE_PATH = 'http://localhost:5000/message';

  var link;

  self.addEventListener('install', function (event) {
    console.log('Installed', event);
  });
  self.addEventListener('activate', function (event) {
    console.log('Activated', event);
  });
  self.addEventListener('push', function (event) {
    var path = endpoint => `${MESSAGE_PATH}/${encodeURIComponent(location.host)}/${encodeURIComponent(endpoint)}`;
    self.registration.pushManager.getSubscription()
      .then(subcription => fetch(path(subcription.endpoint)))
      .then(resp => resp.json())
      .then(data => {
        link = data.link;
        event.waitUntil(self.registration.showNotification(data.title, {
          body: data.message,
          icon: data.picture,
          tag: 'push-responder'
        }));
      });
  });

  self.onnotificationclick = function (event) {
    event.notification.close();
    if (clients.openWindow) {
      return clients.openWindow(link);
    }
  };
})();
