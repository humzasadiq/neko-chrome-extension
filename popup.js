// popup.js
let port = chrome.runtime.connect({name: "popup"});

document.addEventListener('DOMContentLoaded', function() {
    const toggleNeko = document.getElementById('toggleNeko');
    const nekoSelect = document.getElementById('nekoSelect');
    const nekoPreview = document.getElementById('nekoPreview');

    function updateNekoPreview(gifName) {
        nekoPreview.src = `images/${gifName}.png`;
    }
    
    port.postMessage({action: 'getState'});

    port.onMessage.addListener((message) => {
        if (message.action === 'stateUpdate') {
            toggleNeko.checked = message.state.enabled;
            nekoSelect.value = message.state.gif;
            updateNekoPreview(message.state.gif);
        }
    });

    toggleNeko.addEventListener('change', function() {
        port.postMessage({
            action: 'setState',
            enabled: toggleNeko.checked
        });
    });

    nekoSelect.addEventListener('change', function() {
        const selectedGif = nekoSelect.value;
        port.postMessage({
            action: 'setState',
            gif: selectedGif
        });
    });
});