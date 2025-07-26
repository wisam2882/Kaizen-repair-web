

const API_BASE_URL = 'https://kaizen-repair-web.onrender.com';

const scrollPositions = {};

function showPage(pageId, pushToHistory = true, rememberScroll = true) {
    // Store current scroll position before switching pages
    if (rememberScroll) {
        const currentPage = document.querySelector('.page.active');
        if (currentPage) {
            scrollPositions[currentPage.id] = window.scrollY;
        }
    }

    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.classList.remove('active'));

    const selectedPage = document.getElementById(pageId);
    if (selectedPage) {
        selectedPage.classList.add('active');
        
        // Restore scroll position or scroll to top for new pages
        const savedPosition = scrollPositions[pageId];
        if (savedPosition !== undefined && rememberScroll) {
            // Use setTimeout to ensure the page is fully rendered before scrolling
            setTimeout(() => {
                window.scrollTo(0, savedPosition);
            }, 50);
        } else if (!rememberScroll) {
            window.scrollTo(0, 0);
        }
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

// Enhanced back button function that remembers scroll position
function goBackToServices() {
    showPage('home', true, true);
    // Small delay to ensure page transition completes before scrolling to services
    setTimeout(() => {
        const servicesSection = document.getElementById('our-services');
        if (servicesSection) {
            servicesSection.scrollIntoView({ behavior: 'smooth' });
            // Update the stored scroll position for home page
            setTimeout(() => {
                scrollPositions['home'] = window.scrollY;
            }, 1000); // Wait for smooth scroll to complete
        }
    }, 100);
}

window.addEventListener('popstate', (event) => {
    const pageId = (event.state && event.state.page) || 'home';
    showPage(pageId, false, true);
});

function showServiceDetail(serviceId) {
    showPage(serviceId, true, false); // Don't remember scroll for service details (start at top)
}

class ContactFormHandler {
    constructor() {
        this.form = document.getElementById('contactForm');
        this.formContainer = document.querySelector('.contact-form'); // Add this line
        this.submissionScreen = document.getElementById('submissionScreen'); // Add this line
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
    resetForm() {
    // Hide submission screen
    this.submissionScreen.classList.remove('active');
    
    setTimeout(() => {
        this.formContainer.classList.remove('hidden');
    }, 300);
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
                this.showSubmissionScreen(data);
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

showSubmissionScreen(customerData) {
    // Update customer info in submission screen
    document.getElementById('customerName').textContent = `Hello, ${customerData.name}!`;
    document.getElementById('customerEmail').textContent = `We'll contact you at: ${customerData.email}`;

    // Hide form and show submission screen
    this.formContainer.classList.add('hidden');
    
    setTimeout(() => {
        this.submissionScreen.classList.add('active');
    }, 300);

    // Reset form
    this.form.reset();
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
    showPage('contact', true, false); // Start at top of contact page
}

function scrollToServices() {
    showPage('home', true, false); // Start at top, then scroll to services
    const servicesSection = document.getElementById('our-services');
    if (servicesSection) {
        servicesSection.scrollIntoView({ behavior: 'smooth' });
    }
}

// Function to setup all quote buttons (including service detail page ones)
function setupQuoteButtons() {
    // Handle quote buttons (service detail page ones) - these go to contact
    document.querySelectorAll('.service-detail-quote').forEach(button => {
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        
        newButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            let serviceName = '';
            const serviceDetailPage = this.closest('.page[id]');
            if (serviceDetailPage && serviceDetailPage.id !== 'home' && serviceDetailPage.id !== 'about' && serviceDetailPage.id !== 'contact') {
                serviceName = serviceDetailPage.id;
            }
            
            if (serviceName) {
                prefillContactForm(serviceName);
            } else {
                showPage('contact', true, false);
            }
        });
    });

    // Handle "Learn More" buttons from service cards - these go to service details
    document.querySelectorAll('.service-card .quick-contact-btn').forEach(button => {
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        
        newButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const serviceCard = this.closest('.service-card');
            if (serviceCard) {
                const serviceName = serviceCard.getAttribute('data-service');
                if (serviceName) {
                    showServiceDetail(serviceName);
                }
            }
        });
    });
}
//footer buttons and links handling
function handleFooterNavigation() {
    // Footer navigation links
    document.querySelectorAll('.footer-links a[onclick]').forEach(link => {
        // Remove the onclick attribute and add event listener instead
        const onclickValue = link.getAttribute('onclick');
        link.removeAttribute('onclick');
        
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Execute the original onclick function
            if (onclickValue.includes('showPage')) {
                const pageMatch = onclickValue.match(/showPage\('(\w+)'\)/);
                if (pageMatch) {
                    showPage(pageMatch[1], true, false);
                }
            } else if (onclickValue.includes('scrollToServices')) {
                scrollToServices();
            }
        });
    });
}


function setupAllNavigation() {
    // Main nav links (existing code)
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const pageId = this.getAttribute('data-page');
            showPage(pageId, true, false);
        });
    });
    
    // Footer navigation links
    handleFooterNavigation();
    
    // Any other onclick navigation elements
    document.querySelectorAll('a[onclick*="showPage"], button[onclick*="showPage"]').forEach(element => {
        const onclickValue = element.getAttribute('onclick');
        element.removeAttribute('onclick');
        
        element.addEventListener('click', function(e) {
            e.preventDefault();
            
            const pageMatch = onclickValue.match(/showPage\('(\w+)'\)/);
            if (pageMatch) {
                showPage(pageMatch[1], true, false);
            }
        });
    });
}
document.addEventListener('DOMContentLoaded', function () {
    window.contactHandler = new ContactFormHandler();
    enhanceFormValidation();
    updateServiceFromURL();
    checkApiHealth();

    document.querySelector('.logo-section').addEventListener('click', function(e) {
        e.preventDefault();
        showPage('home', true, false);
    });

    setupAllNavigation();

    // Nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const pageId = this.getAttribute('data-page');
            showPage(pageId, true, false); // Start at top for main nav
        });
    });

    // Service cards
    document.querySelectorAll('.service-card').forEach(card => {
        const serviceId = card.getAttribute('data-service');

        // Make full card clickable (but not if clicking on buttons)
        card.addEventListener('click', (e) => {
            // Don't navigate if clicking on a button or link inside the card
            if (!e.target.closest('button, a')) {
                if (serviceId) {
                    showServiceDetail(serviceId);
                }
            }
        });
    });

    // Setup back buttons with enhanced functionality
    document.querySelectorAll('.back-button').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            goBackToServices();
        });
    });

    // Setup all quote buttons
    setupQuoteButtons();

    // Scroll to services from nav
    const servicesLink = document.getElementById('services-link');
    if (servicesLink) {
        servicesLink.addEventListener('click', (event) => {
            event.preventDefault();
            scrollToServices();
        });
    }

    // Handle initial page load from URL hash
    const initialPage = window.location.hash.slice(1) || 'home';
    if (initialPage !== 'home') {
        showPage(initialPage, false, false);
    }

    console.log('🚀 Kaizen Repair website initialized successfully!');
});
