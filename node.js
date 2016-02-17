var webPush = require('web-push'),
  apiKey = process.env['GOOGLE_API_KEY'],
  endPointFireFox = "https://updates.push.services.mozilla.com/push/gAAAAABWvI4i_gGw1vYU-B3tuKjcXDqZ1sDIGW1HdRQ77BB_LibBJDjVs5q1aH0qzp7WwV4vlDm5QdJIkOaLAWxaDWa4XKKI2Yzjp15itVYAGlpx4-204KmEsFHIjiLagQiR0PbIFpC7gO5IK2SpTPht4coMyCc1C4JnL2llVZvvo7AAHTeaX58=",
  endPointChrome = "https://android.googleapis.com/gcm/send/eXUPNG6hU1k:APA91bH0uk7Su6GyMrtbDL-CK41Sw1cNN04O6it6BRn6LP1GtBQIi82xh0NC0u7hS4jOuabIkJcP_mWhMey2GxAiYsrzhaCXgeiIj-7e3q1mw1Mc1z8Q4hTg0Gi770DTLxrdnIiSr9lQ";

webPush.setGCMAPIKey(apiKey);
webPush.sendNotification(endPointFireFox, 200)
  .then(() => {
    console.log('Firefox: done');
  }, err => {
    console.log(err);
  });


webPush.sendNotification(endPointChrome, 200)
  .then(() => {
    console.log('Chrome: done');
  }, err => {
    console.log(err);
  });
