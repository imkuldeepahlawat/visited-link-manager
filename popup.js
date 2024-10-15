document.addEventListener('DOMContentLoaded', function() {
  const enableSwitch = document.getElementById('enableSwitch');
  const statusText = document.getElementById('status');
  const statusIndicator = statusText.querySelector('.status-indicator');
  const visibilityOption = document.getElementById('visibilityOption');

  function updateStatus(enabled) {
    statusText.textContent = enabled ? "Enabled" : "Disabled";
    statusIndicator.className = `status-indicator ${enabled ? 'status-enabled' : 'status-disabled'}`;
  }

  // Load saved state
  chrome.storage.sync.get(['enabled', 'visibility'], function(result) {
    enableSwitch.checked = result.enabled || false;
    updateStatus(result.enabled);
    visibilityOption.value = result.visibility || 'all';
    visibilityOption.disabled = !result.enabled;
  });

  function sendMessageToActiveTab(message) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, message, function(response) {
          if (chrome.runtime.lastError) {
            console.log('Content script not ready, retrying in 1 second');
            setTimeout(() => sendMessageToActiveTab(message), 1000);
          } else {
            console.log('Message sent successfully');
          }
        });
      }
    });
  }

  enableSwitch.addEventListener('change', function() {
    const enabled = enableSwitch.checked;
    updateStatus(enabled);
    visibilityOption.disabled = !enabled;
    
    chrome.storage.sync.set({enabled: enabled}, function() {
      sendMessageToActiveTab({action: "setState", enabled: enabled, visibility: visibilityOption.value});
    });
  });

  visibilityOption.addEventListener('change', function() {
    chrome.storage.sync.set({visibility: visibilityOption.value}, function() {
      sendMessageToActiveTab({action: "setState", enabled: enableSwitch.checked, visibility: visibilityOption.value});
    });
  });
});
