// Import sample data for offline mode
import expandSampleData from '../test-files/1st-expand-response.json';
import lookupSampleData from '../test-files/2nd-lookup-response.json';
import type {
  ValueSetExpansion,
  CodeSystemLookupResponse,
  ConceptDetails,
  OperationOutcome,
} from '../types/fhir';

function getConfig() {
  const env = import.meta.env;
  return {
    baseUrl: env.VITE_FHIR_BASE_URL || 'https://r4.ontoserver.csiro.au/fhir',
    offlineMode: env.VITE_OFFLINE_MODE === 'true',
    defaultCount: parseInt(env.VITE_DEFAULT_COUNT || '50'),
    systemVersion:
      'http://snomed.info/sct|http://snomed.info/sct/32506021000036107/version/20250630',
    valueSetUrl: 'http://snomed.info/sct/32506021000036107?fhir_vs=isa/71388002',
    codeSystem: 'http://snomed.info/sct',
  };
}

/**
 * Searches SNOMED CT concepts using FHIR ValueSet $expand
 */
export async function searchConcepts(
  filter: string,
  customConfig?: Partial<ReturnType<typeof getConfig>>
): Promise<ValueSetExpansion> {
  const config = { ...getConfig(), ...customConfig };

  if (config.offlineMode) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200));
    return expandSampleData as ValueSetExpansion;
  }

  const url = new URL(`${config.baseUrl}/ValueSet/$expand`);
  const params = {
    _format: 'json',
    url: config.valueSetUrl,
    filter,
    'system-version': config.systemVersion,
    includeDesignations: 'true',
    count: config.defaultCount.toString(),
    elements:
      'expansion.contains.code,expansion.contains.display,expansion.contains.fullySpecifiedName,expansion.contains.active',
  };

  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Accept: 'application/fhir+json',
        'Content-Type': 'application/fhir+json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Check if response is an OperationOutcome (error)
    if (data.resourceType === 'OperationOutcome') {
      const outcome = data as OperationOutcome;
      const errorMsg =
        outcome.issue[0]?.details?.text ?? outcome.issue[0]?.diagnostics ?? 'FHIR operation failed';
      throw new Error(errorMsg);
    }

    return data as ValueSetExpansion;
  } catch (error) {
    console.error('Error searching concepts:', error);
    throw error;
  }
}

/**
 * Gets detailed information about a SNOMED CT concept using FHIR CodeSystem $lookup
 */
export async function lookupConcept(
  code: string,
  customConfig?: Partial<ReturnType<typeof getConfig>>
): Promise<ConceptDetails> {
  const config = { ...getConfig(), ...customConfig };

  if (config.offlineMode) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 150));
    return parseConceptDetails(lookupSampleData as CodeSystemLookupResponse);
  }

  const url = new URL(`${config.baseUrl}/CodeSystem/$lookup`);
  const params = {
    code,
    system: config.codeSystem,
    property: '*',
  };

  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Accept: 'application/fhir+json',
        'Content-Type': 'application/fhir+json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Check if response is an OperationOutcome (error)
    if (data.resourceType === 'OperationOutcome') {
      const outcome = data as OperationOutcome;
      const errorMsg =
        outcome.issue[0]?.details?.text ?? outcome.issue[0]?.diagnostics ?? 'FHIR operation failed';
      throw new Error(errorMsg);
    }

    return parseConceptDetails(data as CodeSystemLookupResponse);
  } catch (error) {
    console.error('Error looking up concept:', error);
    throw error;
  }
}

/**
 * Parses FHIR Parameters response into a structured ConceptDetails object
 */
export function parseConceptDetails(response: CodeSystemLookupResponse): ConceptDetails {
  const params = response.parameter;

  const details: ConceptDetails = {
    code: '',
    display: '',
    system: '',
    inactive: false,
    parents: [],
    children: [],
    synonyms: [],
    properties: {},
    designations: [],
  };

  // Extract basic properties
  params.forEach(param => {
    switch (param.name) {
      case 'code':
        details.code = param.valueCode ?? '';
        break;
      case 'display':
        details.display = param.valueString ?? '';
        break;
      case 'system':
        details.system = param.valueUri ?? '';
        break;
      case 'version':
        details.version = param.valueString;
        break;
      case 'name':
        details.name = param.valueString;
        break;
      case 'property':
        if (param.part) {
          const propertyCode = param.part.find(p => p.name === 'code')?.valueCode;
          const propertyValue = param.part.find(p => p.name === 'value');

          if (propertyCode) {
            switch (propertyCode) {
              case 'inactive':
                details.inactive = propertyValue?.valueBoolean ?? false;
                break;
              case 'definition':
                details.definition = propertyValue?.valueString;
                break;
              case 'parent':
                if (propertyValue?.valueCode) {
                  details.parents.push(propertyValue.valueCode);
                }
                break;
              case 'child':
                if (propertyValue?.valueCode) {
                  details.children.push(propertyValue.valueCode);
                }
                break;
              default:
                details.properties[propertyCode] =
                  propertyValue?.valueString ??
                  propertyValue?.valueCode ??
                  propertyValue?.valueBoolean;
            }
          }
        }
        break;
      case 'designation':
        if (param.part) {
          const language = param.part.find(p => p.name === 'language')?.valueCode ?? 'en';
          const use = param.part.find(p => p.name === 'use')?.valueCoding;
          const value = param.part.find(p => p.name === 'value')?.valueString;

          if (use && value) {
            const designation = {
              language,
              use: {
                system: use.system,
                code: use.code,
                display: use.display,
              },
              value,
            };

            details.designations.push(designation);

            // Extract specific designation types
            if (use.code === '900000000000013009') {
              // Synonym
              details.synonyms.push(value);
            } else if (use.code === '900000000000003001') {
              // Fully specified name
              details.fullySpecifiedName = value;
            }
          }
        }
        break;
    }
  });

  return details;
}

/**
 * Utility function to encode search terms for URL parameters
 */
export function encodeSearchTerm(term: string): string {
  return encodeURIComponent(term.trim());
}
