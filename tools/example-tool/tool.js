/**
 * Example Tool JavaScript
 * Demonstrates isolated tool logic and integration with the Portfolio Framework.
 */

(function () {
    'use strict';

    function initExampleTool() {
        const textInput = document.getElementById('example-text-input');
        const charCountEl = document.getElementById('stat-chars');
        const wordCountEl = document.getElementById('stat-words');
        const lineCountEl = document.getElementById('stat-lines');
        const uppercaseBtn = document.getElementById('btn-uppercase');
        const lowercaseBtn = document.getElementById('btn-lowercase');
        const clearBtn = document.getElementById('btn-clear');
        const copyBtn = document.getElementById('btn-copy');

        if (!textInput) return;

        function updateStats() {
            const text = textInput.value;
            const chars = text.length;
            const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
            const lines = text === '' ? 0 : text.split('\n').length;

            if (charCountEl) charCountEl.textContent = chars.toLocaleString();
            if (wordCountEl) wordCountEl.textContent = words.toLocaleString();
            if (lineCountEl) lineCountEl.textContent = lines.toLocaleString();
        }

        textInput.addEventListener('input', updateStats);

        if (uppercaseBtn) {
            uppercaseBtn.addEventListener('click', () => {
                textInput.value = textInput.value.toUpperCase();
                updateStats();
            });
        }

        if (lowercaseBtn) {
            lowercaseBtn.addEventListener('click', () => {
                textInput.value = textInput.value.toLowerCase();
                updateStats();
            });
        }

        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                textInput.value = '';
                updateStats();
            });
        }

        if (copyBtn) {
            copyBtn.addEventListener('click', async () => {
                try {
                    await navigator.clipboard.writeText(textInput.value);
                    const originalText = copyBtn.textContent;
                    copyBtn.textContent = 'Copied!';
                    setTimeout(() => { copyBtn.textContent = originalText; }, 2000);
                } catch (e) {
                    console.error('Copy failed', e);
                }
            });
        }

        updateStats();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initExampleTool);
    } else {
        initExampleTool();
    }
})();
