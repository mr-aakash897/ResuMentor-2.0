// ==================== Toast Notification System ====================
class Toast {
    static container = null;
    
    static init() {
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        }
    }
    
    static show(options) {
        this.init();
        
        const {
            type = 'info',
            title = '',
            message = '',
            duration = 4000,
            showProgress = true
        } = options;
        
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <span class="toast-icon">${icons[type]}</span>
            <div class="toast-content">
                ${title ? `<div class="toast-title">${title}</div>` : ''}
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">×</button>
            ${showProgress ? '<div class="toast-progress"></div>' : ''}
        `;
        
        this.container.appendChild(toast);
        
        // Auto remove after duration
        if (duration > 0) {
            setTimeout(() => {
                toast.style.animation = 'toastSlideOut 0.3s ease forwards';
                setTimeout(() => toast.remove(), 300);
            }, duration);
        }
        
        return toast;
    }
    
    static success(message, title = 'Success') {
        return this.show({ type: 'success', title, message });
    }
    
    static error(message, title = 'Error') {
        return this.show({ type: 'error', title, message });
    }
    
    static warning(message, title = 'Warning') {
        return this.show({ type: 'warning', title, message });
    }
    
    static info(message, title = 'Info') {
        return this.show({ type: 'info', title, message });
    }
}

// ==================== Counter Animation ====================
function animateCounters() {
    const counters = document.querySelectorAll('.stat-item h3');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
                entry.target.classList.add('counted');
                animateCounter(entry.target);
            }
        });
    }, { threshold: 0.5 });
    
    counters.forEach(counter => observer.observe(counter));
}

function animateCounter(element) {
    const text = element.textContent;
    const hasPlus = text.includes('+');
    const hasPercent = text.includes('%');
    const hasK = text.includes('K');
    const hasM = text.includes('M');
    
    let targetValue = parseFloat(text.replace(/[^0-9.]/g, ''));
    
    // Convert K to actual thousands for animation
    if (hasK) targetValue = targetValue * 1000;
    if (hasM) targetValue = targetValue * 1000000;
    
    const duration = 2000;
    const startTime = performance.now();
    const startValue = 0;
    
    function easeOutQuart(t) {
        return 1 - Math.pow(1 - t, 4);
    }
    
    function updateCounter(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easeOutQuart(progress);
        
        let currentValue = startValue + (targetValue - startValue) * easedProgress;
        
        // Format the number
        let displayValue;
        if (hasM || currentValue >= 1000000) {
            displayValue = (currentValue / 1000000).toFixed(currentValue >= 1000000 ? 0 : 1);
            if (hasM) displayValue += 'M';
        } else if (hasK || currentValue >= 1000) {
            displayValue = Math.floor(currentValue / 1000);
            if (hasK) displayValue += 'K';
        } else if (hasPercent) {
            displayValue = Math.floor(currentValue);
        } else {
            displayValue = Math.floor(currentValue);
        }
        
        if (hasPlus) displayValue += '+';
        if (hasPercent) displayValue += '%';
        
        element.textContent = displayValue;
        
        if (progress < 1) {
            requestAnimationFrame(updateCounter);
        }
    }
    
    requestAnimationFrame(updateCounter);
}

// ==================== Scroll to Top Button ====================
function initScrollToTop() {
    // Create button if it doesn't exist
    let scrollBtn = document.querySelector('.scroll-to-top');
    if (!scrollBtn) {
        scrollBtn = document.createElement('button');
        scrollBtn.className = 'scroll-to-top';
        scrollBtn.innerHTML = '↑';
        scrollBtn.setAttribute('aria-label', 'Scroll to top');
        scrollBtn.onclick = () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        };
        document.body.appendChild(scrollBtn);
    }
    
    // Show/hide based on scroll position
    window.addEventListener('scroll', () => {
        if (window.scrollY > 400) {
            scrollBtn.classList.add('visible');
        } else {
            scrollBtn.classList.remove('visible');
        }
    });
}

// ==================== Skeleton Loader Helpers ====================
const Skeleton = {
    // Create a skeleton card
    card(count = 1) {
        let html = '';
        for (let i = 0; i < count; i++) {
            html += `
                <div class="skeleton-card skeleton">
                    <div class="skeleton skeleton-title"></div>
                    <div class="skeleton skeleton-text long"></div>
                    <div class="skeleton skeleton-text medium"></div>
                    <div class="skeleton skeleton-text short"></div>
                </div>
            `;
        }
        return html;
    },
    
    // Create skeleton stat cards
    stats(count = 4) {
        let html = '<div class="stats-grid">';
        for (let i = 0; i < count; i++) {
            html += '<div class="skeleton skeleton-stat"></div>';
        }
        html += '</div>';
        return html;
    },
    
    // Create skeleton table rows
    tableRows(count = 5, cols = 4) {
        let html = '';
        for (let i = 0; i < count; i++) {
            html += '<div class="skeleton-table-row">';
            for (let j = 0; j < cols; j++) {
                const width = 100 / cols;
                html += `<div class="skeleton" style="flex: ${j === 0 ? 2 : 1};"></div>`;
            }
            html += '</div>';
        }
        return html;
    },
    
    // Create profile skeleton
    profile() {
        return `
            <div class="profile-card">
                <div class="profile-header" style="display: flex; gap: 20px; align-items: center;">
                    <div class="skeleton skeleton-avatar"></div>
                    <div style="flex: 1;">
                        <div class="skeleton skeleton-title" style="width: 40%;"></div>
                        <div class="skeleton skeleton-text short"></div>
                        <div class="skeleton skeleton-text" style="width: 30%;"></div>
                    </div>
                </div>
            </div>
        `;
    }
};

// ==================== Initialize All UI Utils ====================
document.addEventListener('DOMContentLoaded', () => {
    // Initialize scroll to top button
    initScrollToTop();
    
    // Initialize counter animations (only on pages with stat-items)
    if (document.querySelector('.stat-item h3')) {
        animateCounters();
    }
});

// ==================== Override Browser Alert ====================
// Store original alert for fallback
const originalAlert = window.alert;

// Replace alert with toast
window.showAlert = function(message, type = 'info') {
    if (typeof Toast !== 'undefined') {
        switch(type) {
            case 'success':
                Toast.success(message);
                break;
            case 'error':
                Toast.error(message);
                break;
            case 'warning':
                Toast.warning(message);
                break;
            default:
                Toast.info(message);
        }
    } else {
        originalAlert(message);
    }
};
