let currentQuestions = [];
let currentIndex = 0;
let userAnswers = [];
let questionsPerPage = 5;
let animating = false;

function loadQuestions(topic) {
    // Validate topic parameter
    if (!topic) {
        return Promise.reject(new Error("No topic specified"));
    }
    
    // Show loading indicator
    const container = document.getElementById('questions-container');
    if (container) {
        container.innerHTML = `
            <div class="loading-indicator">
                <div class="spinner"></div>
                <p>Loading questions for ${topic}...</p>
            </div>
        `;
    }
    
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
        })
        .catch(error => {
            console.error(`Failed to load questions for ${topic}:`, error);
            // Return a special error object that can be detected later
            return { error: error.message || 'Failed to load questions' };
        });
}

function displayQuestions(questions, startIndex = 0) {
    const container = document.getElementById('questions-container');
    if (!container) return;
    
    // Clear existing questions with a fade-out effect
    container.style.opacity = '0';
    
    setTimeout(() => {
        container.innerHTML = '';
        const endIndex = Math.min(startIndex + questionsPerPage, questions.length);
        
        // Add progress indicator
        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';
        progressBar.innerHTML = `
            <div class="progress-indicator" style="width: ${(endIndex / questions.length) * 100}%"></div>
            <div class="progress-text">Question ${startIndex + 1} - ${endIndex} of ${questions.length}</div>
        `;
        container.appendChild(progressBar);
        
        // Add questions for this page
        for (let i = startIndex; i < endIndex; i++) {
            const question = questions[i];
            const questionDiv = document.createElement('div');
            questionDiv.className = 'question';
            questionDiv.setAttribute('data-index', i);
            questionDiv.tabIndex = 0; // Make focusable for keyboard navigation
            
            // Add the selected answer if available
            const selectedAnswer = userAnswers[i] || '';
            
            questionDiv.innerHTML = `
                <p class="question-number">Question ${i + 1}</p>
                <p class="question-text">${question.question}</p>
                <div class="options-container">
                    ${question.options.map(option => `
                        <label class="option-label ${selectedAnswer === option ? 'selected' : ''}">
                            <input type="radio" name="question${i}" value="${option}" ${selectedAnswer === option ? 'checked' : ''}>
                            <span class="radio-custom"></span>
                            <span class="option-text">${option}</span>
                        </label>
                    `).join('')}
                </div>
            `;
            container.appendChild(questionDiv);
            
            // Add event listeners for each option
            const optionLabels = questionDiv.querySelectorAll('.option-label');
            optionLabels.forEach(label => {
                label.addEventListener('click', function() {
                    // Remove selected class from all options
                    optionLabels.forEach(l => l.classList.remove('selected'));
                    // Add selected class to clicked option
                    this.classList.add('selected');
                    
                    // Save the answer
                    const input = this.querySelector('input');
                    if (input) {
                        userAnswers[i] = input.value;
                        
                        // Show feedback message
                        showFeedback("Answer saved");
                    }
                });
            });
        }
        
        // Add pagination controls if needed
        if (questions.length > questionsPerPage) {
            const paginationDiv = document.createElement('div');
            paginationDiv.className = 'pagination-controls';
            
            // Previous button
            if (startIndex > 0) {
                const prevButton = document.createElement('button');
                prevButton.className = 'pagination-button prev';
                prevButton.innerHTML = '<span>&#8592;</span> Previous';
                prevButton.addEventListener('click', () => {
                    if (!animating) {
                        navigateQuestions(Math.max(0, startIndex - questionsPerPage));
                    }
                });
                paginationDiv.appendChild(prevButton);
            }
            
            // Next button
            if (endIndex < questions.length) {
                const nextButton = document.createElement('button');
                nextButton.className = 'pagination-button next';
                nextButton.innerHTML = 'Next <span>&#8594;</span>';
                nextButton.addEventListener('click', () => {
                    if (!animating) {
                        navigateQuestions(endIndex);
                    }
                });
                paginationDiv.appendChild(nextButton);
            }
            
            container.appendChild(paginationDiv);
        }
        
        // Fade in the new questions
        setTimeout(() => {
            container.style.opacity = '1';
            
            // Render math expressions if present
            if (window.MathJax) {
                MathJax.typesetPromise().then(() => {
                    if (window.tikzjax) {
                        tikzjax.processMathJaxElements();
                    }
                });
            }
        }, 50);
    }, 300); // Matches the CSS transition time
}

