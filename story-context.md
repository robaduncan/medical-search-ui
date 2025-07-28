# Medical Data Search UI – Copilot Story Context

## Overview

The goal of this project is to build a small **React** front‑end that allows users to search for medical procedures or diagnoses using the **FHIR** standard and **SNOMED CT** terminologies.  Sean’s Loom video explains that the UI should implement a **type‑ahead search**: as the user types a term such as “total hip replacement,” the application should query a FHIR **ValueSet `$expand`** endpoint to retrieve matching concepts.  When a concept is selected from the suggestions, the UI should then query a **CodeSystem `$lookup`** endpoint to fetch detailed information about that SNOMED code.  Results should be displayed with their preferred term, fully specified name, synonyms and other relevant properties.

Two example endpoints were provided:

* **ValueSet \$expand** – performs a search within a SNOMED value set, returning a list of candidate codes and names.  Example URL (URL‑encoded parameters shown for clarity):

  ```
  https://r4.ontoserver.csiro.au/fhir/ValueSet/$expand?
    _format=json
    &url=http%3A%2F%2Fsnomed.info%2Fsct%2F32506021000036107%3Ffhir_vs
    &filter=total%20hip%20r%5Creplacement
    &system-version=http%3A%2F%2Fsnomed.info%2Fsct%7Chttp%3A%2F%2Fsnomed.info%2Fsct%2F32506021000036107
    &includeDesignations=true
    &count=100
    &elements=expansion.contains.code,expansion.contains.display,expansion.contains.fullySpecifiedName,expansion.contains.active
  ```

* **CodeSystem \$lookup** – retrieves detailed properties about a single SNOMED code.  Example URL:

  ```
  https://r4.ontoserver.csiro.au/fhir/CodeSystem/$lookup?
    code=52734007
    &system=http%3A%2F%2Fsnomed.info%2Fsct
    &property=*
  ```

These endpoints are hosted on an OntoServer sandbox.  They sometimes return `OperationOutcome` errors if parameters are missing or the server is unavailable; the client should handle such errors gracefully.

## Sample Data Files

To facilitate offline development and testing, two sample JSON responses have been provided.  Copy these files into your project under a `test-files` directory, e.g.:

* `test-files/1st-expand-response.json` – this file contains the full JSON returned by the ValueSet `$expand` call.  It has a `resourceType` of `ValueSet` and an `expansion.contains` array with 92 objects.  Each object includes a `system`, `code`, `display` field and an array of `designation` objects containing fully specified names and synonyms.  Use this file as mock data for the type‑ahead suggestions.

* `test-files/2nd-lookup-response.json` – this file contains the JSON output of a CodeSystem `$lookup` call for code `52734007`.  It is a `Parameters` resource consisting of a `parameter` array where each element describes a property.  The initial parameters include the code, display name, terminology name, system and version.  Subsequent `property` parameters define properties such as `inactive` (false), `definition` (“Total reconstruction of hip with prosthesis.”) and lists of parent or child concept codes.  Use this file to simulate the detailed view of a selected concept.

> **Note:** The PDF file `Parameters.pdf` contains the same information as `2nd-lookup-response.json` in a paginated form.  It can be used as a human‑readable reference but is not necessary for parsing in the application.

## Functional Requirements

* Build a React component with a text input for search.  Debounce input events (e.g., 300 ms) so the server isn’t called on every keystroke.
* When the user enters text, construct a request to the ValueSet `$expand` endpoint (or read from `1st-expand-response.json` when offline), URL‑encoding parameters properly.
* Parse the returned JSON; extract each item’s `code`, `display` and relevant designations.  Display these as suggestions in a dropdown, allowing keyboard and mouse selection.
* When the user selects a suggestion, call the CodeSystem `$lookup` endpoint with the chosen code (or read from `2nd-lookup-response.json` offline).  Parse the `Parameters` response into a structured object (e.g., grouping properties by their `code` values) and display details such as definition, inactive status and child/parent relationships.
* Provide loading indicators and error messages for network failures.  Modularize the code using functional components and hooks.

## To‑Do List

Below is a task checklist to guide implementation.  As you complete each item, tick it off to track progress:

# [x] **devContainer setup:** Create a devcontainer for this potential codebase
* [ ] **Project setup:** Initialise a new React project (e.g., using Create React App or Vite) and create a `test-files` folder containing the sample JSON files.
* [ ] **Search input component:** Implement a text input with debounce.  Ensure user input is trimmed and encoded before sending requests.
* [ ] **API handler:** Write a helper function to call the ValueSet `$expand` endpoint.  Include logic to fall back to reading `1st-expand-response.json` when in offline/test mode.
* [ ] **Suggestion dropdown:** Map the `expansion.contains` array into a list of suggestions.  Show the `display` value and optionally the fully specified name.  Implement keyboard navigation and selection.
* [ ] **Lookup handler:** Create a function to call the CodeSystem `$lookup` endpoint for a selected code.  Include fallback logic to read `2nd-lookup-response.json` when offline.  Parse the `Parameters` resource into a more usable structure.
* [ ] **Detail view:** Design a component that displays the selected concept’s properties (definition, synonyms, inactive status, parent and child codes).  Use the parsed lookup data.
* [ ] **Error and loading states:** Provide user feedback during API calls and handle `OperationOutcome` responses gracefully.
* [ ] **Testing:** Write unit tests that verify the parsing functions using the sample JSON files.  Optionally add integration tests for the UI using mocked fetch responses.
* [ ] **Documentation:** Document how to run the app, how to switch between live endpoints and local sample data, and any environment variables required for the API base URL.

## Additional Notes

* The OntoServer sandbox may intermittently return 403 or `OperationOutcome` errors when called anonymously.  For robust development, implement a retry strategy or local caching using the provided sample data.
* Ensure that query parameters in the API calls are URL‑encoded; special characters such as backslashes must be properly encoded (e.g., `%5C` for `\`).
* When displaying synonyms and definitions, choose a consistent ordering (e.g., preferred terms first) and consider truncating overly long lists for clarity.

