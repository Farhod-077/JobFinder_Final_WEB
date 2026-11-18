import { createElement } from './ui.js';
import { getJobs, getCompanies } from './repository.js';

export function initCompanies() {
    const search = document.getElementById("company-search");
    const container = document.getElementById("company-list");

    function renderCompanies() {
        const query = search.value.trim().toLowerCase();

        const companies = getCompanies().filter(company =>
            `${company.name} ${company.industry}`.toLowerCase().includes(query)
        );

        container.replaceChildren();

        for (const company of companies) {
            const count = getJobs().filter(job => job.companyId === company.id).length;
            const card = createElement("article", "company-card");
            const logo = createElement("div", "company-logo", company.name.charAt(0));
            logo.setAttribute("aria-hidden", "true");

            const link = createElement(
                "a",
                "btn btn-outline-primary",
                `${count} Open ${count === 1 ? "Job" : "Jobs"} →`
            );

            link.href = `jobs.html?company=${encodeURIComponent(company.id)}`;

            card.append(
                logo,
                createElement("h3", "", company.name),
                createElement("p", "tag", company.industry),
                createElement("p", "company-description", company.description),
                link
            );

            container.append(card);
        }

        document.getElementById("company-count").textContent =
            `${companies.length} ${companies.length === 1 ? "company" : "companies"} found`;

        document.getElementById("company-empty").hidden = companies.length > 0;
    }

    search.oninput = renderCompanies;
    renderCompanies();
}
