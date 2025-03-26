/**
 * Enhanced Questions System for EEPrep
 * Modern implementation with better error handling and user experience
 */
let currentQuestions = [];
let userAnswers = [];
let questionsPerPage = 5;
let currentTopicId = null;

document.addEventListener('DOMContentLoaded', () => {
    // Get topic from data attribute or URL parameter
    const topic = document.body.getAttribute('data-topic') || 
                  getURLParameter('topic') || 
                  'general';
    
    if (topic) {
        initQuestions(topic);
    }
    
    // Setup event listeners
    setupEventListeners();
});

/**
 * Initialize the questions system with a specific topic
 */
function initQuestions(topic) {
    currentTopicId = topic;
    
    // Show loading state
    showLoadingState();
    
    // Load questions from API or JSON file
    loadQuestions(topic)
        .then(questions => {
            if (!questions || questions.length === 0) {
                showError("No questions available for this topic");
                return;
            }
            
            // Store questions and shuffle them
            currentQuestions = shuffleArray(questions);
            
            // Reset user answers
            userAnswers = Array(currentQuestions.length).fill(null);
            
            // Display questions
            displayQuestions(currentQuestions);
            
            // Hide loading state
            hideLoadingState();
        })
        .catch(error => {
            console.error("Error loading questions:", error);
            showError("Failed to load questions. Please try again later.");
            hideLoadingState();
        });
}

/**
 * Load questions from the server
 */
