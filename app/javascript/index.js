var subscribe = registration => {
  return registration.pushManager.subscribe({userVisibleOnly: true})
    .then(pushSubscription => {
      document.body.innerHTML += `<h2>Your end point:</h2> ${pushSubscription.endpoint}`
    })
},

  startWorker = () => {
    navigator.serviceWorker
      .register('service_worker.js')
      .then(subscribe)
      .catch(err => console.log('ServiceWorker registration failed: ', err));

    document.getElementById('subscribe').removeEventListener('click', startWorker);
  };

if ('serviceWorker' in navigator) {
  document.getElementById('subscribe').addEventListener('click', startWorker);
} else {
  document.body.innerHTML += '<h2>Service workers are not supported</h2>'
}
