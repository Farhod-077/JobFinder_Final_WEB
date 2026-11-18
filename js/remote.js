import { loadRemoteJobs, getCachedJobs } from './api.js';
import { state } from './state.js';

export function setupRemoteData() {
    const status = document.getElementById('api-status');
    const retry = document.getElementById('api-retry');
    let cooldown;
    async function load() {
        clearTimeout(cooldown);
        retry.hidden = true;
        retry.disabled = true;
        status.textContent = 'Loading remote jobs from Remotive…';
        status.parentElement.setAttribute('aria-busy', 'true');
        try {
            const result = await loadRemoteJobs();
            state.remoteJobs = result.jobs;
            state.refreshPage();
            status.textContent = result.jobs.length
                ? ''
                : 'Remotive returned no jobs. Demo and local jobs are still available.';
            if (result.persisted === false) status.textContent += ' Browser cache could not be saved.';
        } catch (error) {
            const cached = getCachedJobs();
            status.textContent = `${error.message} ${cached?.jobs.length ? 'Showing previously cached remote jobs; they may be outdated.' : 'Only demo and local jobs are available.'}`;
            retry.hidden = false;
            retry.textContent = 'Retry in 30 seconds';
            cooldown = setTimeout(() => { retry.disabled = false; retry.textContent = 'Retry'; }, 30000);
        } finally {
            status.parentElement.setAttribute('aria-busy', 'false');
        }
    }
    retry.onclick = load;
    load();
}
