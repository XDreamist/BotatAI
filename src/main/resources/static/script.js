$(document).ready(function () { 
    const $mainHeader  = $('.main-header');
    const $chatContent = $('.chat-content');
    const $textContent = $('.text-content');
    const $placeholder = $('.placeholder');
    const $sendButton  = $('.send-button');
    const $darkModeBtn = $('.dark-mode-btn');

    const $modelHeader = $('.model-header');
    const $modelMenu = $('.model-menu');

    // let currentModel = 'mistral';

    // Toggle model menu on header click
    $modelHeader.on('click', function (e) {
        e.stopPropagation();
        $modelMenu.toggle();
    });

    // Update model on option click
    $('.model-option').on('click', function () {
        const selectedModel = $(this).text();
        currentModel = selectedModel;
        $modelHeader.text(selectedModel + ' ▼');
        $modelMenu.hide();
    });

    // Hide menu when clicking outside
    $(document).on('click', function () {
        $modelMenu.hide();
    });

    // Export current model for use in your API calls
    window.getCurrentModel = function () {
        return currentModel;
    };

    var models = [];
    var currentModel = "";

    function changeTheme() {
        document.body.dataset.theme = document.body.dataset.theme === 'dark' ? '' : 'dark';
    }

    function changeModel(modelIdx) {
        currentModel = models[modelIdx];
    }

    function togglePlaceholder() {
        const text = $textContent.text().trim();
        if (text.length > 0) {
            $placeholder.hide();
        } else {
            $placeholder.show();
        }
    }

    function isValidText(text) {
        if (text.length <= 0) {
            alert("Type something..");
            return false;
        }
        if (text.length > 1000) {
            alert("Character limit exceeded!");
            return false;
        }
        return true;
    }

    function getModels() {
        $.ajax({
            url: 'http://192.168.1.35:11434/api/tags',
            method: 'GET',
            success: function (data) {
                models = data.models;
                currentModel = models[0].model;
                for (var modelIdx in models) {
                    var model = models[modelIdx];
                    console.log(model);
                }
            },
            error: function (xhr, status, error) {
                console.error('Error: ' + xhr);
            }
        });
    }

    function appendMessage(text, sender, id = '') {
        const messageClass = sender === 'user' ? 'user' : 'ai';
        const idAttr = id ? `id="${id}"` : '';

        $chatContent.append(`
            <div class="message ${messageClass}" ${idAttr}>
                <p class="bubble">${text}</p>
            </div>
        `);
        $chatContent.scrollTop($chatContent[0].scrollHeight);
    }

    function sendMessage() {
        const text = $textContent.text().trim();
        if (!isValidText(text)) return;

        console.log('Sending message:', text);
        appendMessage(text, 'user');

        const loadingId = 'loading-' + Date.now();
        appendMessage('<span class="thinking">Thinking...</span>', 'ai', loadingId);

        const requestData = {
            model: currentModel,
            prompt: `[INST]${text}[/INST]`,
            stream: false
        };

        $.ajax({
            url: 'http://192.168.1.35:11434/api/generate',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(requestData),
            success: function (data) {
                const response = data.response || '(No response)';
                console.log('Received response:', response);

                // Replace the loading message with the actual response
                $(`#${loadingId}`).html(response);
            },
            error: function (xhr, status, error) {
                $(`#${loadingId}`).html('Error: ' + xhr.responseText);
            }
        });

        $textContent.text('');
        togglePlaceholder();
    }


    // -------------------------------
    // ----- Main execution flow -----
    // -------------------------------
    getModels();
    togglePlaceholder();
    $mainHeader.on('click', changeModel);
    $textContent.on('input', togglePlaceholder);
    $sendButton.on('click', sendMessage);
    $textContent.on('keypress', function (e) {
        // Enter key is 13
        if (e.which === 13 && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    $darkModeBtn.on('click', changeTheme);
});