import React, { useState, useEffect } from 'react';
import { useDebounce } from '../hooks/useDebounce';
import type { ConceptSuggestion } from '../types/fhir';

interface SearchInputProps {
  onSearch: (_query: string) => void;
  onSelect: (_concept: ConceptSuggestion) => void;
  suggestions: ConceptSuggestion[];
  isLoading: boolean;
  error: string | null;
  placeholder?: string;
  debounceDelay?: number;
}

export function SearchInput({
  onSearch,
  onSelect,
  suggestions,
  isLoading,
  error,
  placeholder = 'Search for medical procedures...',
  debounceDelay = 300,
}: SearchInputProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [lastSelectedValue, setLastSelectedValue] = useState<string>('');

  const debouncedQuery = useDebounce(query, debounceDelay);

  // Trigger search when debounced query changes
  useEffect(() => {
    if (debouncedQuery.trim()) {
      onSearch(debouncedQuery.trim());
      // Only open if the query is different from the last selected value
      if (debouncedQuery.trim() !== lastSelectedValue) {
        setIsOpen(true);
      }
    } else {
      setIsOpen(false);
    }
  }, [debouncedQuery, onSearch, lastSelectedValue]);

  // Show suggestions when they are provided (for tests or direct prop updates)
  useEffect(() => {
    // Don't open dropdown if the current query matches the last selected value
    // But allow opening if there's no query (test scenario)
    if (query && query === lastSelectedValue) {
      return;
    }

    if (suggestions.length > 0) {
      setIsOpen(true);
    } else if (suggestions.length === 0 && query.trim()) {
      // Keep it open to show "no results" message only if there's a query
      setIsOpen(true);
    } else if (suggestions.length === 0 && !query.trim()) {
      setIsOpen(false);
    }
  }, [suggestions, query, lastSelectedValue]);

  // Reset highlighted index when suggestions change
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [suggestions]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    if (!value.trim()) {
      setIsOpen(false);
    }

    // Reset last selected value when user starts typing a different value
    if (value !== lastSelectedValue) {
      setLastSelectedValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : 0));
        break;

      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => (prev > 0 ? prev - 1 : suggestions.length - 1));
        break;

      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0) {
          handleSelect(suggestions[highlightedIndex]);
        }
        break;

      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  const handleSelect = (concept: ConceptSuggestion) => {
    setQuery(concept.display);
    setIsOpen(false);
    setHighlightedIndex(-1);
    setLastSelectedValue(concept.display);
    onSelect(concept);
  };

  const handleBlur = () => {
    // Delay closing to allow for clicks on suggestions
    setTimeout(() => setIsOpen(false), 150);
  };

  const getFullySpecifiedName = (concept: ConceptSuggestion): string | undefined => {
    return concept.designation?.find(d => d.use.code === '900000000000003001')?.value;
  };

  return (
    <div className='search-container'>
      <div className='search-input-wrapper'>
        <input
          type='text'
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onFocus={() => {
            // Only open on focus if query is different from last selected value
            if (query.trim() && query !== lastSelectedValue) {
              setIsOpen(true);
            }
          }}
          placeholder={placeholder}
          className={`search-input ${error ? 'error' : ''}`}
          aria-expanded={isOpen}
          aria-haspopup='listbox'
          aria-autocomplete='list'
          role='combobox'
        />

        {isLoading && (
          <div className='loading-indicator' role='progressbar' aria-label='Loading'>
            <div className='spinner'></div>
          </div>
        )}
      </div>

      {error && (
        <div className='error-message' role='alert'>
          {error}
        </div>
      )}

      {isOpen && suggestions.length > 0 && (
        <ul className='suggestions-dropdown' role='listbox' aria-label='Search suggestions'>
          {suggestions.map((concept, index) => {
            const fullySpecifiedName = getFullySpecifiedName(concept);

            return (
              <li
                key={`${concept.system}-${concept.code}`}
                className={`suggestion-item ${
                  index === highlightedIndex ? 'highlighted' : ''
                } ${concept.inactive ? 'inactive' : ''}`}
                role='option'
                aria-selected={index === highlightedIndex}
                onClick={() => handleSelect(concept)}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                <div className='suggestion-content'>
                  <div className='display-line'>
                    <span className='display-name'>{concept.display}</span>
                    {fullySpecifiedName && fullySpecifiedName !== concept.display && (
                      <span className='fully-specified-name'> - {fullySpecifiedName}</span>
                    )}
                  </div>
                  <div className='concept-code'>
                    Code: {concept.code}
                    {concept.inactive && <span className='inactive-badge'>Inactive</span>}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {isOpen && !isLoading && suggestions.length === 0 && query.trim() && (
        <div className='no-results'>No results found for "{query}"</div>
      )}
    </div>
  );
}