function navigateQuestions(newIndex) {
    if (animating) return;
    animating = true;
    
    const container = document.getElementById('questions-container');
    container.style.opacity = '0';
    
    setTimeout(() => {
        currentIndex = newIndex;
        displayQuestions(currentQuestions, currentIndex);
        animating = false;
    }, 300);
}

function showFeedback(message, isError = false) {
    // Create or get existing feedback element
    let feedbackElement = document.getElementById('feedback-message');
    if (!feedbackElement) {
        feedbackElement = document.createElement('div');
        feedbackElement.id = 'feedback-message';
        document.body.appendChild(feedbackElement);
    }
    
    // Set message and styling
    feedbackElement.textContent = message;
    feedbackElement.className = isError ? 'error' : 'success';
    feedbackElement.style.opacity = '1';
    
    // Hide after 2 seconds
    setTimeout(() => {
        feedbackElement.style.opacity = '0';
    }, 2000);
}

function checkAnswers() {
    let score = 0;
    let unansweredCount = 0;
    const results = document.getElementById('results');
    
    results.innerHTML = '<h3>Checking your answers...</h3>';
    results.classList.add('checking');
    
    setTimeout(() => {
        const feedback = [];
        
        currentQuestions.forEach((question, index) => {
            const userAnswer = userAnswers[index];
            
            if (!userAnswer) {
                unansweredCount++;
            } else if (userAnswer === question.answer) {
                score++;
                feedback.push(`<div class="feedback-item correct">
                    <span class="question-number">Q${index + 1}:</span> 
                    <span class="feedback-icon">✓</span> 
                    <span class="feedback-text">Correct! You answered: ${userAnswer}</span>
                </div>`);
            } else {
                feedback.push(`<div class="feedback-item incorrect">
                    <span class="question-number">Q${index + 1}:</span> 
                    <span class="feedback-icon">✗</span> 
                    <span class="feedback-text">Incorrect. You answered: ${userAnswer}</span>
                    <span class="correct-answer">Correct answer: ${question.answer}</span>
                </div>`);
            }
        });
        
        const percentage = Math.round((score / currentQuestions.length) * 100);
        let resultMessage = '';
        
        if (percentage >= 90) {
            resultMessage = 'Excellent! You have a strong understanding of the topic.';
        } else if (percentage >= 70) {
            resultMessage = 'Good job! Keep practicing to improve further.';
        } else if (percentage >= 50) {
            resultMessage = 'You\'re on the right track. More practice will help.';
        } else {
            resultMessage = 'Keep studying. You\'ll get better with practice.';
        }
        
        const warningMessage = unansweredCount > 0 ? 
            `<div class="warning">You left ${unansweredCount} question${unansweredCount > 1 ? 's' : ''} unanswered.</div>` : '';
        
        results.innerHTML = `
            <div class="results-summary">
                <h3>Your Score: ${score} out of ${currentQuestions.length} (${percentage}%)</h3>
                <div class="score-bar">
                    <div class="score-indicator" style="width: ${percentage}%"></div>
                </div>
                <p class="results-message">${resultMessage}</p>
                ${warningMessage}
            </div>
            <div class="feedback-list">
                <h4>Question Feedback:</h4>
                ${feedback.join('')}
            </div>
            <button id="try-again" class="retry-button">Try Again</button>
        `;
        
        results.classList.remove('checking');
        results.classList.add('visible');
        
        document.getElementById('try-again').addEventListener('click', () => {
            loadNewQuestions();
            results.classList.remove('visible');
        });
        
        // Scroll to results
        results.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        // Render math if needed
        if (window.MathJax) {
            MathJax.typesetPromise([results]);
        }
    }, 800);
}

