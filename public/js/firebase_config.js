firebase.initializeApp({
	apiKey: "q5lUudFVyy5bRJMW0VCw7qPRPZa0LIZgYxM5mw3w",
	authDomain: "meta-bubble.firebaseapp.com",
	databaseURL: "https://meta-bubble-default-rtdb.firebaseio.com",
	projectId: "meta-bubble",
	storageBucket: "cryoverse.appspot.com",
});
  
const db = firebase.database();
const auth = firebase.auth();
const storage = firebase.storage();