class ContactForm {
    constructor() {
        this.form = document.getElementById('contactForm');
        this.submitButton = this.form.querySelector('button[type="submit"]');
        this.buttonText = this.submitButton.querySelector('.button-text');
        this.spinner = this.submitButton.querySelector('.loading-spinner');
        this.statusDiv = this.form.querySelector('.form-status');
        this.setupListeners();
    }

    setupListeners() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        this.form.querySelectorAll('input, textarea').forEach(input => {
            input.addEventListener('input', () => this.clearError(input));
        });
    }

    clearError(input) {
        const errorSpan = this.form.querySelector(`[data-for="${input.name}"]`);
        errorSpan.textContent = '';
        errorSpan.classList.remove('visible');
    }

    showError(inputName, message) {
        const errorSpan = this.form.querySelector(`[data-for="${inputName}"]`);
        errorSpan.textContent = message;
        errorSpan.classList.add('visible');
    }

    validateForm() {
        let isValid = true;
        const email = this.form.email.value;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (this.form.name.value.trim().length < 2) {
            this.showError('name', 'Name must be at least 2 characters long');
            isValid = false;
        }

        if (!emailRegex.test(email)) {
            this.showError('email', 'Please enter a valid email address');
            isValid = false;
        }

        if (this.form.message.value.trim().length < 10) {
            this.showError('message', 'Message must be at least 10 characters long');
            isValid = false;
        }

        return isValid;
    }

    setLoading(isLoading) {
        this.submitButton.disabled = isLoading;
        this.buttonText.textContent = isLoading ? 'Sending...' : 'Send Message';
        this.spinner.classList.toggle('hidden', !isLoading);
    }

    showStatus(message, isError = false) {
        this.statusDiv.textContent = message;
        this.statusDiv.className = `form-status ${isError ? 'error' : 'success'}`;
        this.statusDiv.classList.remove('hidden');

        if (!isError) {
            setTimeout(() => {
                this.form.reset();
                this.statusDiv.classList.add('hidden');
            }, 5000);
        }
    }

    async handleSubmit(event) {
        event.preventDefault();

        if (!this.validateForm()) {
            return;
        }

        this.setLoading(true);

        try {
            const formData = {
                name: this.form.name.value,
                email: this.form.email.value,
                message: this.form.message.value
            };

            const response = await fetch('https://us-central1-eeprepcom.cloudfunctions.net/submitContactForm', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                mode: 'cors',
                credentials: 'omit',
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to send message');
            }

            this.showStatus('Message sent successfully! Thank you for contacting us.');
        } catch (error) {
            console.error('Contact form error:', error);
            if (error.message.includes('Failed to fetch')) {
                this.showStatus('Network error. Please check your connection and try again.', true);
            } else {
                this.showStatus(`Error: ${error.message}`, true);
            }
        } finally {
            this.setLoading(false);
        }
    }
}

// Initialize the contact form handler
document.addEventListener('DOMContentLoaded', () => {
    new ContactForm();
});
