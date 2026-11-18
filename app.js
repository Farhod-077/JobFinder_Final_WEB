import { renderShell, initTheme } from './js/ui.js';
import { initCounters } from './js/forms.js';
import { updateSavedButtons } from './js/job-cards.js';
import { getJobs, getCustomJobs, getFavorites } from './js/repository.js';
import { initHome } from './js/home.js';
import { initJobs } from './js/jobs.js';
import { initCompanies } from './js/companies.js';
import { initPostForm } from './js/post-job.js';
import { initContactForm } from './js/contact.js';
import { renderDashboard } from './js/dashboard.js';
import { setupRemoteData } from './js/remote.js';
import { state } from './js/state.js';

const pages = {
    home: initHome,
    jobs: initJobs,
    companies: initCompanies,
    post: initPostForm,
    contact: initContactForm,
    dashboard: () => renderDashboard(getJobs, getCustomJobs, getFavorites)
};

document.addEventListener('DOMContentLoaded', () => {
    renderShell(updateSavedButtons);
    initTheme();
    initCounters();
    const page = document.body.dataset.page;
    state.refreshPage = pages[page] || (() => {});
    state.refreshPage();
    if (['home', 'jobs', 'companies', 'dashboard'].includes(page)) setupRemoteData();
});
