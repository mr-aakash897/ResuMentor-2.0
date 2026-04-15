function redirectToResume() {
    const token = localStorage.getItem("jwtToken");
    if (token) {
        window.location.href = "/pages/resume-analyzer.html";
    } else {
        showLoginModal();
    }
}

function redirectToInterview() {
    const token = localStorage.getItem("jwtToken");
    if (token) {
        window.location.href = "/pages/interview.html";
    } else {
        showLoginModal();
    }
}

function handleContactForm(event) {
    event.preventDefault();
    const form = event.target;
    const successCard = document.getElementById("feedbackSuccessCard");

    const name = form.querySelector('input[name="name"]')?.value.trim() || "";
    const email = form.querySelector('input[name="email"]')?.value.trim() || "";
    const message = form.querySelector('textarea[name="message"]')?.value.trim() || "";

    if (!name || !email || !message) {
        if (successCard) {
            successCard.hidden = true;
        }
        if (typeof Toast !== "undefined" && Toast.error) {
            Toast.error("Please fill name, email, and feedback message.");
        }
        return;
    }

    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!isValidEmail) {
        if (successCard) {
            successCard.hidden = true;
        }
        if (typeof Toast !== "undefined" && Toast.error) {
            Toast.error("Please enter a valid email address.");
        }
        return;
    }

    if (message.length < 10) {
        if (successCard) {
            successCard.hidden = true;
        }
        if (typeof Toast !== "undefined" && Toast.error) {
            Toast.error("Please add a little more detail in your feedback.");
        }
        return;
    }

    if (typeof Toast !== "undefined" && Toast.success) {
        Toast.success("Thanks for the feedback! We will review it soon.");
    }

    if (successCard) {
        successCard.hidden = false;
    }

    form.reset();
}

function initFeedbackFormState() {
    const feedbackForm = document.querySelector(".feedback-form");
    const successCard = document.getElementById("feedbackSuccessCard");
    if (!feedbackForm || !successCard) {
        return;
    }

    feedbackForm.addEventListener("input", () => {
        if (!successCard.hidden) {
            successCard.hidden = true;
        }
    });
}

function initRevealAnimations() {
    const revealItems = document.querySelectorAll(".reveal");
    if (!revealItems.length) {
        return;
    }

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("visible");
                    observer.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.15 }
    );

    revealItems.forEach((item) => observer.observe(item));
}

function updateAuthButtonState() {
    const token = localStorage.getItem("jwtToken");
    const loginBtn = document.getElementById("login-btn");
    if (!loginBtn) {
        return;
    }

    if (token) {
        loginBtn.textContent = "Dashboard";
        loginBtn.onclick = () => {
            window.location.href = "/pages/dashboard.html";
        };
    }
}

function initSmoothAnchors() {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener("click", function (event) {
            const hash = this.getAttribute("href");
            if (!hash || hash === "#") {
                return;
            }

            const target = document.querySelector(hash);
            if (!target) {
                return;
            }

            event.preventDefault();
            target.scrollIntoView({ behavior: "smooth", block: "start" });
        });
    });
}

document.addEventListener("DOMContentLoaded", () => {
    updateAuthButtonState();
    initRevealAnimations();
    initSmoothAnchors();
    initFeedbackFormState();
});

window.redirectToResume = redirectToResume;
window.redirectToInterview = redirectToInterview;
window.handleContactForm = handleContactForm;

function toggleFaq(button) {
    const faqItem = button.parentElement;
    const isActive = faqItem.classList.contains("active");
    document.querySelectorAll(".faq-item").forEach((item) => item.classList.remove("active"));
    if (!isActive) {
        faqItem.classList.add("active");
    }
}

window.toggleFaq = toggleFaq;

