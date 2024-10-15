let enabled = false;
let visibility = 'all';

function updateLinkVisibility() {
  const links = document.getElementsByTagName('a');

  for (let link of links) {
    if (!enabled) {
      link.style.removeProperty('display');
      continue;
    }

    // Check if the URL is valid before sending a message
    if (link.href && link.href.startsWith('http')) {
      chrome.runtime.sendMessage({ action: "checkVisited", url: link.href }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Error:', chrome.runtime.lastError.message);
          return;
        }

        if (response && response.error) {
          console.error('Error checking visited status:', response.error);
          return;
        }

        const isVisited = response && response.visited;

        if (visibility === 'all' ||
           (visibility === 'visited' && isVisited) ||
           (visibility === 'unvisited' && !isVisited)) {
          link.style.removeProperty('display');
        } else {
          link.style.setProperty('display', 'none', 'important');
        }
      });
    }
  }
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

const debouncedUpdateLinkVisibility = debounce(updateLinkVisibility, 250);

function markVisitedLinks() {
  const links = document.getElementsByTagName('a');
  for (let link of links) {
    if (link.classList.contains('lvm-checked')) continue;

    link.classList.add('lvm-checked');
    
    // Check if the link is visited
    const color = window.getComputedStyle(link).getPropertyValue('color');
    if (color !== window.getComputedStyle(document.body).getPropertyValue('color')) {
      link.classList.add('lvm-visited');
    }

    // Add click event listener to mark as visited
    link.addEventListener('click', function() {
      this.classList.add('lvm-visited');
      updateLinkVisibility();
    });
  }
}

function init() {
  markVisitedLinks();
  debouncedUpdateLinkVisibility();
}

// Inform the background script that the content script is ready
chrome.runtime.sendMessage({action: "contentScriptReady"});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "setState") {
    enabled = request.enabled;
    visibility = request.visibility;
    debouncedUpdateLinkVisibility();
    sendResponse({status: "OK"}); // Send a response back
  }
  return true; // Indicates that the response is asynchronous
});

// Initial state
chrome.storage.sync.get(['enabled', 'visibility'], function(result) {
  enabled = result.enabled || false;
  visibility = result.visibility || 'all';
  debouncedUpdateLinkVisibility();
});

// Use MutationObserver to watch for DOM changes
const observer = new MutationObserver(debouncedUpdateLinkVisibility);
observer.observe(document.body, { childList: true, subtree: true });
