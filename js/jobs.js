import { createElement, showNotice, populateSelect } from './ui.js';
import { keys, readStorage, writeStorage } from './storage.js';
import { sortJobs } from './Job.js';
import { getJobs, getCompanies, getFavorites, filterJobs, createId } from './repository.js';
import { renderJobs, renderTable, updateSavedButtons } from './job-cards.js';
import { state } from './state.js';

export function initJobs() {
    const form = document.getElementById('filters-form');
    const search = document.getElementById('job-search');
    const sort = document.getElementById('job-sort');
    const pageSize = document.getElementById('page-size');
    const fields = {
        search: 'job-search', location: 'filter-location', category: 'filter-category',
        company: 'filter-company', type: 'filter-type', mode: 'filter-mode',
        source: 'filter-source', minSalary: 'min-salary', maxSalary: 'max-salary'
    };
    let currentPage = 1;
    const params = new URLSearchParams(window.location.search);

    function updateOptions() {
        const jobs = getJobs();
        const values = {
            location: [...new Set(jobs.map(job => job.location))].sort(),
            category: [...new Set(jobs.map(job => job.category))].sort(),
            type: [...new Set(jobs.map(job => job.employmentType))].sort(),
            company: getCompanies().map(company => ({ value: company.id, label: company.name }))
        };
        for (const [key, options] of Object.entries(values)) {
            const select = document.getElementById(fields[key]);
            const previous = select.value;
            populateSelect(select, options);
            if (previous && ![...select.options].some(option => option.value === previous)) select.append(new Option(previous, previous));
            select.value = previous;
            if (select.selectedIndex < 0) select.selectedIndex = 0;
        }
    }

    function getFilters() {
        const filters = Object.fromEntries(Object.entries(fields).map(([key, id]) => [key, document.getElementById(id).value]));
        filters.savedOnly = document.getElementById('saved-only').checked;
        return filters;
    }

    function applyFilters(filters) {
        for (const [key, id] of Object.entries(fields)) {
            const element = document.getElementById(id);
            const value = typeof filters[key] === 'string' ? filters[key] : '';
            if (['location', 'category', 'company', 'type'].includes(key) && value && ![...element.options].some(option => option.value === value)) element.append(new Option(value, value));
            element.value = value;
            if (element.tagName === 'SELECT' && element.selectedIndex < 0) element.selectedIndex = 0;
        }
        document.getElementById('saved-only').checked = filters.savedOnly === true;
    }

    function syncUrl(filters) {
        const query = new URLSearchParams();
        for (const [key, value] of Object.entries(filters)) {
            if (value) query.set(key === 'savedOnly' ? 'saved' : key, key === 'savedOnly' ? '1' : value);
        }
        if (sort.value !== 'newest') query.set('sort', sort.value);
        history.replaceState(null, '', window.location.pathname + (query.size ? '?' + query : ''));
    }

    state.refreshJobs = () => {
        const filters = getFilters();
        const min = Number(filters.minSalary);
        const max = Number(filters.maxSalary);
        const invalid = min < 0 || max < 0 || (filters.minSalary && filters.maxSalary && min > max);
        document.getElementById('salary-filter-error').textContent = invalid ? 'Use positive values with minimum not greater than maximum.' : '';
        const sorted = invalid ? [] : sortJobs(filterJobs(getJobs(), filters), sort.value);
        const size = Number(pageSize.value);
        const totalPages = Math.max(1, Math.ceil(sorted.length / size));
        currentPage = Math.max(1, Math.min(currentPage, totalPages));
        const visible = sorted.slice((currentPage - 1) * size, currentPage * size);
        renderJobs(visible, document.getElementById('job-list'));
        renderTable(visible);
        document.getElementById('results-count').textContent = `${sorted.length} jobs found · ${visible.length} on this page`;
        document.getElementById('empty-state').hidden = sorted.length > 0;
        document.getElementById('page-label').textContent = `Page ${currentPage} of ${totalPages}`;
        document.getElementById('previous-page').disabled = currentPage === 1;
        document.getElementById('next-page').disabled = currentPage >= totalPages;
        document.getElementById('pagination').hidden = sorted.length === 0;
        const missing = getFavorites().filter(id => !getJobs().some(job => job.id === id)).length;
        document.getElementById('saved-unavailable').textContent = filters.savedOnly && missing ? `${missing} saved jobs are not in the current feed. Their saved IDs are kept.` : '';
        syncUrl(filters);
    };

    function changed() { currentPage = 1; state.refreshJobs(); }
    function resetFilters() { form.reset(); sort.value = 'newest'; changed(); search.focus(); }
    updateOptions();
    const initial = Object.fromEntries(params.entries());
    initial.savedOnly = params.get('saved') === '1';
    applyFilters(initial);
    if ([...sort.options].some(option => option.value === params.get('sort'))) sort.value = params.get('sort');
    form.addEventListener('input', changed);
    form.addEventListener('change', changed);
    form.addEventListener('submit', event => { event.preventDefault(); changed(); });
    sort.addEventListener('change', changed);
    pageSize.addEventListener('change', changed);
    document.getElementById('reset-filters').onclick = resetFilters;
    document.getElementById('empty-reset').onclick = resetFilters;
    document.getElementById('previous-page').onclick = () => { currentPage--; state.refreshJobs(); };
    document.getElementById('next-page').onclick = () => { currentPage++; state.refreshJobs(); };
    document.getElementById('clear-favorites').onclick = () => {
        if (!confirm('Clear all saved jobs?')) return;
        if (!writeStorage(keys.favorites, [])) { showNotice('Could not clear saved jobs.'); return; }
        updateSavedButtons(); state.refreshJobs(); showNotice('Saved jobs cleared.');
    };

    function getSearches() {
        const stored = readStorage(keys.searches, []);
        return Array.isArray(stored) ? stored.filter(item => item && typeof item.id === 'string' && typeof item.name === 'string' && item.filters && typeof item.filters === 'object').slice(0, 20) : [];
    }

    function renderSearches() {
        const container = document.getElementById('saved-search-list');
        container.replaceChildren();
        const searches = getSearches();
        if (!searches.length) container.append(createElement('p', 'muted', 'No saved searches yet.'));
        for (const item of searches) {
            const row = createElement('div', 'saved-search-row');
            const apply = createElement('button', 'btn btn-sm btn-outline-primary', item.name);
            apply.type = 'button';
            apply.onclick = () => {
                applyFilters(item.filters);
                sort.value = ['newest', 'title', 'salary-asc', 'salary-desc'].includes(item.sort) ? item.sort : 'newest';
                changed(); showNotice('Saved search applied.');
            };
            const rename = createElement('button', 'btn btn-sm btn-outline-secondary', 'Rename');
            rename.type = 'button';
            rename.onclick = () => {
                const name = prompt('Search name (1–40 characters):', item.name);
                if (name === null) return;
                if (!name.trim() || name.trim().length > 40) { showNotice('Enter 1–40 characters.'); return; }
                const updated = getSearches().map(entry => entry.id === item.id ? { ...entry, name: name.trim() } : entry);
                if (!writeStorage(keys.searches, updated)) { showNotice('Could not rename search.'); return; }
                renderSearches();
            };
            const remove = createElement('button', 'btn btn-sm btn-outline-danger', 'Delete');
            remove.type = 'button';
            remove.onclick = () => {
                if (!confirm('Delete this saved search?')) return;
                if (!writeStorage(keys.searches, getSearches().filter(entry => entry.id !== item.id))) { showNotice('Could not delete search.'); return; }
                renderSearches();
            };
            row.append(apply, rename, remove);
            container.append(row);
        }
    }
    document.getElementById('save-search-form').onsubmit = event => {
        event.preventDefault();
        const input = document.getElementById('search-name');
        const name = input.value.trim();
        if (!name || name.length > 40) { showNotice('Enter a search name of 1–40 characters.'); input.focus(); return; }
        const searches = getSearches();
        if (searches.length >= 20) { showNotice('Delete an old search first. Maximum: 20.'); return; }
        if (document.getElementById('salary-filter-error').textContent) { showNotice('Correct the salary range first.'); return; }
        const result = [...searches, { id: createId(), name, filters: getFilters(), sort: sort.value }];
        if (!writeStorage(keys.searches, result)) { showNotice('Could not save this search.'); return; }
        input.value = ''; renderSearches(); showNotice('Search saved.');
    };
    state.refreshPage = () => { updateOptions(); state.refreshJobs(); };
    renderSearches();
    state.refreshJobs();
}
