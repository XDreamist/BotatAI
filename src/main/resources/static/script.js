$(document).ready(function () {
    const $textContent = $('.text-content');
    const $placeholder = $('.placeholder');

    function togglePlaceholder() {
        const text = $textContent.text().trim();
        if (text.length > 0) {
            $placeholder.hide();
        } else {
            $placeholder.show();
        }
    }

    $textContent.on('input', togglePlaceholder);
    togglePlaceholder();

    function appendMessage(text, sender) {
        const messageClass = sender === 'user' ? 'user' : 'ai';
        $('.chat-content').append(`
            <div class="message ${messageClass}">
                <div class="bubble">${text}</div>
            </div>
        `);
        $('.chat-content').scrollTop($('.chat-content')[0].scrollHeight);
    }

    function sendMessage() {
        const text = $('.text-content').text().trim();
        console.log('Sending message:', text);
        if (!text) return;

        appendMessage(text, 'user');

        const requestData = {
            model: "deepseek-r1:1.5b",
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
                appendMessage(response, 'ai');
            },
            error: function (xhr, status, error) {
                appendMessage('Error: ' + xhr.responseText, 'ai');
            }
        });

        $('.text-content').text('');
        togglePlaceholder();
    }

    $('#sendBtn').on('click', sendMessage);
    $('.text-content').on('keypress', function (e) {
        if (e.which === 13 && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
});
