const DATA_SERVER = 'https://mkozak0108.github.io/random_json_data/data.json';
var notify = data => {
    registration.showNotification(data.title, {
      data: {
        link: data.link
      },
      body: data.body,
      icon: data.icon,
      tag: 'push'
    });
  },

  pushHandler = () => {
    fetch(DATA_SERVER)
      .then(resp => resp.json())
      .then(notify)
      .catch(err => console.error(err))
  },

  notificationClickHandler = event => {
    event.notification.close();
    event.waitUntil(clients.matchAll({
        type: "window"
      }).then(() => {
        if (clients.openWindow) {
          return clients.openWindow(event.notification.data.link);
        }
      }).catch(err => console.error(err))
    )
  };

addEventListener('push', pushHandler);
addEventListener('notificationclick', notificationClickHandler);
