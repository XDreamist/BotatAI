$(document).ready(function () { 
    const $mainHeader  = $('.main-header');
    const $modelHeader = $('.model-header');
    const $modelMenu   = $('.model-menu')
    const $chatContent = $('.chat-content');
    const $textContent = $('.text-content');
    const $placeholder = $('.placeholder');
    const $sendButton  = $('.send-button');

    var models             = [];
    var currentModelInfo   = "";
    var isModelListVisible = false;
    var isFadeAnimPlaying  = false;
    var isProcessingPrompt = false;
    var isStoppingprocess  = false;

    function toggleTheme() {
        document.body.dataset.theme = document.body.dataset.theme === 'dark' ? '' : 'dark';
    }

    function changeModel(modelIdx) {
        currentModelInfo = models[modelIdx];
    }

    function hideModelMenu(shouldHide) {
        if (isFadeAnimPlaying) return;
        isFadeAnimPlaying = true;
        if (isModelListVisible || shouldHide) {
            $modelMenu.fadeOut(200, function() {
                isModelListVisible = false;
                isFadeAnimPlaying = false;
            });
        }
        else {
            $modelMenu.fadeIn(200, function() {
                isModelListVisible = true;
                isFadeAnimPlaying = false;
            });
        } 
    }

    function listModels() {
        if (!models) {
            appendMessage("No info found or models not loaded.", 'ai');
            return;
        }

        var modelsInfo = "";
        for (var modelIdx in models) {
            modelsInfo += `${parseInt(modelIdx) + 1}. ${models[modelIdx].name}\n`;
        }
        appendMessage(modelsInfo, 'ai');
    }

    function togglePlaceholder() {
        const text = $textContent.text().trim();
        if (text.length > 0) {
            $placeholder.hide();
        } else {
            $placeholder.show();
        }
    }

    function isValidPrompt(prompt) {
        if (prompt.length <= 0) {
            alert("Type something..");
            return false;
        }
        if (prompt.length > 1000) {
            alert("Character limit exceeded!");
            return false;
        }
        return true;
    }

    function updateModelsInfo() {
        $.ajax({
            url: 'http://192.168.1.35:11434/api/tags',
            method: 'GET',
            success: function (data) {
                models = data.models;
                currentModelInfo = models[0];
                $modelHeader.append(`${currentModelInfo.name}` + ' ▼');

                for (var modelIdx in models) {
                    var model = models[modelIdx];
                    populateModelSelection(modelIdx, model.name);
                    console.log(model);
                }
            },
            error: function (xhr, status, error) {
                console.error('Error: ' + xhr);
            }
        });
    }

    function populateModelSelection(modelIdx, model_name) {
        $modelMenu.append(`<div class="model-option" id="${modelIdx}">${model_name}</div>`);
        $('.model-option').on('click', function () {
            currentModelInfo = models[$(this).attr('id')];
            $modelHeader.text(currentModelInfo.name + ' ▼');
            // $modelMenu.hide();
            hideModelMenu(true);
        });    
    }

    function appendMessage(text, sender) {
        const messageClass = sender === 'user' ? 'user' : 'ai';
        const messageDiv = document.createElement('div');
        messageDiv.className="message "+ messageClass;
        
        const actualtext=document.createElement('p');
        actualtext.className="bubble";
        actualtext.textContent = text;
        messageDiv.appendChild(actualtext);

        document.querySelector('.chat-content').appendChild(messageDiv);
               //$chatContent.append(`
          //  <div class="message ${messageClass}">
            //    <p class="bubble">${text}</p>
            //</div>
        //`);
        $chatContent.scrollTop($chatContent[0].scrollHeight);
    }

    function appendLoading(text, sender, id = '') {
        const messageClass = sender === 'user' ? 'user' : 'ai';
        const idAttr = id ? `id="${id}"` : '';

        $chatContent.append(`
            <div class="message ${messageClass}">
                <p class="bubble" ${idAttr}>${text}</p>
            </div>
        `);
        $chatContent.scrollTop($chatContent[0].scrollHeight);
    }

    function setProcessStoppable(stoppable) {
        $sendButton.text(stoppable ? '■' : '➤');
        $textContent.prop('contentEditable', !stoppable);
        isProcessingPrompt = stoppable;
    }

    function stopProcessing() {
        if (isStoppingprocess) return;
        isStoppingprocess = true;
        $.ajax({
            url: 'http://192.168.1.35:11434/api/stop',
            method: 'GET',
            success: function (data) {
                console.log(data);
                isStoppingprocess = false;
            },
            error: function (xhr, status, error) {
                console.error('Error: ' + xhr);
                isStoppingprocess = false;
            }
        });
    }

    function processText() {
        if (isProcessingPrompt) return stopProcessing();

        const textToProcess = $textContent.text().trim();
        $textContent.text('');
        togglePlaceholder();
        if (textToProcess[0] != '/') {
            sendPrompt(textToProcess);
            return;
        }
        // Need to work on below code
        const command = textToProcess.split('/:');
        console.log(command);
        switch(textToProcess) {
            case "/list": {
                listModels();
                break;
            }
            case "/theme": {
                toggleTheme();
                break;
            }
            default: {
                sendPrompt(textToProcess);
                break;
            }
        }
    }

    function sendPrompt(prompt) {
        if (!isValidPrompt(prompt)) return;
        
        console.log('Sending prompt:', prompt);
        appendMessage(prompt, 'user');

        const loadingBubbleId = 'loading-' + Date.now();
        appendLoading('<span class="loading">...</span>', 'ai', loadingBubbleId);

        const requestData = {
            model: getCurrentModel(),
            prompt: `[INST]${prompt}[/INST]`,
            stream: false
        };

        setProcessStoppable(true);
        $.ajax({
            url: 'http://192.168.1.35:11434/api/generate',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(requestData),
            success: function (data) {
                const response = data.response.trim() || '(No response)';
                console.log('Received response:', response);

                // appendMessage(response, 'ai');
                $(`#${loadingBubbleId}`).html(response);

                setProcessStoppable(false);
            },
            error: function (xhr, status, error) {
                // appendMessage('Error: ' + xhr.responseText, 'ai');
                $(`#${loadingBubbleId}`).html('Error: ' + xhr.responseText);

                setProcessStoppable(false);
            }
        });
    }


    // -------------------------------
    // ----- Main execution flow -----
    // ----- and event bindings ------
    // -------------------------------
    updateModelsInfo();
    togglePlaceholder();
    $mainHeader.on('click', changeModel);
    $textContent.on('input', togglePlaceholder);
    $sendButton.on('click', processText);
    $textContent.on('keypress', function (e) {
        // Enter key is 13
        if (e.which === 13 && !e.shiftKey) {
            e.preventDefault();
            processText();
        }
    });
    $modelHeader.on('click', function (e) {
        e.stopPropagation();
        // $modelMenu.toggle();
        hideModelMenu();
    });
    $(document).on('click', function () {
        // $modelMenu.hide();
        hideModelMenu(true);
    });
    window.getCurrentModel = function () {
        return currentModelInfo?.model;
    };

    // $modelMenu.on('click', showModelList);
});