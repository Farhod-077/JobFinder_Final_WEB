import { keys, readStorage, writeStorage } from "./storage.js";
let noticeTimer;

export function createElement(tag, className = "", text = "") {
        const element = document.createElement(tag);

        if (className) {
            element.className = className;
        }

        element.textContent = text;
        return element;
    }

export function showNotice(message) {
        const notice = document.getElementById("notice");

        if (!notice) {
            return;
        }

        clearTimeout(noticeTimer);
        notice.textContent = message;
        notice.hidden = false;

        noticeTimer = setTimeout(() => {
            notice.hidden = true;
        }, 5000);
    }

export function formatSalary(salary) {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 0
        }).format(salary);
    }

export function populateSelect(select, values) {
        const placeholder = select.options[0].cloneNode(true);
        select.replaceChildren(placeholder);

        for (const value of values) {
            const option = createElement("option");

            if (typeof value === "string") {
                option.value = value;
                option.textContent = value;
            } else {
                option.value = value.value;
                option.textContent = value.label;
            }

            select.append(option);
        }
    }

export function renderShell(updateSavedButtons) {
        const page = document.body.dataset.page;
        const header = document.getElementById("site-header");

        header.innerHTML = `
            <nav class="navbar navbar-expand-xl" aria-label="Main navigation">
                <div class="container">
                    <a class="navbar-brand" href="index.html">
                        <span class="brand-mark" aria-hidden="true">J</span>
                        JobFinder
                    </a>
                    <button class="navbar-toggler" type="button"
                            data-bs-toggle="collapse" data-bs-target="#main-navigation"
                            aria-controls="main-navigation" aria-expanded="false"
                            aria-label="Toggle navigation">
                        <span class="navbar-toggler-icon"></span>
                    </button>
                    <div class="collapse navbar-collapse" id="main-navigation">
                        <ul class="navbar-nav mx-auto gap-xl-2">
                            <li class="nav-item">
                                <a class="nav-link" data-page-link="home" href="index.html">Home</a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" data-page-link="jobs" href="jobs.html">Find a Job</a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" data-page-link="companies" href="companies.html">Companies</a>
                            </li>
                            <li class="nav-item"><a class="nav-link" data-page-link="dashboard" href="dashboard.html">Dashboard</a></li>
                            <li class="nav-item">
                                <a class="nav-link" data-page-link="contact" href="contact.html">Contact Us</a>
                            </li>
                        </ul>
                        <div class="header-actions">
                            <a class="btn btn-outline-primary" href="jobs.html?saved=1">
                                Saved <span id="saved-count">0</span>
                            </a>
                            <button id="theme-toggle" class="btn btn-outline-secondary"
                                    type="button" aria-pressed="false">Dark Mode</button>
                            <a class="btn btn-primary" data-page-link="post"
                               href="post-job.html">Post a Job</a>
                        </div>
                    </div>
                </div>
            </nav>
        `;

        document.querySelectorAll("[data-page-link]").forEach(link => {
            if (link.dataset.pageLink === page) {
                link.classList.add("active");
                link.setAttribute("aria-current", "page");
            }
        });

        document.getElementById("site-footer").innerHTML = `
            <div class="container">
                <div class="footer-content">
                    <div>
                        <h2>JobFinder</h2>
                        <p>We connect talent with opportunities.</p>
                        <p>Demo listings and local vacancies are marked. Remote vacancies are provided by Remotive.</p>
                    </div>
                    <div>
                        <h3>Explore</h3>
                        <a href="jobs.html">Browse Jobs</a>
                        <a href="companies.html">Browse Companies</a>
                        <a href="dashboard.html">Dashboard</a>
                        <a href="jobs.html?saved=1">Saved Jobs</a>
                    </div>
                    <div>
                        <h3>Get Started</h3>
                        <a href="post-job.html">Post a Job</a>
                        <a href="contact.html">Contact Us</a>
                    </div>
                </div>
                <div class="footer-bottom">
                    © ${new Date().getFullYear()} JobFinder. Web Technologies Final Project.
                </div>
            </div>
        `;

        updateSavedButtons();

        document.addEventListener("keydown", event => {
            if (event.key !== "Escape") {
                return;
            }

            const navigation = document.getElementById("main-navigation");

            if (navigation.classList.contains("show") && window.bootstrap) {
                bootstrap.Collapse.getOrCreateInstance(navigation, { toggle: false }).hide();
                document.querySelector(".navbar-toggler").focus();
            }
        });
    }

export function initTheme() {
        const button = document.getElementById("theme-toggle");

    function applyTheme(theme) {
            document.documentElement.setAttribute("data-bs-theme", theme);
            button.textContent = theme === "dark" ? "Light Mode" : "Dark Mode";
            button.setAttribute("aria-pressed", String(theme === "dark"));
        }

        applyTheme(readStorage(keys.theme, "light") === "dark" ? "dark" : "light");

        button.addEventListener("click", () => {
            const theme = document.documentElement.getAttribute("data-bs-theme") === "dark"
                ? "light"
                : "dark";

            applyTheme(theme);

            if (!writeStorage(keys.theme, theme)) {
                showNotice("Theme changed. Storage unavailable: this page only.");
            }
        });
    }

