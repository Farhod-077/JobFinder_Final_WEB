import { Job } from './Job.js';
import { keys, readStorage } from './storage.js';
import { state } from './state.js';

function isCustomJob(job) {
    if (!job || typeof job !== "object") {
        return false;
    }

    const fields = [
        "id",
        "title",
        "companyId",
        "companyName",
        "location",
        "category",
        "employmentType",
        "workMode",
        "description",
        "createdAt"
    ];

    return fields.every(field =>
        typeof job[field] === "string" && job[field].trim().length > 0
    ) &&
        job.id.startsWith("custom-") &&
        window.JobFinderData.categories.some(category => category.name === job.category) &&
        ["Full-time", "Part-time", "Internship"].includes(job.employmentType) &&
        ["Office", "Hybrid", "Remote"].includes(job.workMode) &&
        Number.isInteger(job.salary) &&
        job.salary >= 1 &&
        job.salary <= 100000 &&
        Number.isFinite(Date.parse(job.createdAt));
}

export function getCustomJobs() {
    const stored = readStorage(keys.jobs, []);
    return Array.isArray(stored) ? stored.filter(isCustomJob) : [];
}

export function getJobs() {
    return [...window.JobFinderData.jobs.map(job => ({ ...job, source: "demo" })), ...getCustomJobs().map(job => ({ ...job, source: "custom" })), ...state.remoteJobs].map(job => new Job({
        ...job,
        companyName: job.companyName || window.JobFinderData.companies.find(company => company.id === job.companyId)?.name || 'Unknown company'
    }));
}

export function getFavorites() {
    const stored = readStorage(keys.favorites, []);

    if (!Array.isArray(stored)) {
        return [];
    }

    

    return [...new Set(stored.filter(id =>
        typeof id === "string" && /^(job-|custom-|api-)/.test(id)
    ))];
}

export function getCompanies() {
    const companies = window.JobFinderData.companies.map(company => ({ ...company }));

    for (const job of [...getCustomJobs(), ...state.remoteJobs]) {
        if (!companies.some(company => company.id === job.companyId)) {
            companies.push({
                id: job.companyId,
                name: job.companyName,
                industry: job.source === "api" ? "Remotive Employer" : "Community Employer",
                description: job.source === "api" ? "Remote vacancies provided by Remotive." : "An employer added through the local demonstration form."
            });
        }
    }

    return companies;
}

export function getCompanyName(job) {
    return job.companyName ||
        window.JobFinderData.companies.find(company => company.id === job.companyId)?.name ||
        "Unknown Company";
}

export function filterJobs(jobs, filters) {
    return jobs.filter(job => job.matchesFilters(filters, new Set(getFavorites())));
}

export function createId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
        return window.crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
