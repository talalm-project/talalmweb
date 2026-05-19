# Admin Panel Web Instructions

This repository is a small React admin-panel starter built with `esbuild`, `HashRouter`, Bootstrap SCSS, FontAwesome icons, and plain function components. Agents working here should follow the existing patterns instead of introducing a new architecture.

## Stack And Runtime

- Frontend entrypoint is `src/index.js`.
- Routing lives in `src/js/App.js` and uses `HashRouter`.
- Styles are bundled from `src/styles/index.scss`.
- The CSS framework is Bootstrap.
- Icons are provided through FontAwesome.
- Builds are handled by `build.js`, not Vite, CRA, or Webpack.
- Environment variables are injected at build time through esbuild `define`.

Required env vars used by the current build:

- `API_BASE_URL`
- `TOKEN_BEARER`
- `CURRENT_USER`
- `API_VERSION`

If `API_VERSION` is missing, `npm run build` fails before app code is evaluated.

## Current Project Conventions

### Component Structure

- Use function components with React hooks.
- Follow the project’s current export style:

```js
const Dashboard = () => {
  return <div />;
};

export default Dashboard;
```

- Keep page components under `src/js/`.
- Keep shared layout or utility UI under `src/js/commons/`.
- Keep service modules under `src/js/services/`.
- Keep shared helper functions under `src/js/helpers/`.

### Routing

- Public and authenticated routes are both declared in `src/js/App.js`.
- Public routes render without the sidebar.
- Authenticated routes render inside the sidebar layout after `isLoggedIn()` passes.
- Because the app uses `HashRouter`, links and navigation should assume hash-based routing.

### Styling

- Bootstrap is the CSS framework for this project.
- Prefer Bootstrap utility classes and card/table layouts first.
- Add SCSS only when Bootstrap utilities are not enough.
- Shared styles are loaded from `src/styles/index.scss`.
- Feature-specific styles can be added as separate SCSS files and imported into `src/styles/index.scss`.
- Keep the visual language consistent with the existing app: simple admin UI, cards, tables, badges, spacing utilities, FontAwesome icons.

### Icons

- FontAwesome is the icon library used by this project.
- Use FontAwesome icons from `@fortawesome/free-solid-svg-icons`.
- Import only the icons used by the component.

### State And Data Flow

- Keep component state local with `useState` unless there is a clear shared-state need.
- Do not add Redux, Zustand, React Query, or a new state library unless explicitly requested.
- Keep data loading logic in service modules, not inline inside JSX markup.

## Service Pattern

Backend access should follow the existing `AuthService.js` pattern.

### Rules

- Create one service module per backend resource or domain area.
- Service modules should be thin wrappers around `axios`.
- Build headers through helpers in `src/js/helpers/AppHelper.js`.
- Return the raw axios promise from the service and let the component decide how to update UI state.
- Keep token management in auth helpers/services, not duplicated in each screen.

### Existing Pattern

`src/js/services/AuthService.js` already shows the intended shape:

- Import `axios`
- Import shared header builders
- Export small named functions such as `login`, `getToken`, `isLoggedIn`

### Example Resource Service

For a new users screen, create `src/js/services/UserService.js`:

```js
import axios from "axios";
import { buildHeaders } from "../helpers/AppHelper";

export const fetchUsers = (args = {}) => {
  return axios.get(`${API_BASE_URL}/users`, {
    params: args,
    headers: buildHeaders()
  });
};

export const createUser = (args) => {
  return axios.post(`${API_BASE_URL}/users`, args, {
    headers: buildHeaders()
  });
};

export const updateUser = (id, args) => {
  return axios.put(`${API_BASE_URL}/users/${id}`, args, {
    headers: buildHeaders()
  });
};
```

For uploads, use `buildFileUploadHeaders()` instead of `buildHeaders()`.

## Feature-Building Convention

When adding a new feature, use this sequence.

### 1. Add Or Update A Service

- Put backend calls in `src/js/services/<Feature>Service.js`.
- Use `buildHeaders()` or `buildFileUploadHeaders()`.
- Keep functions small and named by action: `fetchUsers`, `createUser`, `updateUser`, `deleteUser`.

### 2. Build The Page Component

- Create the route component under `src/js/`.
- Use `useState` for screen state such as:
  - `items`
  - `errors`
  - `isLoading`
  - `currentPage`
  - `totalPages`
