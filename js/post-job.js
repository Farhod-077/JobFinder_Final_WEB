import { showNotice, populateSelect } from './ui.js';
import { setupValidation } from './forms.js';
import { Job } from './Job.js';
import { keys, writeStorage } from './storage.js';
import { getCustomJobs, getCompanies, createId } from './repository.js';

export function initPostForm() {
    populateSelect(document.getElementById('category'), window.JobFinderData.categories.map(category => category.name));
    const form = document.getElementById('post-form');
    const editId = new URLSearchParams(window.location.search).get('edit');
    const existing = editId ? getCustomJobs().find(job => job.id === editId) : null;
    if (editId && !existing) {
        showNotice('This local job does not exist. Open the directory to choose another job.');
        form.querySelector('[type="submit"]').disabled = true;
        return;
    }
    if (existing) {
        document.querySelector('h1').textContent = 'Edit Your Job';
        form.querySelector('[type="submit"]').textContent = 'Save Changes';
        for (const [key, value] of Object.entries(existing)) {
            const field = form.elements.namedItem(key);
            if (field) field.value = value;
        }
        form.elements.namedItem('company').value = existing.companyName;
        const email = document.getElementById('email');
        email.closest('.field').hidden = true;
        email.disabled = true;
    }
    setupValidation(form, 'post', values => {
        const matching = getCompanies().find(company => company.name.toLowerCase() === values.company.toLowerCase());
        const id = existing ? existing.id : `custom-${createId()}`;
        const job = new Job({
            id, title: values.title,
            companyId: matching ? matching.id : `company-${id}`,
            companyName: matching ? matching.name : values.company,
            location: values.location, category: values.category,
            employmentType: values.employmentType, workMode: values.workMode,
            salary: Number(values.salary), description: values.description,
            source: 'custom', createdAt: existing ? existing.createdAt : new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
        const previous = getCustomJobs();
        const updated = existing ? previous.map(item => item.id === id ? job : item) : [...previous, job];
        if (!writeStorage(keys.jobs, updated)) {
            showNotice('Could not save this job. Your input has been kept. Check browser storage and retry.');
            return false;
        }
        document.getElementById('post-success-text').textContent = existing ? 'Your job was updated in this browser.' : 'Your demo job was saved in this browser.';
        const link = document.getElementById('view-posted-job');
        link.href = 'jobs.html?search=' + encodeURIComponent(job.title) + '&company=' + encodeURIComponent(job.companyId);
        document.getElementById('post-success').hidden = false;
        if (existing) {
            for (const field of form.querySelectorAll('input, select, textarea, button[type="submit"]')) field.disabled = true;
            return false;
        }
        return true;
    });
}
