import React, { useState } from 'react';
import type { ConceptDetails } from '../types/fhir';
import { NormalFormTree } from './NormalFormTree';
import './NormalFormTree.css';

interface ConceptDetailsProps {
  concept: ConceptDetails | null;
  isLoading: boolean;
  error: string | null;
  onClose?: () => void;
  onConceptSelect?: (_conceptCode: string) => void;
}

export function ConceptDetailsComponent({
  concept,
  isLoading,
  error,
  onClose,
  onConceptSelect,
}: ConceptDetailsProps) {
  const [isPropertiesExpanded, setIsPropertiesExpanded] = useState(false);

  if (isLoading) {
    return (
      <div className='concept-details loading'>
        <div className='loading-indicator' role='progressbar' aria-label='Loading concept details'>
          <div className='spinner'></div>
          <span>Loading concept details...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='concept-details error'>
        <div className='error-message'>
          <h3>Error Loading Concept Details</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!concept) {
    return (
      <div className='concept-details placeholder'>
        <div className='placeholder-content'>
          <h3>Select a concept to view details</h3>
          <p>
            Use the search above to find medical procedures or diagnoses, then select one to see
            detailed information including definitions, synonyms, and relationships.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='concept-details'>
      <div className='concept-header'>
        <div className='concept-title'>
          <h2>{concept.display}</h2>
          {concept.fullySpecifiedName && concept.fullySpecifiedName !== concept.display && (
            <div className='fully-specified-name'>{concept.fullySpecifiedName}</div>
          )}
          <div className='concept-meta'>
            <span className='code'>Code: {concept.code}</span>
            {concept.inactive && <span className='status inactive'>Inactive</span>}
          </div>
        </div>
        {onClose && (
          <button className='close-button' onClick={onClose} aria-label='Close concept details'>
            ×
          </button>
        )}
      </div>

      <div className='concept-content'>
        {concept.definition && (
          <section className='definition-section'>
            <h3>Definition</h3>
            <p className='definition'>{concept.definition}</p>
          </section>
        )}

        {concept.synonyms.length > 0 && (
          <section className='synonyms-section'>
            <h3>Synonyms</h3>
            <p className='synonyms-text'>{concept.synonyms.join(', ')}</p>
          </section>
        )}

        {concept.designations &&
          concept.designations.length > 0 &&
          (() => {
            const uniqueDesignations = concept.designations.filter(
              designation =>
                !concept.synonyms.includes(designation.value) &&
                designation.value !== concept.fullySpecifiedName
            );
            return uniqueDesignations.length > 0 ? (
              <section className='designations-section'>
                <h3>Designations</h3>
                <div className='designations-list'>
                  {uniqueDesignations.map((designation, index) => (
                    <div key={index} className='designation'>
                      <span className='designation-use'>{designation.use.display}</span>
                      <span className='designation-value'>{designation.value}</span>
                    </div>
                  ))}
                </div>
              </section>
            ) : null;
          })()}

        {Object.keys(concept.properties).length > 0 && (
          <section className='properties-section'>
            <div
              className='collapsible-header'
              onClick={() => setIsPropertiesExpanded(!isPropertiesExpanded)}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setIsPropertiesExpanded(!isPropertiesExpanded);
                }
              }}
              role='button'
              tabIndex={0}
              aria-expanded={isPropertiesExpanded}
            >
              <h3>Additional Properties</h3>
              <button
                className={`toggle-button ${isPropertiesExpanded ? 'expanded' : ''}`}
                aria-expanded={isPropertiesExpanded}
                aria-label={`${isPropertiesExpanded ? 'Collapse' : 'Expand'} additional properties`}
              >
                <svg
                  width='12'
                  height='12'
                  viewBox='0 0 12 12'
                  fill='none'
                  xmlns='http://www.w3.org/2000/svg'
                >
                  <path
                    d='M4 6L6 8L8 6'
                    stroke='currentColor'
                    strokeWidth='1.5'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                  />
                </svg>
              </button>
            </div>
            {isPropertiesExpanded && (
              <div className='properties-table'>
                {Object.entries(concept.properties)
                  .filter(([key]) => key !== 'normalForm' && key !== 'normalFormTerse')
                  .map(([key, value]) => (
                    <div key={key} className='property-row'>
                      <div className='property-key'>{key}</div>
                      <div className='property-value'>
                        {typeof value === 'boolean' ? (value ? 'true' : 'false') : String(value)}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </section>
        )}

        <section className='normal-form-section'>
          <h3>Normal Form Expression</h3>
          <NormalFormTree
            normalForm={concept.properties.normalForm ?? `Mock expression for ${concept.code}`}
            onConceptSelect={onConceptSelect}
          />
        </section>
      </div>
    </div>
  );
}
