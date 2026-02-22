// ==================== Tips Page Functions ====================

document.addEventListener('DOMContentLoaded', () => {
    initFilterTabs();
    loadChecklistState();
});

// Filter functionality
function initFilterTabs() {
    const tabs = document.querySelectorAll('.filter-tab');
    const cards = document.querySelectorAll('.tip-card');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Update active tab
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            const category = tab.dataset.category;
            
            // Filter cards
            cards.forEach(card => {
                if (category === 'all' || card.dataset.category === category) {
                    card.classList.remove('hidden');
                    card.style.animation = 'fadeInUp 0.3s ease-out';
                } else {
                    card.classList.add('hidden');
                }
            });
        });
    });
}

// Save checklist state to localStorage
function loadChecklistState() {
    const checkboxes = document.querySelectorAll('.checklist input[type="checkbox"]');
    
    checkboxes.forEach(checkbox => {
        // Load saved state
        const saved = localStorage.getItem(`checklist_${checkbox.id}`);
        if (saved === 'true') {
            checkbox.checked = true;
        }
        
        // Save state on change
        checkbox.addEventListener('change', () => {
            localStorage.setItem(`checklist_${checkbox.id}`, checkbox.checked);
        });
    });
}

// Reset all checklists
function resetChecklists() {
    const checkboxes = document.querySelectorAll('.checklist input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
        localStorage.removeItem(`checklist_${checkbox.id}`);
    });
}