function loadQuestions(topic) {
    return fetch(`../Questions/${topic}.json`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to load questions: ${response.status}`);
            }
            return response.json();
        })
        .then(data => data.questions || [])
        .catch(error => {
            console.error("Error fetching questions:", error);
            // Try fallback to general questions if specific topic fails
            if (topic !== 'general') {
                console.log("Attempting to load general questions as fallback");
                return loadQuestions('general');
            }
            throw error;
        });
}

/**
 * Display questions in the container with modern UI
 */
function displayQuestions(questions, startIndex = 0) {
    const container = document.getElementById('questions-container');
    if (!container) return;
    
    // Clear container
    container.innerHTML = '';
    
    // Get subset of questions for current page
    const pageQuestions = questions.slice(startIndex, startIndex + questionsPerPage);
    
    // Generate HTML for each question
    pageQuestions.forEach((question, index) => {
        const questionIndex = startIndex + index;
        const questionElement = createQuestionElement(question, questionIndex);
        container.appendChild(questionElement);
    });
    
    // Add fade-in animation
    container.querySelectorAll('.question-item').forEach((item, i) => {
        item.style.animationDelay = `${i * 0.1}s`;
    });
    
    // Update pagination if needed
    if (questions.length > questionsPerPage) {
        updatePagination(startIndex, questions.length);
    }
}

/**
 * Create a question element with options
 */
function createQuestionElement(question, index) {
    const questionDiv = document.createElement('div');
    questionDiv.className = 'question-item fade-in';
    questionDiv.dataset.questionIndex = index;
    
    let optionsHtml = '';
    if (question.options && question.options.length) {
        optionsHtml = `
            <div class="question-options">
                ${question.options.map((option, optIndex) => `
                    <div class="option-item">
                        <label class="option-label">
                            <input type="radio" name="question-${index}" value="${optIndex}" data-index="${optIndex}">
                            <span class="option-text">${option}</span>
                        </label>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    questionDiv.innerHTML = `
        <div class="question-header">
            <span class="question-number">Q${index + 1}</span>
            <span class="question-text">${question.question}</span>
        </div>
        ${optionsHtml}
        <div class="question-feedback" id="feedback-${index}"></div>
    `;
    
    // Add event listeners to radio buttons
    const radioButtons = questionDiv.querySelectorAll('input[type="radio"]');
    radioButtons.forEach(radio => {
        radio.addEventListener('change', (e) => {
            userAnswers[index] = parseInt(e.target.dataset.index);
        });
    });
    
    return questionDiv;
}

/**
 * Update pagination controls
 */
function updatePagination(currentStart, totalQuestions) {
    const paginationContainer = document.getElementById('pagination') || createPaginationContainer();
    const totalPages = Math.ceil(totalQuestions / questionsPerPage);
    const currentPage = Math.floor(currentStart / questionsPerPage) + 1;
    
    paginationContainer.innerHTML = `
        <button class="pagination-button" data-action="prev" ${currentPage === 1 ? 'disabled' : ''}>
            <i class="fas fa-chevron-left"></i> Previous
        </button>
        <span class="pagination-info">${currentPage} of ${totalPages}</span>
        <button class="pagination-button" data-action="next" ${currentPage === totalPages ? 'disabled' : ''}>
            Next <i class="fas fa-chevron-right"></i>
        </button>
    `;
    
    // Add event listeners to pagination buttons
    paginationContainer.querySelector('[data-action="prev"]').addEventListener('click', () => {
        if (currentPage > 1) {
            displayQuestions(currentQuestions, (currentPage - 2) * questionsPerPage);
        }
    });
    
    paginationContainer.querySelector('[data-action="next"]').addEventListener('click', () => {
        if (currentPage < totalPages) {
            displayQuestions(currentQuestions, currentPage * questionsPerPage);
        }
    });
    
    return paginationContainer;
}

/**
 * Create pagination container if it doesn't exist
 */
function createPaginationContainer() {
    const container = document.getElementById('questions-container').parentNode;
    const paginationContainer = document.createElement('div');
    paginationContainer.id = 'pagination';
    paginationContainer.className = 'pagination-container';
    container.insertBefore(paginationContainer, document.getElementById('results'));
    return paginationContainer;
}

/**
 * Check user answers against correct answers
 */
function checkAnswers() {
    let correctCount = 0;
    let attemptedCount = 0;
    
    // Get visible questions based on pagination
    const visibleQuestionElements = document.querySelectorAll('.question-item');
    
    visibleQuestionElements.forEach(questionElement => {
        const index = parseInt(questionElement.dataset.questionIndex);
        const userAnswer = userAnswers[index];
        const correctAnswer = currentQuestions[index].answer;
        const feedbackElement = document.getElementById(`feedback-${index}`);
        
        if (userAnswer !== null) {
            attemptedCount++;
            
            if (userAnswer === correctAnswer) {
                correctCount++;
                feedbackElement.innerHTML = `<div class="feedback correct"><i class="fas fa-check-circle"></i> Correct!</div>`;
                feedbackElement.style.display = 'block';
            } else {
                feedbackElement.innerHTML = `
                    <div class="feedback incorrect">
                        <i class="fas fa-times-circle"></i> Incorrect
                        <div class="correct-answer">
                            Correct answer: ${currentQuestions[index].options[correctAnswer]}
                        </div>
                    </div>
                `;
                feedbackElement.style.display = 'block';
            }
        } else {
            feedbackElement.innerHTML = `<div class="feedback unanswered"><i class="fas fa-exclamation-circle"></i> Not answered</div>`;
            feedbackElement.style.display = 'block';
        }
    });
    
    // Show results
    displayResults(correctCount, attemptedCount, visibleQuestionElements.length);
}

/**
 * Display results summary
 */
function displayResults(correct, attempted, total) {
    const resultsContainer = document.getElementById('results');
    if (!resultsContainer) return;
    
    resultsContainer.innerHTML = `
        <div class="results-summary">
            <h4>Results</h4>
            <div class="results-stats">
                <div class="result-stat">
                    <span class="stat-value">${correct}</span>
                    <span class="stat-label">Correct</span>
                </div>
                <div class="result-stat">
                    <span class="stat-value">${attempted}</span>
                    <span class="stat-label">Attempted</span>
                </div>
                <div class="result-stat">
                    <span class="stat-value">${total}</span>
                    <span class="stat-label">Total</span>
                </div>
            </div>
            ${attempted > 0 ? `
                <div class="results-percentage">
                    <div class="progress-bar">
                        <div class="progress" style="width: ${Math.round((correct / attempted) * 100)}%"></div>
                    </div>
                    <div class="percentage-text">${Math.round((correct / attempted) * 100)}%</div>
                </div>
            ` : ''}
            <div class="results-message">
                ${getMessage(correct, attempted, total)}
            </div>
        </div>
    `;
    
    resultsContainer.classList.add('show');
    
    // Scroll to results
    resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Get appropriate message based on performance
 */
function getMessage(correct, attempted, total) {
    if (attempted === 0) return "Please attempt some questions before checking answers.";
    
    const percentage = Math.round((correct / attempted) * 100);
    
    if (percentage >= 90) return "Excellent work! You've mastered this topic.";
    else if (percentage >= 70) return "Great job! You have a good understanding of the material.";
    else if (percentage >= 50) return "Good effort! Keep practicing to improve further.";
    else return "Keep studying and try again. You'll improve with practice.";
}

/**
 * Generate new set of questions
 */
function generateNewQuestions() {
    if (currentTopicId) {
        // Reload with new questions
        initQuestions(currentTopicId);
        
        // Clear results
        const resultsContainer = document.getElementById('results');
        if (resultsContainer) {
            resultsContainer.classList.remove('show');
        }
    }
}

/**
 * Setup event listeners for the question system
 */
function setupEventListeners() {
    // Check answers button
    const checkAnswersBtn = document.getElementById('check-answers');
    if (checkAnswersBtn) {
        checkAnswersBtn.addEventListener('click', checkAnswers);
    }
    
    // New questions button
    const newQuestionsBtn = document.getElementById('new-questions');
    if (newQuestionsBtn) {
        newQuestionsBtn.addEventListener('click', generateNewQuestions);
    }
}

/**
 * Show loading state while fetching questions
 */
function showLoadingState() {
    const container = document.getElementById('questions-container');
    if (!container) return;
    
    container.innerHTML = `
        <div class="loading-questions">
            <div class="loading-dots">
                <div class="loading-dot"></div>
                <div class="loading-dot"></div>
                <div class="loading-dot"></div>
            </div>
            <p>Loading questions...</p>
        </div>
    `;
}

/**
 * Hide loading state
 */
function hideLoadingState() {
    // Loading state will be replaced when displaying questions
}

/**
 * Show error message
 */
function showError(message) {
    const container = document.getElementById('questions-container');
    if (!container) return;
    
    container.innerHTML = `
        <div class="error-message">
            <i class="fas fa-exclamation-triangle"></i>
            <p>${message}</p>
            <button class="btn" onclick="location.reload()">Try Again</button>
        </div>
    `;
}

/**
 * Shuffle array using Fisher-Yates algorithm
 */
function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

/**
 * Helper function to get URL parameters
 */
function getURLParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}
