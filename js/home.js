import { createElement } from './ui.js';
import { getJobs, getCompanies } from './repository.js';
import { sortJobs } from './Job.js';
import { renderJobs } from './job-cards.js';

export function initHome() {
    const jobs = getJobs();
    const container = document.getElementById("category-list");
    container.replaceChildren();

    for (const category of window.JobFinderData.categories) {
        const count = jobs.filter(job => job.category === category.name).length;
        const link = createElement("a", "category-card");
        link.href = `jobs.html?category=${encodeURIComponent(category.name)}`;

        const icon = createElement("span", "cat-icon", category.icon);
        icon.setAttribute("aria-hidden", "true");

        link.append(
            icon,
            createElement("h3", "", category.name),
            createElement("p", "", `${count} open ${count === 1 ? "position" : "positions"}`)
        );

        container.append(link);
    }

    document.getElementById("home-stats").textContent =
        `${jobs.length} loaded vacancies · ${getCompanies().length} companies · Demo and Remotive listings`;

    renderJobs(sortJobs(jobs, "newest").slice(0, 3), document.getElementById("featured-jobs"));

    document.getElementById("home-search").onsubmit = event => {
        event.preventDefault();

        const query = document.getElementById("home-query").value.trim();
        const params = new URLSearchParams();

        if (query) {
            params.set("search", query);
        }

        window.location.href = `jobs.html${params.size ? `?${params}` : ""}`;
    };
}
