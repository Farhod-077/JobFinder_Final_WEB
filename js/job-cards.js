import { createElement, showNotice } from './ui.js';
import { keys, writeStorage } from './storage.js';
import { getFavorites, getCustomJobs, getCompanyName } from './repository.js';
import { state } from './state.js';

export function updateSavedButtons() {
    const favorites = new Set(getFavorites());

    document.querySelectorAll("[data-save-id]").forEach(button => {
        const saved = favorites.has(button.dataset.saveId);
        button.textContent = saved ? "Saved ✓" : "Save Job";
        button.setAttribute("aria-pressed", String(saved));
        button.classList.toggle("btn-primary", saved);
        button.classList.toggle("btn-outline-primary", !saved);
    });

    const count = document.getElementById("saved-count");

    if (count) {
        count.textContent = String(favorites.size);
    }
}

function toggleFavorite(jobId) {
    const favorites = getFavorites();
    const alreadySaved = favorites.includes(jobId);

    const updated = alreadySaved
        ? favorites.filter(id => id !== jobId)
        : [...favorites, jobId];

    const persisted = writeStorage(keys.favorites, updated);
    if (!persisted) { showNotice("Could not save your change. Browser storage is unavailable."); return; }

    updateSavedButtons();
    state.refreshJobs();

    const message = alreadySaved
        ? "Job removed from saved jobs."
        : "Job added to saved jobs.";

    showNotice(persisted ? message : `${message} Storage unavailable: this page only.`);
}

function createJobCard(job) {
    const article = createElement("article", "job-card");
    const top = createElement("div", "job-card-top");
    const heading = createElement("div");
    const companyName = getCompanyName(job);

    heading.append(
        createElement("h3", "", job.title),
        createElement("p", "job-company", companyName),
        createElement("p", "job-location", job.location)
    );

    const logo = createElement("div", "company-logo", companyName.charAt(0));
    logo.setAttribute("aria-hidden", "true");
    top.append(heading, logo);

    const tags = createElement("div", "tags");

    for (const value of [job.category, job.employmentType, job.workMode]) {
        tags.append(createElement("span", "tag", value));
    }

    const salary = createElement("p", "salary", job.getSalaryLabel());
    const date = createElement(
        "p",
        "job-date",
        Number.isFinite(Date.parse(job.createdAt)) ? `Posted ${new Date(job.createdAt).toLocaleDateString("en-GB")}` : "Publication date unavailable"
    );

    const actions = createElement("div", "card-actions");
    const saveButton = createElement("button", "btn btn-outline-primary", "Save Job");
    saveButton.type = "button";
    saveButton.dataset.saveId = job.id;
    saveButton.setAttribute("aria-pressed", "false");
    saveButton.addEventListener("click", () => toggleFavorite(job.id));

    const detailsButton = createElement("button", "btn btn-outline-secondary", "View Details");
    detailsButton.type = "button";
    detailsButton.setAttribute("aria-expanded", "false");

    const description = createElement("p", "job-description", job.description);
    description.id = `description-${job.id}`;
    description.hidden = true;
    detailsButton.setAttribute("aria-controls", description.id);

    detailsButton.addEventListener("click", event => {
        description.hidden = !description.hidden;
        event.currentTarget.setAttribute("aria-expanded", String(!description.hidden));
        event.currentTarget.textContent = description.hidden ? "View Details" : "Hide Details";
    });

    actions.append(saveButton, detailsButton);
    tags.append(createElement('span', 'tag source-tag', { api: 'Remotive', demo: 'Demo', custom: 'My Job' }[job.source]));
    if (job.source === 'api') {
        const original = createElement('a', 'btn btn-outline-primary', 'View on Remotive ↗');
        original.href = job.url;
        original.target = '_blank';
        original.rel = 'noopener noreferrer';
        actions.append(original);
    }
    if (job.isEditable()) {
        const edit = createElement('a', 'btn btn-outline-secondary', 'Edit');
        edit.href = 'post-job.html?edit=' + encodeURIComponent(job.id);
        actions.append(edit);
    }

    if (job.id.startsWith("custom-")) {
        const deleteButton = createElement("button", "btn btn-outline-danger", "Delete My Job");
        deleteButton.type = "button";

        deleteButton.addEventListener("click", () => {
            if (!window.confirm(`Delete "${job.title}" from this browser?`)) {
                return;
            }

            const remainingJobs = getCustomJobs().filter(item => item.id !== job.id);
            const jobsSaved = writeStorage(keys.jobs, remainingJobs);
            if (!jobsSaved) { showNotice('Could not delete this job. Browser storage is unavailable.'); return; }
            const favoritesSaved = writeStorage(keys.favorites, getFavorites().filter(id => id !== job.id));

            article.remove();
            state.refreshPage();
            updateSavedButtons();

            showNotice(
                jobsSaved && favoritesSaved
                    ? "Your demo job was deleted."
                    : "Removed on this page. Storage is unavailable."
            );
        });

        actions.append(deleteButton);
    }

    article.append(top, tags, salary, date, actions, description);
    return article;
}

export function renderJobs(jobs, container) {
    const fragment = document.createDocumentFragment();

    for (const job of jobs) {
        fragment.append(createJobCard(job));
    }

    container.replaceChildren(fragment);
    updateSavedButtons();
}

export function renderTable(jobs) {
    const body = document.getElementById("jobs-table-body");
    const fragment = document.createDocumentFragment();

    for (const job of jobs) {
        const row = createElement("tr");

        for (const value of [
            job.title,
            getCompanyName(job),
            job.location,
            job.employmentType,
            job.workMode,
            job.getSalaryLabel()
        ]) {
            row.append(createElement("td", "", value));
        }

        fragment.append(row);
    }

    if (jobs.length === 0) {
        const row = createElement("tr");
        const cell = createElement("td", "text-center", "No matching jobs.");
        cell.colSpan = 6;
        row.append(cell);
        fragment.append(row);
    }

    body.replaceChildren(fragment);
}
