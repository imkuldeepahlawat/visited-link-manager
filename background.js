let contentScriptReady = false;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "contentScriptReady") {
    contentScriptReady = true;
    sendResponse({status: "OK"});
  } else if (request.action === "checkVisited") {
    if (!request.url || typeof request.url !== 'string') {
      sendResponse({ visited: false, error: 'Invalid URL' });
      return true;
    }
    
    chrome.history.getVisits({ url: request.url }, (visits) => {
      if (chrome.runtime.lastError) {
        sendResponse({ visited: false, error: chrome.runtime.lastError.message });
      } else {
        sendResponse({ visited: Array.isArray(visits) && visits.length > 0 });
      }
    });
    return true; // Indicates that the response is asynchronous
  }
});
