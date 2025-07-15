$(document).ready(function () { 
    const $mainHeader  = $('.main-header');
    const $chatContent = $('.chat-content');
    const $textContent = $('.text-content');
    const $placeholder = $('.placeholder');
    const $sendButton  = $('.send-button');
    const $darkModeBtn = $('.dark-mode-btn');

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
            url: 'http://localhost:11434/api/tags',
            method: 'GET',
            success: function (data) {
                models = data.models;
                currentModel = models[0].model;
                for (modelIdx in models) {
                    var model = models[modelIdx];
                    console.log(model);
                }
            },
            error: function (xhr, status, error) {
                console.error('Error: ' + xhr);
            }
        });
    }

    function appendMessage(text, sender) {
        const messageClass = sender === 'user' ? 'user' : 'ai';
        $chatContent.append(`
            <div class="message ${messageClass}">
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

        const requestData = {
            model: currentModel,
            prompt: `[INST]${text}[/INST]`,
            stream: false
        };

        $.ajax({
            url: 'http://localhost:11434/api/generate',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(requestData),
            success: function (data) {
                const response = data.response || '(No response)';
                console.log('Received response:', response);
                appendMessage(response, 'ai');
            },
            error: function (xhr, status, error) {
                appendMessage('Error: ' + xhr.responseText, 'ai');
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