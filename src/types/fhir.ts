// FHIR ValueSet $expand response types
export interface ValueSetExpansion {
  resourceType: 'ValueSet';
  url: string;
  name: string;
  status: string;
  experimental: boolean;
  copyright?: string;
  expansion: {
    extension?: Array<{
      url: string;
      valueBoolean: boolean;
    }>;
    identifier: string;
    timestamp: string;
    total: number;
    offset: number;
    parameter: Array<{
      name: string;
      valueUri?: string;
      valueCode?: string;
      valueString?: string;
      valueBoolean?: boolean;
      valueInteger?: number;
    }>;
    contains: ConceptSuggestion[];
  };
}

export interface ConceptSuggestion {
  system: string;
  code: string;
  display: string;
  inactive?: boolean;
  designation?: Designation[];
  extension?: Array<{
    url: string;
    extension: Array<{
      url: string;
      valueBoolean: boolean;
    }>;
  }>;
}

export interface Designation {
  language: string;
  use: {
    system: string;
    code: string;
    display: string;
  };
  value: string;
}

// FHIR CodeSystem $lookup response types
export interface CodeSystemLookupResponse {
  resourceType: 'Parameters';
  parameter: Parameter[];
}

export interface Parameter {
  name: string;
  valueCode?: string;
  valueString?: string;
  valueUri?: string;
  valueBoolean?: boolean;
  part?: ParameterPart[];
}

export interface ParameterPart {
  name: string;
  valueCode?: string;
  valueString?: string;
  valueBoolean?: boolean;
  valueCoding?: {
    system: string;
    code: string;
    display: string;
  };
}

// Parsed concept details for UI display
export interface ConceptDetails {
  code: string;
  display: string;
  system: string;
  version?: string;
  name?: string;
  inactive: boolean;
  definition?: string;
  parents?: string[];
  children?: string[];
  synonyms: string[];
  fullySpecifiedName?: string;
  properties: Record<string, any>;
  designations: Designation[];
}

// API Error handling
export interface OperationOutcome {
  resourceType: 'OperationOutcome';
  issue: Array<{
    severity: 'fatal' | 'error' | 'warning' | 'information';
    code: string;
    details?: {
      text: string;
    };
    diagnostics?: string;
    location?: string[];
  }>;
}

// UI State types
export interface SearchState {
  query: string;
  isLoading: boolean;
  suggestions: ConceptSuggestion[];
  selectedConcept: ConceptDetails | null;
  error: string | null;
}

export interface ApiConfig {
  baseUrl: string;
  offlineMode: boolean;
  debounceDelay: number;
  defaultCount: number;
}
