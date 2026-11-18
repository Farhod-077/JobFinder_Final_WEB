import { readStorage, writeStorage, keys } from './storage.js';

export const API_URL = 'https://remotive.com/api/remote-jobs?limit=100';
const CACHE_TIME = 6 * 60 * 60 * 1000;
let pending;

function normalizeJob(item) {
    if (!item || !item.id || typeof item.title !== 'string' || !item.title.trim()) return null;
    let url;
    try {
        url = new URL(item.url);
        if (url.protocol !== 'https:' || !['remotive.com', 'www.remotive.com'].includes(url.hostname)) return null;
    } catch {
        return null;
    }
    const company = String(item.company_name || 'Unknown company');
    const document = new DOMParser().parseFromString(String(item.description || ''), 'text/html');
    document.querySelectorAll('script, style, img, iframe').forEach(element => element.remove());
    return {
        id: 'api-' + item.id,
        title: item.title,
        companyId: 'api-company-' + encodeURIComponent(company.toLowerCase()),
        companyName: company,
        location: String(item.candidate_required_location || 'Worldwide'),
        category: String(item.category || 'Other'),
        employmentType: ({ full_time: 'Full-time', part_time: 'Part-time', internship: 'Internship', contract: 'Contract', freelance: 'Freelance' })[item.job_type] || 'Other',
        workMode: 'Remote',
        salary: null,
        salaryText: String(item.salary || '').trim(),
        description: document.body.textContent.trim(),
        createdAt: Number.isFinite(Date.parse(item.publication_date)) ? item.publication_date : '',
        source: 'api',
        url: url.href
    };
}

export function getCachedJobs() {
    const cache = readStorage(keys.cache, null);
    if (!cache || !Array.isArray(cache.jobs) || !Number.isFinite(cache.savedAt)) return null;
    const jobs = cache.jobs.filter(job => {
        if (!job || job.source !== 'api' || typeof job.id !== 'string' || !job.id.startsWith('api-')) return false;
        if (!['title', 'companyName', 'companyId', 'location', 'category', 'employmentType', 'workMode', 'description'].every(key => typeof job[key] === 'string')) return false;
        try { const url = new URL(job.url); return url.protocol === 'https:' && ['remotive.com', 'www.remotive.com'].includes(url.hostname); } catch { return false; }
    });
    return jobs.length === cache.jobs.length ? { jobs, savedAt: cache.savedAt } : null;
}

export function loadRemoteJobs() {
    if (pending) return pending;
    const cached = getCachedJobs();
    if (cached && Date.now() - cached.savedAt >= 0 && Date.now() - cached.savedAt < CACHE_TIME) {
        return Promise.resolve({ ...cached, cached: true });
    }
    pending = (async () => {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 15000);
        try {
            const response = await fetch(API_URL, { signal: controller.signal });
            if (!response.ok) throw new Error('The job provider returned HTTP ' + response.status + '.');
            const body = await response.json();
            if (!body || !Array.isArray(body.jobs)) throw new Error('The provider returned an unexpected response.');
            const jobs = body.jobs.map(normalizeJob).filter(Boolean);
            if (body.jobs.length && !jobs.length) throw new Error('The provider returned invalid job records.');
            const result = { jobs: [...new Map(jobs.map(job => [job.id, job])).values()], savedAt: Date.now() };
            const persisted = writeStorage(keys.cache, result);
            return { ...result, persisted, cached: false };
        } catch (error) {
            if (error.name === 'AbortError') throw new Error('The request timed out. Try again later.');
            throw new Error(error.message === 'Failed to fetch' ? 'Cannot reach Remotive. Check your connection and try again.' : error.message);
        } finally {
            clearTimeout(timer);
            pending = null;
        }
    })();
    return pending;
}