function loadNewQuestions() {
    const topic = document.body.getAttribute('data-topic');
    if (!topic) {
        console.error('No topic attribute found on body element');
        document.getElementById('questions-container').innerHTML = 
            '<p class="error">No topic specified. Please try again later.</p>';
        return;
    }
    
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'loading-indicator';
    loadingIndicator.innerHTML = `
        <div class="spinner"></div>
        <p>Loading questions...</p>
    `;
    document.getElementById('questions-container').innerHTML = '';
    document.getElementById('questions-container').appendChild(loadingIndicator);
    
    loadQuestions(topic)
        .then(questions => {
            // Check if we received an error object
            if (questions && questions.error) {
                throw new Error(questions.error);
            }
            
            // Ensure questions is an array
            if (!Array.isArray(questions) || questions.length === 0) {
                throw new Error('No questions available');
            }
            
            // Reset state
            currentQuestions = questions
                .sort(() => Math.random() - 0.5)
                .slice(0, 10);
            currentIndex = 0;
            userAnswers = new Array(currentQuestions.length).fill('');
            
            displayQuestions(currentQuestions);
            document.getElementById('results').innerHTML = '';
            document.getElementById('results').className = 'results';
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('questions-container').innerHTML = 
                `<p class="error">Failed to load questions: ${error.message}. Please try again later.</p>`;
        });
}

function initQuestions(topic) {
    try {
        const checkButton = document.getElementById('check-answers');
        const newButton = document.getElementById('new-questions');
        
        if (checkButton) {
            checkButton.addEventListener('click', checkAnswers);
        } else {
            console.warn('Check answers button not found');
        }
        
        if (newButton) {
            newButton.addEventListener('click', loadNewQuestions);
        } else {
            console.warn('New questions button not found');
        }
        
        loadNewQuestions();
        
        // Add keyboard navigation support
        document.addEventListener('keydown', function(e) {
            // Navigation between questions with arrow keys
            if (e.key === 'ArrowRight') {
                const nextButton = document.querySelector('.pagination-button.next');
                if (nextButton) nextButton.click();
            } else if (e.key === 'ArrowLeft') {
                const prevButton = document.querySelector('.pagination-button.prev');
                if (prevButton) prevButton.click();
            }
            
            // Check answers with Enter when focused on check button
            if (e.key === 'Enter' && document.activeElement === checkButton) {
                checkAnswers();
            }
        });
    } catch (error) {
        console.error('Error initializing questions:', error);
        const container = document.getElementById('questions-container');
        if (container) {
            container.innerHTML = '<p class="error">An error occurred while initializing questions. Please reload the page.</p>';
        }
    }
    
    // Responsive adjustment for smaller screens
    function adjustQuestionsPerPage() {
        if (window.innerWidth < 768) {
            questionsPerPage = 1;
        } else {
            questionsPerPage = 5;
        }
        
        if (currentQuestions.length > 0) {
            displayQuestions(currentQuestions, currentIndex);
        }
    }
    
    // Initial check and listen for resize
    adjustQuestionsPerPage();
    window.addEventListener('resize', adjustQuestionsPerPage);
}

document.addEventListener('DOMContentLoaded', () => {
    const topic = document.body.getAttribute('data-topic');
    if (topic) {
        initQuestions(topic);
    }
    
    // Responsive adjustment for smaller screens
    function adjustQuestionsPerPage() {
        if (window.innerWidth < 768) {
            questionsPerPage = 1;
        } else {
            questionsPerPage = 5;
        }
        
        if (currentQuestions.length > 0) {
            displayQuestions(currentQuestions, currentIndex);
        }
    }
    
    // Initial check and listen for resize
    adjustQuestionsPerPage();
    window.addEventListener('resize', adjustQuestionsPerPage);
});

// Add error recovery
window.addEventListener('error', (event) => {
    if (event.message && event.message.includes('questions')) {
        console.error('Caught questions error:', event);
        const container = document.getElementById('questions-container');
        if (container) {
            container.innerHTML = '<p class="error">An error occurred. Please reload the page to try again.</p>';
        }
        return true; // Prevent the error from bubbling up
    }
});
