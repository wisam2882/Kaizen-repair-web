const API_BASE_URL = 'https://kaizen-repair-web.onrender.com';

const scrollPositions = {};

// Store scroll position whenever user scrolls
let scrollTimeout;
function storeCurrentScrollPosition() {
    const currentPage = document.querySelector('.page.active');
    if (currentPage) {
        scrollPositions[currentPage.id] = window.scrollY;
        
        // Also store in browser history state
        const currentState = history.state || {};
        history.replaceState({
            ...currentState,
            page: currentPage.id,
            scrollY: window.scrollY
        }, '', window.location.href);
    }
}

// Debounced scroll listener to store position
window.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(storeCurrentScrollPosition, 100);
});

// Enhanced showPage function with better scroll memory
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
        
        // Restore scroll position
        if (rememberScroll) {
            const savedPosition = scrollPositions[pageId];
            if (savedPosition !== undefined) {
                // Use requestAnimationFrame for smoother restoration
                requestAnimationFrame(() => {
                    window.scrollTo(0, savedPosition);
                });
            } else {
                window.scrollTo(0, 0);
            }
        } else {
            window.scrollTo(0, 0);
        }
    }

    // Update nav links
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => link.classList.remove('active'));

    const activeLink = document.querySelector(`[data-page="${pageId}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }

    // Push to history with scroll position
    if (pushToHistory) {
        history.pushState({ 
            page: pageId, 
            scrollY: rememberScroll ? (scrollPositions[pageId] || 0) : 0 
        }, '', `#${pageId}`);
    }

    // Special handling for home page services section
    if (pageId === 'home' && document.referrer.includes('#') && window.location.hash === '') {
        setTimeout(() => {
            const servicesSection = document.getElementById('our-services');
            if (servicesSection) {
                servicesSection.scrollIntoView({ behavior: 'smooth' });
            }
        }, 100);
    }
}

// Enhanced back button handling with exact scroll restoration
window.addEventListener('popstate', (event) => {
    const pageId = (event.state && event.state.page) || 'home';
    const savedScrollY = (event.state && event.state.scrollY) || scrollPositions[pageId] || 0;
    
    // Switch page without pushing to history
    showPage(pageId, false, false);
    
    // Restore exact scroll position
    setTimeout(() => {
        window.scrollTo(0, savedScrollY);
        scrollPositions[pageId] = savedScrollY;
    }, 50);
});

// Enhanced goBackToServices function that remembers where you were
function goBackToServices() {
    // Store current position before going back
    storeCurrentScrollPosition();
    
    // Check if we came from home page and should return to services section
    const wasOnHomePage = scrollPositions['home'] !== undefined;
    
    showPage('home', true, true);
    
    // If we were previously on home page, restore that position
    // Otherwise, scroll to services section
    setTimeout(() => {
        if (wasOnHomePage && scrollPositions['home'] > 0) {
            window.scrollTo(0, scrollPositions['home']);
        } else {
            const servicesSection = document.getElementById('our-services');
            if (servicesSection) {
                servicesSection.scrollIntoView({ behavior: 'smooth' });
                // Update stored position after scrolling to services
                setTimeout(() => {
                    scrollPositions['home'] = window.scrollY;
                    storeCurrentScrollPosition();
                }, 1000);
            }
        }
    }, 100);
}

// Store scroll position when user is about to leave the page
window.addEventListener('beforeunload', storeCurrentScrollPosition);

// Store position when clicking on navigation elements
document.addEventListener('click', (e) => {
    // If clicking on a navigation element, store current position first
    if (e.target.closest('a[href^="#"], .nav-link, .service-card, .back-button') && 
        !e.target.closest('.footer-links')) {
        storeCurrentScrollPosition();
    }
});

// Initialize scroll position memory on page load
function initializeScrollMemory() {
    const initialPage = window.location.hash.slice(1) || 'home';
    scrollPositions[initialPage] = 0; // Initialize current page
    
    // Store initial state
    history.replaceState({ 
        page: initialPage, 
        scrollY: 0 
    }, '', window.location.href);
}

function showServiceDetail(serviceId) {
    showPage(serviceId, true, false); // Don't remember scroll for service details (start at top)
}

