const API_BASE_URL = 'https://kaizen-repair-web.onrender.com';

function showPage(pageId, pushToHistory = true) {
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.classList.remove('active'));

    const selectedPage = document.getElementById(pageId);
    if (selectedPage) {
        selectedPage.classList.add('active');
        window.scrollTo(0, 0); // ✅ Scroll to top of page
    }

    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => link.classList.remove('active'));

    const activeLink = document.querySelector(`[data-page="${pageId}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }

    if (pushToHistory) {
        history.pushState({ page: pageId }, '', `#${pageId}`);
    }

    if (pageId === 'home' && document.referrer.includes('#') && window.location.hash === '') {
        setTimeout(() => {
            const servicesSection = document.getElementById('our-services');
            if (servicesSection) {
                servicesSection.scrollIntoView({ behavior: 'smooth' });
            }
        }, 100);
    }
}


window.addEventListener('popstate', (event) => {
    const pageId = (event.state && event.state.page) || 'home';
    showPage(pageId, false);
});

function showServiceDetail(serviceId) {
    showPage(serviceId, true);
}

class ContactFormHandler {
    constructor() {
        this.form = document.getElementById('contactForm');
        this.submitButton = null;
        this.originalButtonText = '';
        this.init();
    }

    init() {
        if (this.form) {
            this.submitButton = this.form.querySelector('button[type="submit"]');
            this.originalButtonText = this.submitButton.textContent;
            this.form.addEventListener('submit', this.handleSubmit.bind(this));
        }
    }

    async handleSubmit(e) {
        e.preventDefault();

        const formData = new FormData(this.form);
        const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone') || '',
            service: formData.get('service'),
            message: formData.get('message')
        };

        this.setLoadingState(true);
        this.clearMessages();

        try {
            const response = await fetch(`${API_BASE_URL}/contact`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok) {
                this.showSuccess(result.message);
                this.form.reset();
            } else {
                this.showError(result.error, result.details);
            }
        } catch (error) {
            console.error('Network error:', error);
            this.showError('Unable to connect to server. Please check your internet connection and try again.');
        } finally {
            this.setLoadingState(false);
        }
    }

    setLoadingState(isLoading) {
        if (this.submitButton) {
            this.submitButton.disabled = isLoading;
            this.submitButton.textContent = isLoading ? 'Sending...' : this.originalButtonText;
        }
    }

    clearMessages() {
        const existingMessages = this.form.querySelectorAll('.form-message');
        existingMessages.forEach(msg => msg.remove());
    }

    showSuccess(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'form-message success-message';
        messageDiv.innerHTML = `
            <div class="message-content">
                <span class="message-icon">✅</span>
                <span class="message-text">${message}</span>
            </div>
        `;
        this.form.insertBefore(messageDiv, this.form.firstChild);
        messageDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });

        setTimeout(() => {
            messageDiv.style.opacity = '0';
            setTimeout(() => messageDiv.remove(), 300);
        }, 5000);
    }

    showError(message, details = null) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'form-message error-message';

        let detailsHtml = '';
        if (details && Array.isArray(details)) {
            detailsHtml = `<ul class="error-details">${details.map(d => `<li>${d}</li>`).join('')}</ul>`;
        }

        messageDiv.innerHTML = `
            <div class="message-content">
                <span class="message-icon">❌</span>
                <div class="message-text">
                    <strong>${message}</strong>
                    ${detailsHtml}
                </div>
            </div>
        `;
        this.form.insertBefore(messageDiv, this.form.firstChild);
        messageDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

async function checkApiHealth() {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        const data = await response.json();
        console.log('API Health Check:', data);
        return data;
    } catch (error) {
        console.error('API Health Check Failed:', error);
        return null;
    }
}

function enhanceFormValidation() {
    const form = document.getElementById('contactForm');
    if (!form) return;

    const inputs = form.querySelectorAll('input, textarea, select');

    inputs.forEach(input => {
        input.addEventListener('blur', function () {
            validateField(this);
        });

        input.addEventListener('input', function () {
            this.classList.remove('error');
            const errorMsg = this.parentNode.querySelector('.field-error');
            if (errorMsg) {
                errorMsg.remove();
            }
        });
    });
}

function validateField(field) {
    const value = field.value.trim();
    let isValid = true;
    let errorMessage = '';

    field.classList.remove('error');
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) existingError.remove();

    switch (field.name) {
        case 'name':
            if (value.length < 2) {
                isValid = false;
                errorMessage = 'Name must be at least 2 characters long';
            }
            break;
        case 'email':
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                isValid = false;
                errorMessage = 'Please enter a valid email address';
            }
            break;
        case 'phone':
            if (value && !/^[\d\s\-\+\(\)\.]+$/.test(value)) {
                isValid = false;
                errorMessage = 'Please enter a valid phone number';
            }
            break;
        case 'message':
            if (value.length < 10) {
                isValid = false;
                errorMessage = 'Message must be at least 10 characters long';
            }
            break;
    }

    if (!isValid) {
        field.classList.add('error');
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        errorDiv.textContent = errorMessage;
        field.parentNode.appendChild(errorDiv);
    }

    return isValid;
}

function updateServiceFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const service = urlParams.get('service');
    if (service) {
        const serviceSelect = document.getElementById('service');
        if (serviceSelect) serviceSelect.value = service;
    }
}

function prefillContactForm(service) {
    const serviceSelect = document.getElementById('service');
    if (serviceSelect) {
        serviceSelect.value = service;
    }
    showPage('contact');
}

function scrollToServices() {
    showPage('home');
    const servicesSection = document.getElementById('our-services');
    if (servicesSection) {
        servicesSection.scrollIntoView({ behavior: 'smooth' });
    }
}

document.addEventListener('DOMContentLoaded', function () {
    new ContactFormHandler();
    enhanceFormValidation();
    updateServiceFromURL();
    checkApiHealth();

    // Nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const pageId = this.getAttribute('data-page');
            showPage(pageId);
        });
    });

    // Service cards
    document.querySelectorAll('.service-card').forEach(card => {
        const serviceId = card.getAttribute('data-service');

        // Make full card clickable
        card.addEventListener('click', () => {
            if (serviceId) {
                showServiceDetail(serviceId);
            }
        });

        // Remove any existing continue-reading links
        const continueReading = card.querySelector('.continue-reading');
        if (continueReading) {
            continueReading.remove();
        }

        // Create Get Quote button if not exists
        if (!card.querySelector('.quick-contact-btn')) {
            const contactButton = document.createElement('button');
            contactButton.className = 'cta-button quick-contact-btn  ';
            contactButton.textContent = 'Get Quote';
            contactButton.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                const serviceTitle = card.querySelector('h3').textContent;
                prefillContactForm(serviceTitle.toLowerCase().replace(/\s+/g, '-'));
            });
            card.appendChild(contactButton);
        }

        // Prevent inner buttons from bubbling up
        const links = card.querySelectorAll('a, button');
        links.forEach(link => {
            link.addEventListener('click', e => {
                e.stopPropagation();
                if (link.classList.contains('cta-button')) {
                    e.preventDefault();
                    showPage('contact');
                }
            });
        });
    });

    // Scroll to services from nav
    const servicesLink = document.getElementById('services-link');
    if (servicesLink) {
        servicesLink.addEventListener('click', (event) => {
            event.preventDefault();
            scrollToServices();
        });
    }

    console.log('🚀 Kaizen Repair website initialized successfully!');
});
