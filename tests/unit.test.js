import test from 'node:test';
import assert from 'node:assert/strict';
import { Job, sortJobs } from '../js/Job.js';
import { readStorage, writeStorage } from '../js/storage.js';

const create = (extra = {}) => new Job({
    id: 'job-1', title: 'Frontend Developer', companyName: 'Team',
    location: 'Astana', category: 'IT', employmentType: 'Full-time',
    workMode: 'Remote', salary: 2000, description: 'Build websites',
    createdAt: '2026-11-01T10:00:00Z', ...extra
});

test('job objects expose useful methods', () => {
    const job = create();
    assert.equal(job.isEditable(), false);
    assert.equal(job.getSalaryLabel(), '$2,000 / month');
});

test('only local custom jobs can be edited', () => {
    assert.equal(create({ id: 'custom-1' }).isEditable(), true);
    assert.equal(create({ id: 'api-1', source: 'api' }).isEditable(), false);
});

test('remote salary is kept in its original units', () => {
    const job = create({ source: 'api', salary: null, salaryText: 'EUR 60,000 / year' });
    assert.equal(job.getSalaryLabel(), 'EUR 60,000 / year');
    assert.equal(create({ source: 'api', salary: null }).getSalaryLabel(), 'Salary not specified');
});

test('search ignores case and outer spaces', () => {
    assert.equal(create().matchesFilters({ search: ' FRONTEND ' }, new Set()), true);
    assert.equal(create().matchesFilters({ search: 'designer' }, new Set()), false);
});

test('filters are combined', () => {
    assert.equal(create().matchesFilters({ location: 'Astana', mode: 'Remote' }, new Set()), true);
    assert.equal(create().matchesFilters({ location: 'Almaty', mode: 'Remote' }, new Set()), false);
});

test('saved-only mode checks identifiers', () => {
    assert.equal(create().matchesFilters({ savedOnly: true }, new Set(['job-1'])), true);
    assert.equal(create().matchesFilters({ savedOnly: true }, new Set()), false);
});

test('salary range excludes unknown salaries', () => {
    assert.equal(create().matchesFilters({ minSalary: '1500', maxSalary: '2500' }, new Set()), true);
    assert.equal(create({ salary: null }).matchesFilters({ minSalary: '1500' }, new Set()), false);
});

test('salary sort leaves unknown salaries last and preserves input order', () => {
    const items = [create({ salary: null }), create({ salary: 3000 }), create({ salary: 1000 })];
    assert.deepEqual(sortJobs(items, 'salary-asc').map(job => job.salary), [1000, 3000, null]);
    assert.deepEqual(sortJobs(items, 'salary-desc').map(job => job.salary), [3000, 1000, null]);
    assert.equal(items[0].salary, null);
});

test('newest sorting uses publication dates', () => {
    const jobs = [create(), create({ id: 'job-2', createdAt: '2026-11-10T10:00:00Z' })];
    assert.equal(sortJobs(jobs, 'newest')[0].id, 'job-2');
});

test('JSON restores data and constructors restore methods', () => {
    const job = create({ id: 'custom-2' });
    const restored = new Job(JSON.parse(JSON.stringify(job)));
    assert.equal(restored.title, job.title);
    assert.equal(restored.isEditable(), true);
});

test('storage handles missing values and malformed JSON', () => {
    const values = new Map();
    globalThis.localStorage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
    assert.deepEqual(readStorage('missing', []), []);
    values.set('broken', '{');
    assert.deepEqual(readStorage('broken', []), []);
    assert.equal(writeStorage('jobs', [{ id: 1 }]), true);
    assert.deepEqual(readStorage('jobs', []), [{ id: 1 }]);
});

test('storage reports write failure', () => {
    globalThis.localStorage = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('full'); } };
    assert.equal(writeStorage('test', 'value'), false);
    assert.equal(readStorage('test', 'fallback'), 'fallback');
});
