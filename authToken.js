const axios = require('axios');

let authToken = null;

const setAuthToken = (token) => {
  authToken = token;
};

const getAuthToken = () => {
  return authToken;
};

const updateAuthToken = async () => {
  try {
    const response = await axios.post('http://localhost:8080/qlvb/api/login/v3/', {
      device: "\"Google Android SDK built for x86\"",
      language: "VI",
      password: "ToPhanMemGP2@2025",
      tokenFireBase: "cmB_ptRjFCc:APA91bG0XFcR3wcif27eZLunMaK3-yzoXIds3xCe0G9LFg3741sWT4UBTKbezqYC56peH4QNP1kv3KzZ10T9mEh0VvC4Pi1rSYfEK7WtG4qL5RKOIFhxPtmg1qme1ArqhSH5LCDNjkpg",
      type: "ANDROID",
      username: "admin.tpmgp2"
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.data && response.data.data && response.data.data.token) {
      setAuthToken(response.data.data.token);
      console.log('-----Updated auth token: ', authToken);
    } else {
      console.error('Failed to update auth token: Invalid response data');
    }
  } catch (error) {
    console.error('Failed to update auth token:', error);
  }
};

const startTokenUpdateInterval = () => {
  updateAuthToken(); // Initial token update
  setInterval(updateAuthToken, 5 * 60 * 1000); // Update every 5 minutes
};

startTokenUpdateInterval();

module.exports = {
  setAuthToken,
  getAuthToken
};
