import { createElement, formatSalary } from "./ui.js";

export function renderDashboard(getJobs, getCustomJobs, getFavorites) {
        const jobs = getJobs();
        const stats = document.getElementById('dashboard-stats');
        stats.replaceChildren();
        const values = [
            ['Loaded jobs', jobs.length], ['Remotive jobs', jobs.filter(job => job.source === 'api').length],
            ['My jobs', getCustomJobs().length], ['Saved jobs', getFavorites().length]
        ];
        for (const [label, value] of values) {
            const card = createElement('article', 'panel stat-card');
            card.append(createElement('p', 'muted', label), createElement('strong', 'stat-number', String(value)));
            stats.append(card);
        }
        for (const [field, id] of [['category', 'category-chart'], ['workMode', 'mode-chart']]) {
            const counts = new Map();
            for (const job of jobs) counts.set(job[field], (counts.get(job[field]) || 0) + 1);
            const entries = [...counts].sort((a, b) => b[1] - a[1]);
            const container = document.getElementById(id);
            container.replaceChildren();
            const maximum = Math.max(1, ...counts.values());
            for (const [label, value] of entries) {
                const row = createElement('div', 'chart-row');
                const caption = createElement('div', 'chart-caption');
                caption.append(createElement('span', '', label), createElement('strong', '', String(value)));
                const track = createElement('div', 'chart-track');
                track.setAttribute('aria-hidden', 'true');
                const bar = createElement('div', 'chart-bar');
                bar.style.width = (value / maximum * 100) + '%';
                track.append(bar); row.append(caption, track); container.append(row);
            }
            if (!entries.length) container.append(createElement('p', 'muted', 'No data available.'));
        }
        const known = jobs.filter(job => job.salary !== null);
        document.getElementById('salary-summary').textContent = known.length
            ? `Average: ${formatSalary(known.reduce((sum, job) => sum + job.salary, 0) / known.length)} per month across ${known.length} demo/local jobs. Remotive salary text is excluded because currencies and periods vary.`
            : 'No comparable monthly salary data.';
    }

