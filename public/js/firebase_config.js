firebase.initializeApp({
	apiKey: "AIzaSyC1BGKhHIK-_FvnazLmngPDUiMJLtSpXBo",
	authDomain: "cryoverse.firebaseapp.com",
	databaseURL: "https://cryoverse-default-rtdb.firebaseio.com",
	projectId: "cryoverse",
	storageBucket: "cryoverse.appspot.com",
});
  
const db = firebase.database();
const auth = firebase.auth();
const storage = firebase.storage();