let currentQuestions = [];

function loadQuestions(topic) {
    return fetch(`../../questions/${topic}.json`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (!data.questions || !Array.isArray(data.questions)) {
                throw new Error('Invalid question format');
            }
            return data.questions;
        });
}

function displayQuestions(questions) {
    const container = document.getElementById('questions-container');
    container.innerHTML = '';
    
    questions.forEach((question, index) => {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'question';
        questionDiv.innerHTML = `
            <p>${index + 1}. ${question.question}</p>
            ${question.options.map(option => `
                <label>
                    <input type="radio" name="question${index}" value="${option}">
                    ${option}
                </label><br>
            `).join('')}
        `;
        container.appendChild(questionDiv);
    });

    // Render math expressions if present
    if (window.MathJax) {
        MathJax.typesetPromise().then(() => {
            if (window.tikzjax) {
                tikzjax.processMathJaxElements();
            }
        });
    }
}

function checkAnswers() {
    let score = 0;
    currentQuestions.forEach((question, index) => {
        const selected = document.querySelector(`input[name="question${index}"]:checked`);
        if (selected) {
            const label = selected.parentElement;
            if (selected.value === question.answer) {
                score++;
                label.style.color = 'green';
            } else {
                label.style.color = 'red';
            }
        }
    });
    
    const results = document.getElementById('results');
    results.innerHTML = `Score: ${score} out of ${currentQuestions.length}`;
    if (window.MathJax) {
        MathJax.typesetPromise([results]);
    }
}

function initQuestions(topic) {
    const checkButton = document.getElementById('check-answers');
    const newButton = document.getElementById('new-questions');
    
    function loadAndDisplay() {
        loadQuestions(topic)
            .then(questions => {
                currentQuestions = questions
                    .sort(() => Math.random() - 0.5)
                    .slice(0, 10);
                displayQuestions(currentQuestions);
                document.getElementById('results').innerHTML = '';
            })
            .catch(error => {
                console.error('Error:', error);
                document.getElementById('questions-container').innerHTML = 
                    '<p class="error">Failed to load questions. Please try again later.</p>';
            });
    }

    checkButton.addEventListener('click', checkAnswers);
    newButton.addEventListener('click', loadAndDisplay);
    loadAndDisplay();

    const questionElement = document.getElementById('question-container');
    if (!questionElement) {
        console.error('question-container element not found');
        return; // Exit early if the element is missing
    }
    // Now safe to add event listener
    questionElement.addEventListener('click', function(e) {
        // ...existing event handling...
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const topic = document.body.getAttribute('data-topic');
    if (topic) {
        initQuestions(topic);
    }
});