// UNIFIED NAVIGATION SETUP - Only one function to handle all navigation
function setupAllNavigation() {
    // 1. Main nav links with scroll memory
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            storeCurrentScrollPosition(); // Store before navigating
            const pageId = this.getAttribute('data-page');
            showPage(pageId, true, true); // Remember scroll for main nav
        });
    });
    
    // 2. Footer navigation links - fresh start (no scroll memory)
    document.querySelectorAll('.footer-links a[onclick]').forEach(link => {
        const onclickValue = link.getAttribute('onclick');
        link.removeAttribute('onclick');
        
        link.addEventListener('click', function(e) {
            e.preventDefault();
            storeCurrentScrollPosition(); // Store current position
            
            if (onclickValue.includes('showPage')) {
                const pageMatch = onclickValue.match(/showPage\('(\w+)'\)/);
                if (pageMatch) {
                    showPage(pageMatch[1], true, false); // Don't remember scroll for footer nav
                }
            } else if (onclickValue.includes('scrollToServices')) {
                scrollToServices();
            }
        });
    });
    
    // 3. Service cards - remember scroll when navigating to details
    document.querySelectorAll('.service-card').forEach(card => {
        const serviceId = card.getAttribute('data-service');
        card.addEventListener('click', (e) => {
            if (!e.target.closest('button, a')) {
                storeCurrentScrollPosition(); // Store before navigating
                if (serviceId) {
                    showServiceDetail(serviceId);
                }
            }
        });
    });
    
    // 4. Back buttons - enhanced to remember position
    document.querySelectorAll('.back-button').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            goBackToServices();
        });
    });
    
    // 5. Any other onclick navigation elements
    document.querySelectorAll('a[onclick*="showPage"]:not(.footer-links a), button[onclick*="showPage"]').forEach(element => {
        const onclickValue = element.getAttribute('onclick');
        element.removeAttribute('onclick');
        
        element.addEventListener('click', function(e) {
            e.preventDefault();
            storeCurrentScrollPosition();
            
            const pageMatch = onclickValue.match(/showPage\('(\w+)'\)/);
            if (pageMatch) {
                showPage(pageMatch[1], true, true); // Remember scroll for other nav
            }
        });
    });
}

// ContactFormHandler class (unchanged)
class ContactFormHandler {
    constructor() {
        this.form = document.getElementById('contactForm');
        this.formContainer = document.querySelector('.contact-form');
        this.submissionScreen = document.getElementById('submissionScreen');
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
        document.getElementById('customerName').textContent = `Hello, ${customerData.name}!`;
        document.getElementById('customerEmail').textContent = `We'll contact you at: ${customerData.email}`;

        this.formContainer.classList.add('hidden');
        
        setTimeout(() => {
            this.submissionScreen.classList.add('active');
        }, 300);

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

// Utility functions (unchanged)
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
    showPage('contact', true, false);
}

function scrollToServices() {
    showPage('home', true, false);
    setTimeout(() => {
        const servicesSection = document.getElementById('our-services');
        if (servicesSection) {
            servicesSection.scrollIntoView({ behavior: 'smooth' });
        }
    }, 100);
}

function setupQuoteButtons() {
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

// MAIN INITIALIZATION
document.addEventListener('DOMContentLoaded', function () {
    window.contactHandler = new ContactFormHandler();
    enhanceFormValidation();
    updateServiceFromURL();
    checkApiHealth();

    // Initialize scroll memory system
    initializeScrollMemory();

    // Logo click
    document.querySelector('.logo-section').addEventListener('click', function(e) {
        e.preventDefault();
        storeCurrentScrollPosition();
        showPage('home', true, false);
    });

    // Setup ALL navigation (this replaces both setupScrollAwareNavigation and setupAllNavigation)
    setupAllNavigation();

    // Setup quote buttons
    setupQuoteButtons();

    // Services link from nav
    const servicesLink = document.getElementById('services-link');
    if (servicesLink) {
        servicesLink.addEventListener('click', (event) => {
            event.preventDefault();
            storeCurrentScrollPosition();
            scrollToServices();
        });
    }

    // Handle initial page load from URL hash
    const initialPage = window.location.hash.slice(1) || 'home';
    if (initialPage !== 'home') {
        showPage(initialPage, false, true);
    }

    console.log('🚀 Kaizen Repair website with enhanced scroll memory initialized!');
});