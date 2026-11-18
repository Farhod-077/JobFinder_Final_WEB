import { showNotice } from "./ui.js";

export function validateValues(values, kind) {
        const errors = {};

        function checkLength(name, label, min, max) {
            const value = String(values[name] || "").trim();

            if (!value) {
                errors[name] = `${label} is required.`;
            } else if (value.length < min || value.length > max) {
                errors[name] = `${label} must contain ${min}–${max} characters.`;
            }
        }

        function checkEmail(name) {
            const email = String(values[name] || "").trim();

            if (!email) {
                errors[name] = "Email is required.";
            } else if (email.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
                errors[name] = "Enter a valid email address.";
            }
        }

        if (kind === "post") {
            checkLength("title", "Job title", 3, 80);
            checkLength("company", "Company name", 2, 80);
            checkLength("location", "Location", 2, 60);
            checkLength("description", "Description", 50, 2000);
            if (!document.getElementById("email")?.disabled) checkEmail("email");

            if (!window.JobFinderData.categories.some(category => category.name === values.category)) {
                errors.category = "Select a category.";
            }

            if (!["Full-time", "Part-time", "Internship"].includes(values.employmentType)) {
                errors.employmentType = "Select an employment type.";
            }

            if (!["Office", "Hybrid", "Remote"].includes(values.workMode)) {
                errors.workMode = "Select a work mode.";
            }

            const salary = Number(values.salary);

            if (!values.salary || !Number.isInteger(salary) || salary < 1 || salary > 100000) {
                errors.salary = "Enter a whole monthly salary from 1 to 100,000 USD.";
            }
        } else {
            checkLength("fullName", "Full name", 2, 80);
            checkLength("message", "Message", 20, 1000);
            checkEmail("contactEmail");

            if (!["Finding a job", "Posting a job", "Technical issue", "Other"].includes(values.subject)) {
                errors.subject = "Select a subject.";
            }

            if (!values.consent) {
                errors.consent = "Please confirm that you understand the demo mode.";
            }
        }

        return errors;
    }

export function getFormValues(form) {
        return Object.fromEntries(
            [...new FormData(form).entries()].map(([name, value]) => [
                name,
                typeof value === "string" ? value.trim() : value
            ])
        );
    }

export function showFieldError(field, message) {
        const error = document.getElementById(`${field.id}-error`);

        field.classList.toggle("is-invalid", Boolean(message));
        field.setAttribute("aria-invalid", String(Boolean(message)));

        if (error) {
            error.textContent = message || "";
        }
    }

export function setupValidation(form, kind, successCallback) {
        let submitted = false;

        const fields = [...form.querySelectorAll("input[name], select[name], textarea[name]")];

        function validateAll() {
            const values = getFormValues(form);
            const errors = validateValues(values, kind);

            fields.forEach(field => showFieldError(field, errors[field.name]));

            return { values, errors };
        }

        function handleEdit(event) {
            const success = document.getElementById(`${kind === "post" ? "post" : "contact"}-success`);
            success.hidden = true;

            if (submitted && event.target.matches("input, select, textarea")) {
                const errors = validateValues(getFormValues(form), kind);
                showFieldError(event.target, errors[event.target.name]);
            }
        }

        form.addEventListener("input", handleEdit);
        form.addEventListener("change", handleEdit);

        form.addEventListener("submit", event => {
            event.preventDefault();
            submitted = true;

            const { values, errors } = validateAll();

            if (Object.keys(errors).length > 0) {
                const firstInvalid = fields.find(field => errors[field.name]);
                firstInvalid.focus();
                showNotice("Please correct the highlighted fields.");
                return;
            }

            if (successCallback(values) === false) return;
            form.reset();
            submitted = false;

            fields.forEach(field => {
                field.classList.remove("is-invalid");
                field.removeAttribute("aria-invalid");
            });

            updateCounters();
        });
    }

export function updateCounters() {
        for (const id of ["description", "message"]) {
            const field = document.getElementById(id);
            const counter = document.getElementById(`${id}-count`);

            if (field && counter) {
                counter.textContent = `${field.value.length} / ${field.maxLength}`;
            }
        }
    }

export function initCounters() {
        for (const id of ["description", "message"]) {
            const field = document.getElementById(id);

            if (field) {
                field.addEventListener("input", updateCounters);
            }
        }

        updateCounters();
    }

