import React, { useState, useCallback } from 'react';
import { ConceptDetailsComponent } from './components/ConceptDetails';
import { SearchInput } from './components/SearchInput';
import { searchConcepts, lookupConcept } from './services/fhirApi';
import type { ConceptSuggestion, SearchState } from './types/fhir';
import './App.css';
import './components/SearchInput.css';
import './components/ConceptDetails.css';
import './components/NormalFormTree.css';

function App() {
  const [searchState, setSearchState] = useState<SearchState>({
    query: '',
    isLoading: false,
    suggestions: [],
    selectedConcept: null,
    error: null,
  });

  const [conceptLoading, setConceptLoading] = useState(false);
  const [conceptError, setConceptError] = useState<string | null>(null);

  const handleSearch = useCallback(async (query: string) => {
    setSearchState(prev => ({
      ...prev,
      query,
      isLoading: true,
      error: null,
    }));

    try {
      const response = await searchConcepts(query);
      setSearchState(prev => ({
        ...prev,
        isLoading: false,
        suggestions: response.expansion.contains,
      }));
    } catch (error) {
      console.error('Search error:', error);
      setSearchState(prev => ({
        ...prev,
        isLoading: false,
        suggestions: [],
        error: error instanceof Error ? error.message : 'Failed to search concepts',
      }));
    }
  }, []);

  const handleSelect = useCallback(async (concept: ConceptSuggestion) => {
    setConceptLoading(true);
    setConceptError(null);

    // Clear previous concept details
    setSearchState(prev => ({
      ...prev,
      selectedConcept: null,
    }));

    try {
      const details = await lookupConcept(concept.code);
      setSearchState(prev => ({
        ...prev,
        selectedConcept: details,
      }));
    } catch (error) {
      console.error('Lookup error:', error);
      setConceptError(error instanceof Error ? error.message : 'Failed to load concept details');
    } finally {
      setConceptLoading(false);
    }
  }, []);

  const handleClearSelection = useCallback(() => {
    setSearchState(prev => ({
      ...prev,
      selectedConcept: null,
    }));
    setConceptError(null);
  }, []);

  const handleConceptSelect = useCallback(
    async (conceptCode: string) => {
      // Create a minimal ConceptSuggestion from the concept code
      const conceptSuggestion: ConceptSuggestion = {
        code: conceptCode,
        display: conceptCode, // We'll use the code as display until we get the full details
        system: 'http://snomed.info/sct', // Assuming SNOMED CT system
      };

      // Use the existing handleSelect function to load the concept details
      await handleSelect(conceptSuggestion);
    },
    [handleSelect]
  );

  const isOfflineMode = import.meta.env.VITE_OFFLINE_MODE === 'true';

  return (
    <div className='app'>
      <div className='app-header'>
        <h1>Medical Procedure Search UI</h1>
        <p className='app-description'>
          Search for medical procedures using FHIR ValueSet $expand and CodeSystem $lookup
          operations with SNOMED CT terminologies.
        </p>
        {isOfflineMode && (
          <div className='offline-badge'>
            <span>🔍 Offline Mode</span>
            <small>Using sample data for demonstration</small>
          </div>
        )}
      </div>

      <div className='app-content'>
        <div className='search-section'>
          <SearchInput
            onSearch={handleSearch}
            onSelect={handleSelect}
            suggestions={searchState.suggestions}
            isLoading={searchState.isLoading}
            error={searchState.error}
            placeholder="Search for medical procedures (e.g., 'total hip replacement', 'knee surgery')..."
            debounceDelay={parseInt(import.meta.env.VITE_DEBOUNCE_DELAY || '300')}
          />
        </div>

        <div className='details-section'>
          <ConceptDetailsComponent
            concept={searchState.selectedConcept}
            isLoading={conceptLoading}
            error={conceptError}
            onClose={handleClearSelection}
            onConceptSelect={handleConceptSelect}
          />
        </div>
      </div>

      <div className='app-footer'>
        <p>
          This application demonstrates FHIR terminology services using the{' '}
          <a href='https://r4.ontoserver.csiro.au/fhir' target='_blank' rel='noopener noreferrer'>
            CSIRO OntoServer
          </a>{' '}
          sandbox environment.
        </p>
        {!isOfflineMode && (
          <small>
            Live API calls may occasionally return errors due to server availability or rate
            limiting.
          </small>
        )}
      </div>
    </div>
  );
}

export default App;
