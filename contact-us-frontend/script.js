
const API_BASE_URL = 'http://localhost:3000'; // Change this to your production URL when deployed

// Page navigation functionality (existing code)
function showPage(pageId) {
    // Hide all pages
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.classList.remove('active'));
    
    // Show selected page
    const selectedPage = document.getElementById(pageId);
    if (selectedPage) {
        selectedPage.classList.add('active');
    }
    
    // Update navigation
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => link.classList.remove('active'));
    
    const activeLink = document.querySelector(`[data-page="${pageId}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
}

function showServiceDetail(serviceId) {
    showPage(serviceId);
}

// Enhanced Contact Form Handler
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
        
        // Get form data
        const formData = new FormData(this.form);
        const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone') || '',
            service: formData.get('service'),
            message: formData.get('message')
        };

        // Show loading state
        this.setLoadingState(true);
        this.clearMessages();

        try {
            const response = await fetch(`${API_BASE_URL}/contact`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
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
        
        // Scroll to message
        messageDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Auto-hide after 5 seconds
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
            detailsHtml = `
                <ul class="error-details">
                    ${details.map(detail => `<li>${detail}</li>`).join('')}
                </ul>
            `;
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
        
        // Scroll to message
        messageDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

// API Health Check
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

// Form Validation Enhancement
function enhanceFormValidation() {
    const form = document.getElementById('contactForm');
    if (!form) return;

    const inputs = form.querySelectorAll('input, textarea, select');
    
    inputs.forEach(input => {
        // Real-time validation
        input.addEventListener('blur', function() {
            validateField(this);
        });
        
        // Remove error styling when user starts typing
        input.addEventListener('input', function() {
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

    // Remove existing error
    field.classList.remove('error');
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }

    // Validation rules
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

// Service Selection Helper
function updateServiceFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const service = urlParams.get('service');
    
    if (service) {
        const serviceSelect = document.getElementById('service');
        if (serviceSelect) {
            serviceSelect.value = service;
        }
    }
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize contact form handler
    new ContactFormHandler();
    
    // Enhance form validation
    enhanceFormValidation();
    
    // Update service selection from URL
    updateServiceFromURL();
    
    // Check API health (optional)
    checkApiHealth();
    
    // Navigation event listeners
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const pageId = this.getAttribute('data-page');
            showPage(pageId);
        });
    });
    
    console.log('🚀 Kaizen Repair website initialized successfully!');
});

// Utility function to prefill contact form
function prefillContactForm(service) {
    const serviceSelect = document.getElementById('service');
    if (serviceSelect) {
        serviceSelect.value = service;
    }
    showPage('contact');
}
// Function to handle the smooth scroll
function scrollToServices() {
    // 1. Ensure the 'home' page is active (since services are on the home page)
    showPage('home'); 

    // 2. Get the target element by its ID
    const servicesSection = document.getElementById('our-services');

    if (servicesSection) {
        // 3. Use the scrollIntoView method for smooth scrolling
        servicesSection.scrollIntoView({ 
            behavior: 'smooth' 
        });
    }
}

// 4. Attach the click event listener to the "OUR SERVICES" link
document.addEventListener('DOMContentLoaded', () => {
    const servicesLink = document.getElementById('services-link');
    
    if (servicesLink) {
        servicesLink.addEventListener('click', (event) => {
            // Prevent the default anchor link behavior (which might cause a sudden jump)
            event.preventDefault(); 
            // Call the smooth scrolling function
            scrollToServices();
        });
    }
});
// Add click handlers for service cards to prefill contact form
document.addEventListener('DOMContentLoaded', function() {
    const serviceCards = document.querySelectorAll('.service-card');
    serviceCards.forEach(card => {
        const continueButton = card.querySelector('.continue-reading');
        if (continueButton) {
            // Add a secondary button for quick contact
            const contactButton = document.createElement('button');
            contactButton.className = 'quick-contact-btn';
            contactButton.textContent = 'Get Quote';
            contactButton.onclick = function(e) {
                e.preventDefault();
                e.stopPropagation();
                const serviceTitle = card.querySelector('h3').textContent;
                prefillContactForm(serviceTitle.toLowerCase().replace(/\s+/g, '-'));
            };
            card.appendChild(contactButton);
        }
    });
});