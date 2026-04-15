const THEME_KEY = "theme";

function getPreferredTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY);
    if (savedTheme === "light" || savedTheme === "dark") {
        return savedTheme;
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function updateThemeButton(theme) {
    const themeBtn = document.getElementById("theme-toggle");
    if (!themeBtn) {
        return;
    }

    const darkMode = theme === "dark";
    themeBtn.textContent = darkMode ? "🌞" : "🌙";
    themeBtn.setAttribute("aria-label", darkMode ? "Switch to light mode" : "Switch to dark mode");
    themeBtn.classList.add("spin");
    setTimeout(() => themeBtn.classList.remove("spin"), 260);
}

function applyTheme(theme) {
    const darkMode = theme === "dark";
    document.body.classList.toggle("dark", darkMode);
    document.documentElement.setAttribute("data-theme", theme);
    updateThemeButton(theme);
}

function toggleTheme() {
    const nextTheme = document.body.classList.contains("dark") ? "light" : "dark";
    localStorage.setItem(THEME_KEY, nextTheme);
    applyTheme(nextTheme);
}

function toggleMobileMenu() {
    const menuToggle = document.getElementById("menuToggle");
    const navMenu = document.getElementById("navMenu");

    if (!menuToggle || !navMenu) {
        return;
    }

    const isOpen = navMenu.classList.toggle("active");
    menuToggle.classList.toggle("active", isOpen);
    menuToggle.setAttribute("aria-expanded", String(isOpen));
}

function closeMobileMenu() {
    const menuToggle = document.getElementById("menuToggle");
    const navMenu = document.getElementById("navMenu");

    if (!menuToggle || !navMenu) {
        return;
    }

    menuToggle.classList.remove("active");
    navMenu.classList.remove("active");
    menuToggle.setAttribute("aria-expanded", "false");
}

function updateNavbarOnScroll() {
    const navbar = document.getElementById("navbar");
    if (!navbar) {
        return;
    }
    navbar.classList.toggle("scrolled", window.scrollY > 20);
}

function setActiveNavLink(targetId) {
    const links = document.querySelectorAll('.nav-link[href^="#"]');
    links.forEach((link) => {
        const isActive = link.getAttribute("href") === `#${targetId}`;
        link.classList.toggle("active", isActive);
        if (isActive) {
            link.setAttribute("aria-current", "page");
        } else {
            link.removeAttribute("aria-current");
        }
    });
}

function updateActiveNavLinkOnScroll() {
    const sections = document.querySelectorAll("main section[id]");
    if (!sections.length) {
        return;
    }

    const navbar = document.getElementById("navbar");
    const offset = (navbar ? navbar.offsetHeight : 72) + 24;
    let activeId = sections[0].id;

    sections.forEach((section) => {
        if (window.scrollY >= section.offsetTop - offset) {
            activeId = section.id;
        }
    });

    setActiveNavLink(activeId);
}

document.addEventListener("DOMContentLoaded", () => {
    applyTheme(getPreferredTheme());

    const themeBtn = document.getElementById("theme-toggle");
    if (themeBtn) {
        themeBtn.addEventListener("click", toggleTheme);
    }

    const menuToggle = document.getElementById("menuToggle");
    if (menuToggle) {
        menuToggle.addEventListener("click", toggleMobileMenu);
    }

    const navLinks = document.querySelectorAll(".nav-link");
    navLinks.forEach((link) => {
        link.addEventListener("click", () => {
            closeMobileMenu();
            const sectionId = link.getAttribute("href")?.replace("#", "");
            if (sectionId) {
                setActiveNavLink(sectionId);
            }
        });
    });

    document.addEventListener("click", (event) => {
        const menu = document.getElementById("navMenu");
        const toggle = document.getElementById("menuToggle");
        if (!menu || !toggle || !menu.classList.contains("active")) {
            return;
        }

        if (!menu.contains(event.target) && !toggle.contains(event.target)) {
            closeMobileMenu();
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeMobileMenu();
        }
    });

    window.addEventListener("scroll", () => {
        updateNavbarOnScroll();
        updateActiveNavLinkOnScroll();
    });

    updateNavbarOnScroll();
    updateActiveNavLinkOnScroll();
});

window.toggleTheme = toggleTheme;

