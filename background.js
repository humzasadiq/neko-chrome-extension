// background.js
let nekoState = {
    enabled: true,
    gif: 'oneko-classic.gif',
};

chrome.storage.local.get(['nekoEnabled', 'nekoGif'], function(result) {
    nekoState.enabled = result.nekoEnabled !== undefined ? result.nekoEnabled : true;
    nekoState.gif = result.nekoGif || 'oneko-classic.gif';
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'getState') {
        sendResponse(nekoState);
    } else if (message.action === 'setState') {
        if (message.enabled !== undefined) {
            nekoState.enabled = message.enabled;
            chrome.storage.local.set({ 'nekoEnabled': nekoState.enabled });
        }
        if (message.gif) {
            nekoState.gif = message.gif;
            chrome.storage.local.set({ 'nekoGif': nekoState.gif });
        }

        chrome.tabs.query({}, function(tabs) {
            for (let tab of tabs) {
                chrome.tabs.sendMessage(tab.id, { action: 'updateState', state: nekoState });
            }
        });
    }
    return true;
});

chrome.tabs.onCreated.addListener((tab) => {
    chrome.tabs.sendMessage(tab.id, { action: 'updateState', state: nekoState });
});

chrome.runtime.onConnect.addListener((port) => {
    if (port.name === "popup") {
        port.onMessage.addListener((message) => {
            if (message.action === 'getState') {
                port.postMessage({ action: 'stateUpdate', state: nekoState });
            } else if (message.action === 'setState') {
                if (message.enabled !== undefined) {
                    nekoState.enabled = message.enabled;
                    chrome.storage.local.set({ 'nekoEnabled': nekoState.enabled });
                }
                if (message.gif) {
                    nekoState.gif = message.gif;
                    chrome.storage.local.set({ 'nekoGif': nekoState.gif });
                }

                chrome.tabs.query({}, function(tabs) {
                    for (let tab of tabs) {
                        chrome.tabs.sendMessage(tab.id, { action: 'updateState', state: nekoState });
                    }
                });

                port.postMessage({ action: 'stateUpdate', state: nekoState });
            }
        });
    }
});