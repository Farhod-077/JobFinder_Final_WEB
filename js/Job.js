export class Job {
    constructor(values) {
        Object.assign(this, values);
        this.source = ['api', 'custom', 'demo'].includes(values.source)
            ? values.source : String(values.id).startsWith('custom-') ? 'custom' : 'demo';
        this.salary = typeof values.salary === 'number' && Number.isFinite(values.salary) ? values.salary : null;
    }

    isEditable() {
        return this.source === 'custom';
    }

    getSalaryLabel() {
        if (this.source === 'api') return this.salaryText || 'Salary not specified';
        return new Intl.NumberFormat('en-US', {
            style: 'currency', currency: 'USD', maximumFractionDigits: 0
        }).format(this.salary) + ' / month';
    }

    matchesFilters(filters, favorites) {
        const query = (filters.search || '').trim().toLowerCase();
        const text = [this.title, this.companyName, this.location, this.category, this.description].join(' ').toLowerCase();
        return text.includes(query) &&
            (!filters.location || this.location === filters.location) &&
            (!filters.category || this.category === filters.category) &&
            (!filters.company || this.companyId === filters.company) &&
            (!filters.type || this.employmentType === filters.type) &&
            (!filters.mode || this.workMode === filters.mode) &&
            (!filters.source || this.source === filters.source) &&
            (!filters.savedOnly || favorites.has(this.id)) &&
            (!filters.minSalary || (this.salary !== null && this.salary >= Number(filters.minSalary))) &&
            (!filters.maxSalary || (this.salary !== null && this.salary <= Number(filters.maxSalary)));
    }

    toJSON() {
        return { ...this };
    }
}

export function sortJobs(jobs, order) {
    return [...jobs].sort((a, b) => {
        if (order === 'title') return a.title.localeCompare(b.title);
        if (order === 'salary-asc' || order === 'salary-desc') {
            if (a.salary === null) return b.salary === null ? 0 : 1;
            if (b.salary === null) return -1;
            return order === 'salary-asc' ? a.salary - b.salary : b.salary - a.salary;
        }
        return (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0);
    });
}
