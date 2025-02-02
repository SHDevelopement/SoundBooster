document.addEventListener('DOMContentLoaded', function() {
    const slider = document.getElementById('volumeSlider');
    const volumeInput = document.getElementById('volumeInput');
    const muteButton = document.getElementById('muteButton');
    const resetButton = document.getElementById('resetButton');
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = themeToggle.querySelector('.material-icons');
    const languageSelector = document.getElementById('language');

    // Charger le thème sauvegardé
    chrome.storage.local.get(['theme'], function(result) {
        const savedTheme = result.theme || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        updateThemeIcon(savedTheme);
    });

    function updateThemeIcon(theme) {
        themeIcon.textContent = theme === 'dark' ? 'light_mode' : 'dark_mode';
    }

    // Gérer le changement de thème
    themeToggle.addEventListener('click', function() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        chrome.storage.local.set({ theme: newTheme });
        updateThemeIcon(newTheme);
    });

    // Charger la langue sauvegardée
    chrome.storage.local.get(['language'], function(result) {
        const savedLanguage = result.language || 'en';
        languageSelector.value = savedLanguage;
        updateLanguage(savedLanguage);
    });

    // Gérer le changement de langue
    languageSelector.addEventListener('change', function() {
        const newLanguage = this.value;
        chrome.storage.local.set({ language: newLanguage });
        updateLanguage(newLanguage);
    });

    function updateLanguage(lang) {
        const translations = {
            en: {
                title: 'Sound Booster',
                mute: 'Mute',
                reset: 'Reset',
                currentSite: 'Current site:',
                language: 'Language'
            },
            fr: {
                title: 'Amplificateur Audio',
                mute: 'Muet',
                reset: 'Réinitialiser',
                currentSite: 'Site actuel:',
                language: 'Langue'
            },
            es: {
                title: 'Amplificador de Sonido',
                mute: 'Silenciar',
                reset: 'Reiniciar',
                currentSite: 'Sitio actual:',
                language: 'Idioma'
            },
            de: {
                title: 'Klangverstärker',
                mute: 'Stumm',
                reset: 'Zurücksetzen',
                currentSite: 'Aktuelle Seite:',
                language: 'Sprache'
            },
            it: {
                title: 'Amplificatore Audio',
                mute: 'Muto',
                reset: 'Ripristina',
                currentSite: 'Sito attuale:',
                language: 'Lingua'
            },
            pt: {
                title: 'Amplificador de Som',
                mute: 'Mudo',
                reset: 'Redefinir',
                currentSite: 'Site atual:',
                language: 'Idioma'
            },
            ru: {
                title: 'Усилитель Звука',
                mute: 'Без звука',
                reset: 'Сбросить',
                currentSite: 'Текущий сайт:',
                language: 'Язык'
            },
            ja: {
                title: 'サウンドブースター',
                mute: 'ミュート',
                reset: 'リセット',
                currentSite: '現在のサイト:',
                language: '言語'
            },
            zh: {
                title: '音量增强器',
                mute: '静音',
                reset: '重置',
                currentSite: '当前网站:',
                language: '语言'
            },
            ko: {
                title: '사운드 부스터',
                mute: '음소거',
                reset: '초기화',
                currentSite: '현재 사이트:',
                language: '언어'
            }
        };

        const t = translations[lang] || translations.en;

        // Mettre à jour les textes
        document.querySelector('h3').lastChild.textContent = t.title;
        document.querySelector('#muteButton').lastChild.textContent = t.mute;
        document.querySelector('#resetButton').lastChild.textContent = t.reset;
        document.querySelector('.language-selector label').textContent = t.language;
        
        const currentSite = document.querySelector('#currentSite');
        if (currentSite.textContent) {
            currentSite.textContent = `${t.currentSite} ${currentSite.textContent.split(':')[1]}`;
        }
    }

    // Obtenir l'URL actuelle
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        const currentUrl = new URL(tabs[0].url).hostname;
        
        // Charger le volume spécifique à cette URL
        chrome.storage.local.get(['volumes'], function(result) {
            const volumes = result.volumes || {};
            const savedVolume = volumes[currentUrl] || 100;
            slider.value = savedVolume;
            volumeInput.value = savedVolume;
        });
    });

    // Afficher le site actuel
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        const currentUrl = new URL(tabs[0].url).hostname;
        document.getElementById('currentSite').textContent = `Current site: ${currentUrl}`;
    });

    function updateVolume(value) {
        // Valider la plage
        value = Math.max(0, Math.min(1000, parseInt(value) || 0));
        
        slider.value = value;
        volumeInput.value = value;
        
        // Sauvegarder le volume pour l'URL actuelle
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            const currentUrl = new URL(tabs[0].url).hostname;
            chrome.storage.local.get(['volumes'], function(result) {
                const volumes = result.volumes || {};
                volumes[currentUrl] = value;
                chrome.storage.local.set({ volumes: volumes });

                // Envoyer l'URL avec le message
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: 'updateVolume',
                    volume: value,
                    url: currentUrl
                });
            });
        });
    }

    // Bouton Mute
    muteButton.addEventListener('click', function() {
        updateVolume(0);
    });

    // Bouton Reset
    resetButton.addEventListener('click', function() {
        updateVolume(100);
    });

    // Mettre à jour le volume quand le slider change
    slider.addEventListener('input', function() {
        updateVolume(this.value);
    });

    // Synchroniser le slider et l'input
    volumeInput.addEventListener('input', function() {
        updateVolume(this.value);
    });

    // Gérer la touche Enter dans l'input
    volumeInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            updateVolume(this.value);
            this.blur();
        }
    });
});
