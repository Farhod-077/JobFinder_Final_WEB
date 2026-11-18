# JobFinder — Final Project

JobFinder is our Web Technologies project for group SE-2525. We continued the job website from the midterm and endterm. Users can browse jobs, save searches, manage local vacancies and view statistics.

## Team

| Member | Area |
|---|---|
| Sapayev Farkhod | HTML pages, CSS, responsive layout and dashboard interface |
| Orynbassarov Yerdan | Job data, API integration, Job class, search, filters, pagination and statistics |
| Tokmaganbet Burkhan | Forms, vacancy editing, saved searches, browser storage, FAQ and testing |

## New Final Features

1. Remote jobs from the Remotive API, with loading, success, empty and error states.
2. Complete local vacancy CRUD: create, view, edit and delete.
3. Advanced search with salary ranges, source filters and pagination.
4. Saved searches that can be applied, renamed and deleted.
5. A dashboard with job counts and category and work-mode charts.

The endterm features are still included: job cards and table, company search, favorites, dark mode, form validation and the jQuery FAQ.

## Pages and Files

| File | Purpose |
|---|---|
| `index.html` | Homepage and latest jobs |
| `jobs.html` | Search, filters, saved searches and job table |
| `companies.html` | Company directory |
| `post-job.html` | Create and edit local jobs |
| `contact.html` | Contact form and FAQ |
| `dashboard.html` | Statistics and charts |
| `styles.css` | Shared styles and responsive layouts |
| `data.js` | Original demo jobs and companies |
| `app.js` | Starts the current page |
| `js/home.js`, `js/companies.js`, `js/contact.js` | Page logic |
| `js/jobs.js` | Filters, pagination and saved searches |
| `js/post-job.js` | Create and edit local jobs |
| `js/job-cards.js` | Cards, table and favorites |
| `js/repository.js` | Reads and combines job and company data |
| `js/state.js` | Shared data and page refresh callbacks |
| `js/remote.js` | API loading status and retry |
| `js/Job.js` | Job class and sorting |
| `js/api.js` | API request, normalization and cache |
| `js/storage.js` | JSON storage helpers |
| `js/ui.js` | Shared interface elements and theme |
| `js/forms.js` | Validation and form handling |
| `js/dashboard.js` | Statistics rendering |
| `jquery-features.js` | FAQ events and animations |
| `tests` | Unit and DOM integration tests |

## API

Provider: [Remotive](https://remotive.com).

Endpoint: `https://remotive.com/api/remote-jobs?limit=100`

Documentation: https://github.com/remotive-com/remote-jobs-api

We use `fetch` with `async/await` and process the returned JSON. The request has a 15-second timeout. Results are cached for six hours. Error retries have a 30-second delay to avoid repeated requests. No API key is required.

The app uses job titles, companies, locations, categories, employment types, salary text, descriptions, dates and original URLs. Every remote card names Remotive and links to the original listing. The provider delays public listings by 24 hours; availability must be checked on the original page.

Demo, local and remote jobs are labeled separately. If the API fails, the app explains the error and keeps demo/local jobs available. An older cache is clearly identified when used.

Remote salaries may use different currencies and periods. We preserve their text. Numeric salary filters, salary ordering and average salary calculations use only demo/local monthly USD values; remote jobs appear last in salary sorting.

## OOP

Each displayed vacancy is a `Job` instance. Its constructor stores job properties. `matchesFilters()` checks search conditions, `getSalaryLabel()` formats the salary, `isEditable()` identifies local jobs and `toJSON()` prepares data for storage. Loaded JSON records are converted back into class instances.

## Browser Storage

| Key | Data |
|---|---|
| `jobfinder.customJobs.v1` | Local vacancies |
| `jobfinder.favorites.v1` | Saved job IDs |
| `jobfinder.theme.v1` | Selected theme |
| `jobfinder.searches.v1` | Saved filter combinations |
| `jobfinder.apiCache.v1` | Remote data and cache time |

Missing or invalid data falls back safely. Failed writes show a message. The vacancy form keeps its input if saving fails. Users can edit/delete local vacancies, delete saved searches and clear saved jobs. No sessionStorage is used.

## Testing

Quick manual check:

1. Search for a job, combine filters and change pages.
2. Save a job, refresh and open Saved.
3. Save a search, reset the filters, apply it, rename it and delete it.
4. Submit an empty vacancy form, then create a valid job.
5. Edit that job, reload the page and check the new values. Delete it.
6. Open Dashboard and compare counts with the loaded jobs.
7. Test dark mode, the contact form and FAQ search.
8. Check all pages on desktop and mobile, including the navigation and table.
9. For an API failure test, remove only `jobfinder.apiCache.v1` in browser storage, block the API request in developer tools and reload. Check the message and Retry button, then unblock the request.

Optional automated tests require Node.js 22.13+ (24 recommended):

```bash
npm test
npm install
npm run test:dom
```

Unit tests cover the Job class, filters, sorting and storage. DOM tests cover pages, CRUD, saved searches, validation, FAQ and simulated API responses. DOM tests do not check browser layout.

## Deployment

Upload the contents of this folder to the repository, keeping `index.html` at its root. Enable GitHub Pages for the main branch and root folder, or upload the folder to Netlify. Test the published URL before submission.

- Website: not published yet — add the deployed URL here.
- Repository: add the team's repository URL here.

## Limits

This is a client-side project without accounts or a shared database. Local jobs and preferences belong to this browser. The contact form validates input but does not send messages. Employer email is validated when creating a job and is not stored. API availability depends on Remotive and the network. Dashboard figures describe the loaded data, not the whole job market.

Bootstrap 5.3.3 and jQuery 3.7.1 are third-party libraries distributed under the MIT license. Their original license notices are kept in the vendor files.
