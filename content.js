let audioContexts = new WeakMap();

function createAudioContext(element) {
    try {
        const context = new AudioContext();
        const source = context.createMediaElementSource(element);
        const gain = context.createGain();

        source.connect(gain);
        gain.connect(context.destination);

        return { context, gain };
    } catch (e) {
        console.error('Failed to create audio context:', e);
        return null;
    }
}

function setupAudio(element) {
    if (!audioContexts.has(element)) {
        const audio = createAudioContext(element);
        if (audio) {
            audioContexts.set(element, audio);
            
            // Charger le volume spécifique à cette URL
            const currentUrl = window.location.hostname;
            chrome.storage.local.get(['volumes'], function(result) {
                const volumes = result.volumes || {};
                const savedVolume = volumes[currentUrl] || 100;
                audio.gain.gain.value = savedVolume / 100;
            });
        }
    }
}

// Configuration initiale
function init() {
    const elements = document.querySelectorAll('video, audio');
    elements.forEach(setupAudio);
}

// Observer pour les nouveaux éléments
const observer = new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
            if (node instanceof HTMLMediaElement) {
                setupAudio(node);
            }
        });
    });
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});

// Initialisation
document.addEventListener('DOMContentLoaded', init);

// Gestion des messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'updateVolume') {
        // Vérifier que le message est pour ce domaine
        if (request.url === window.location.hostname) {
            const volume = request.volume / 100;
            const elements = document.querySelectorAll('video, audio');
            
            elements.forEach(element => {
                const audio = audioContexts.get(element);
                if (audio) {
                    audio.gain.gain.value = volume;
                } else {
                    setupAudio(element);
                }
            });
        }
    }
});