- Fetch data by calling the service function from the component.
- Render the page with Bootstrap cards, tables, forms, and badges.
- For standard page framing, prefer `src/js/commons/AdminContent.js`.

### 3. Reuse Existing Helpers

- Use `getInputClassName(errors, field)` for invalid input styling.
- Use `renderInputErrors(errors, field)` for form validation feedback.
- Use `statusToLabel(status)` if the current badge styles match the feature.
- Use `MAX_VISIBLE_PAGES` and `src/js/Pagination.js` for paginated tables.

### 4. Register The Route

- Add the route in `src/js/App.js`.
- If it is an authenticated admin screen, place it inside the authenticated route block.
- If the feature should appear in navigation, add it to `src/js/Sidebar.js`.

### 5. Add Styling Only If Needed

- Start with Bootstrap classes.
- If custom styling is required, add a feature SCSS file under `src/styles/` and import it from `src/styles/index.scss`.

## Example Page Pattern

This is the expected screen-level shape for a backend-backed admin feature:

```js
import React, { useEffect, useState } from "react";
import AdminContent from "./commons/AdminContent";
import Pagination from "./Pagination";
import { fetchUsers } from "./services/UserService";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadUsers = (page = 1) => {
    setIsLoading(true);

    fetchUsers({ page })
      .then((response) => {
        setUsers(response.data.users || []);
        setCurrentPage(response.data.meta?.current_page || 1);
        setTotalPages(response.data.meta?.total_pages || 1);
        setErrors({});
      })
      .catch((error) => {
        setErrors(error.response?.data || {});
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    loadUsers(1);
  }, []);

  return (
    <AdminContent title="Users">
      {isLoading && <div className="text-muted mb-3">Loading...</div>}

      <div className="table-responsive">
        <table className="table table-sm table-bordered table-hover">
          <thead className="table-light">
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              return (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.status}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        handlePrevious={() => loadUsers(currentPage - 1)}
        handlePageClick={(page) => loadUsers(page)}
        handleNext={() => loadUsers(currentPage + 1)}
      />
    </AdminContent>
  );
};

export default Users;
```

## Helpers And Shared Utilities

Use the existing helper layer before adding new utilities.

- `buildHeaders()`: default JSON API headers with bearer token
- `buildFileUploadHeaders()`: multipart upload headers with bearer token
- `getInputClassName()`: Bootstrap invalid-state class builder
- `renderInputErrors()`: validation error renderer
- `MAX_VISIBLE_PAGES`: pagination constant

If a helper is generic and reused by more than one feature, place it in `src/js/helpers/`.

## Authentication Convention

- Auth token is stored in `localStorage` under `TOKEN_BEARER`.
- Current auth state is derived by decoding the stored JWT with `jwt-decode`.
- The app currently treats a decodable stored token as a valid logged-in session.
- Logout clears the stored token and redirects to `/`.

If a feature requires authenticated API access, rely on `buildHeaders()` rather than manually reading from `localStorage`.

## Existing Quirks To Preserve Or Fix Carefully

- `HashRouter` is intentional; do not switch routing strategy unless requested.
- The build is custom and depends on env vars defined in `build.js`.
- The app currently mixes plain Bootstrap classes with a small amount of SCSS.
- The mock server and login form are not perfectly aligned today:
  - `Login.js` sends `email` and `password`
  - `mock-server.cjs` checks `username` and `password`

Do not silently “clean up” project-wide behavior while adding a feature unless the task explicitly includes that cleanup.

## When Adding A New Feature

Default checklist:

1. Add or update a service module.
2. Build the screen with local `useState`.
3. Use `AdminContent` for standard card layout.
4. Use helpers for headers, validation UI, and pagination.
5. Register the route in `App.js`.
6. Add navigation in `Sidebar.js` if needed.
7. Verify with `npm run build` and ensure env vars exist, especially `API_VERSION`.

## What Not To Introduce By Default

- No new global state library.
- No new CSS framework.
- No new form library.
- No TypeScript conversion.
- No custom fetch wrapper if a small axios service module is enough.
- No large abstraction layer for CRUD screens unless repeated duplication clearly justifies it.

Keep the code straightforward, close to the existing project style, and easy for the next agent to extend.

## Interface Guidelines

- Buttons shoudl have corresponding icons.
- Use badges for statuses
