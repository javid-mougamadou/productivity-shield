document.getElementById('getStartedBtn').addEventListener('click', () => {
  window.close();
});

document.getElementById('settingsBtn').addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});
