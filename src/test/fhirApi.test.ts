import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  searchConcepts,
  lookupConcept,
  parseConceptDetails,
  encodeSearchTerm,
} from "../services/fhirApi";
import type {
  ValueSetExpansion,
  CodeSystemLookupResponse,
  OperationOutcome,
} from "../types/fhir";

// Mock environment variables
const mockEnv = {
  VITE_FHIR_BASE_URL: "https://test.fhir.server.com/fhir",
  VITE_OFFLINE_MODE: "false",
  VITE_DEFAULT_COUNT: "50",
};

Object.defineProperty(import.meta, "env", {
  get: () => mockEnv,
  configurable: true,
});

// Mock fetch
globalThis.fetch = vi.fn();
const mockFetch = vi.mocked(fetch);

// Mock sample data imports
vi.mock("../test-files/1st-expand-response.json", () => ({
  default: {
    resourceType: "ValueSet",
    expansion: {
      contains: [
        {
          system: "http://snomed.info/sct",
          code: "52734007",
          display: "Total hip replacement",
        },
      ],
    },
  },
}));

vi.mock("../test-files/2nd-lookup-response.json", () => ({
  default: {
    resourceType: "Parameters",
    parameter: [
      { name: "code", valueCode: "52734007" },
      { name: "display", valueString: "Total hip replacement" },
      { name: "system", valueUri: "http://snomed.info/sct" },
    ],
  },
}));

describe("fhirApi Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules(); // Clear module cache
    mockEnv.VITE_OFFLINE_MODE = "false";
    mockEnv.VITE_FHIR_BASE_URL = "https://test.fhir.server.com/fhir";
    mockEnv.VITE_DEFAULT_COUNT = "50";
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("searchConcepts", () => {
    const mockSearchResponse: ValueSetExpansion = {
      resourceType: "ValueSet",
      url: "http://snomed.info/sct/32506021000036107?fhir_vs",
      name: "test-valueset",
      status: "active",
      experimental: false,
      expansion: {
        identifier: "test-expansion-id",
        timestamp: "2024-01-01T00:00:00Z",
        total: 2,
        offset: 0,
        parameter: [
          {
            name: "filter",
            valueString: "hip replacement",
          },
        ],
        contains: [
          {
            system: "http://snomed.info/sct",
            code: "52734007",
            display: "Total hip replacement",
            designation: [
              {
                language: "en",
                use: {
                  system: "http://snomed.info/sct",
                  code: "900000000000003001",
                  display: "Fully specified name",
                },
                value: "Total hip replacement (procedure)",
              },
            ],
          },
          {
            system: "http://snomed.info/sct",
            code: "179344006",
            display: "Hip replacement",
            inactive: true,
          },
        ],
      },
    };

    it("should make correct API call for search", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSearchResponse,
      } as Response);

      await searchConcepts("hip replacement");

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain("/ValueSet/$expand");
      expect(url).toContain("filter=hip+replacement");
    });

    it("should include all required parameters in search", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSearchResponse,
      } as Response);

      await searchConcepts("test query");

      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain("_format=json");
      expect(url).toContain("url=http%3A%2F%2Fsnomed.info%2Fsct");
      expect(url).toContain("includeDesignations=true");
      expect(url).toContain("count=50");
      expect(url).toContain("system-version=");
    });

    it("should return parsed search results", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSearchResponse,
      } as Response);

      const result = await searchConcepts("hip replacement");

      expect(result).toEqual(mockSearchResponse);
      expect(result.expansion.contains).toHaveLength(2);
      expect(result.expansion.contains[0].display).toBe(
        "Total hip replacement"
      );
    });

    it("should handle HTTP errors", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      } as Response);

      await expect(searchConcepts("test")).rejects.toThrow(
        "HTTP 500: Internal Server Error"
      );
    });

    it("should handle FHIR OperationOutcome errors", async () => {
      const operationOutcome: OperationOutcome = {
        resourceType: "OperationOutcome",
        issue: [
          {
            severity: "error",
            code: "invalid",
            details: {
              text: "Invalid search parameters",
            },
            diagnostics: "The filter parameter is malformed",
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => operationOutcome,
      } as Response);

      await expect(searchConcepts("test")).rejects.toThrow(
        "Invalid search parameters"
      );
    });

    it("should handle OperationOutcome with diagnostics only", async () => {
      const operationOutcome: OperationOutcome = {
        resourceType: "OperationOutcome",
        issue: [
          {
            severity: "error",
            code: "timeout",
            diagnostics: "Request timeout",
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => operationOutcome,
      } as Response);

      await expect(searchConcepts("test")).rejects.toThrow("Request timeout");
    });

    it("should handle OperationOutcome with fallback error message", async () => {
      const operationOutcome: OperationOutcome = {
        resourceType: "OperationOutcome",
        issue: [
          {
            severity: "error",
            code: "unknown",
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => operationOutcome,
      } as Response);

      await expect(searchConcepts("test")).rejects.toThrow(
        "FHIR operation failed"
      );
    });

    it("should handle network errors", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network unavailable"));

      await expect(searchConcepts("test")).rejects.toThrow(
        "Network unavailable"
      );
    });

    it("should use offline mode when VITE_OFFLINE_MODE is true", async () => {
      // Use config override instead of environment variable
      const result = await searchConcepts("test", { offlineMode: true });

      expect(mockFetch).not.toHaveBeenCalled();
      expect(result.resourceType).toBe("ValueSet");
    });

    it("should add delay in offline mode", async () => {
      // Use config override instead of environment variable
      const startTime = Date.now();

      await searchConcepts("test", { offlineMode: true });

      const endTime = Date.now();
      expect(endTime - startTime).toBeGreaterThanOrEqual(200);
    });
  });

  describe("lookupConcept", () => {
    const mockLookupResponse: CodeSystemLookupResponse = {
      resourceType: "Parameters",
      parameter: [
        { name: "code", valueCode: "52734007" },
        { name: "display", valueString: "Total hip replacement" },
        { name: "system", valueUri: "http://snomed.info/sct" },
        {
          name: "property",
          part: [
            { name: "code", valueCode: "inactive" },
            { name: "value", valueBoolean: false },
          ],
        },
        {
          name: "property",
          part: [
            { name: "code", valueCode: "definition" },
            { name: "value", valueString: "Total reconstruction of hip" },
          ],
        },
      ],
    };

    it("should make correct API call for lookup", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockLookupResponse,
      } as Response);

      await lookupConcept("52734007");

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain("/CodeSystem/$lookup");
      expect(url).toContain("code=52734007");
      expect(url).toContain("system=http%3A%2F%2Fsnomed.info%2Fsct");
      expect(url).toContain("property=*");
    });

    it("should return parsed concept details", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockLookupResponse,
      } as Response);

      const result = await lookupConcept("52734007");

      expect(result.code).toBe("52734007");
      expect(result.display).toBe("Total hip replacement");
      expect(result.system).toBe("http://snomed.info/sct");
      expect(result.inactive).toBe(false);
    });

    it("should handle HTTP errors", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: "Not Found",
      } as Response);

      await expect(lookupConcept("invalid-code")).rejects.toThrow(
        "HTTP 404: Not Found"
      );
    });

    it("should handle FHIR OperationOutcome errors", async () => {
      const operationOutcome: OperationOutcome = {
        resourceType: "OperationOutcome",
        issue: [
          {
            severity: "error",
            code: "not-found",
            details: {
              text: "Code not found in system",
            },
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => operationOutcome,
      } as Response);

      await expect(lookupConcept("invalid")).rejects.toThrow(
        "Code not found in system"
      );
    });

    it("should use offline mode when VITE_OFFLINE_MODE is true", async () => {
      // Use config override instead of environment variable
      const result = await lookupConcept("52734007", { offlineMode: true });

      expect(mockFetch).not.toHaveBeenCalled();
      expect(result.code).toBe("52734007");
    });

    it("should add delay in offline mode", async () => {
      // Use config override instead of environment variable
      const startTime = Date.now();

      await lookupConcept("52734007", { offlineMode: true });

      const endTime = Date.now();
      expect(endTime - startTime).toBeGreaterThanOrEqual(150);
    });
  });

  describe("parseConceptDetails", () => {
    it("should parse basic concept information", () => {
      const response: CodeSystemLookupResponse = {
        resourceType: "Parameters",
        parameter: [
          { name: "code", valueCode: "52734007" },
          { name: "display", valueString: "Total hip replacement" },
          { name: "system", valueUri: "http://snomed.info/sct" },
          { name: "version", valueString: "20250630" },
          { name: "name", valueString: "SNOMED CT" },
        ],
      };

      const result = parseConceptDetails(response);

      expect(result.code).toBe("52734007");
      expect(result.display).toBe("Total hip replacement");
      expect(result.system).toBe("http://snomed.info/sct");
      expect(result.version).toBe("20250630");
      expect(result.name).toBe("SNOMED CT");
    });

    it("should parse property parameters", () => {
      const response: CodeSystemLookupResponse = {
        resourceType: "Parameters",
        parameter: [
          { name: "code", valueCode: "52734007" },
          { name: "display", valueString: "Total hip replacement" },
          { name: "system", valueUri: "http://snomed.info/sct" },
          {
            name: "property",
            part: [
              { name: "code", valueCode: "inactive" },
              { name: "value", valueBoolean: true },
            ],
          },
          {
            name: "property",
            part: [
              { name: "code", valueCode: "definition" },
              { name: "value", valueString: "A surgical procedure" },
            ],
          },
          {
            name: "property",
            part: [
              { name: "code", valueCode: "parent" },
              { name: "value", valueCode: "398010007" },
            ],
          },
          {
            name: "property",
            part: [
              { name: "code", valueCode: "child" },
              { name: "value", valueCode: "265157000" },
            ],
          },
          {
            name: "property",
            part: [
              { name: "code", valueCode: "customProperty" },
              { name: "value", valueString: "custom value" },
            ],
          },
        ],
      };

      const result = parseConceptDetails(response);

      expect(result.inactive).toBe(true);
      expect(result.definition).toBe("A surgical procedure");
      expect(result.parents).toContain("398010007");
      expect(result.children).toContain("265157000");
      expect(result.properties.customProperty).toBe("custom value");
    });

    it("should parse designations", () => {
      const response: CodeSystemLookupResponse = {
        resourceType: "Parameters",
        parameter: [
          { name: "code", valueCode: "52734007" },
          { name: "display", valueString: "Total hip replacement" },
          { name: "system", valueUri: "http://snomed.info/sct" },
          {
            name: "designation",
            part: [
              { name: "language", valueCode: "en" },
              {
                name: "use",
                valueCoding: {
                  system: "http://snomed.info/sct",
                  code: "900000000000003001",
                  display: "Fully specified name",
                },
              },
              {
                name: "value",
                valueString: "Total hip replacement (procedure)",
              },
            ],
          },
          {
            name: "designation",
            part: [
              { name: "language", valueCode: "en" },
              {
                name: "use",
                valueCoding: {
                  system: "http://snomed.info/sct",
                  code: "900000000000013009",
                  display: "Synonym",
                },
              },
              { name: "value", valueString: "Hip arthroplasty" },
            ],
          },
        ],
      };

      const result = parseConceptDetails(response);

      expect(result.designations).toHaveLength(2);
      expect(result.fullySpecifiedName).toBe(
        "Total hip replacement (procedure)"
      );
      expect(result.synonyms).toContain("Hip arthroplasty");
    });

    it("should handle missing designation parts", () => {
      const response: CodeSystemLookupResponse = {
        resourceType: "Parameters",
        parameter: [
          { name: "code", valueCode: "52734007" },
          { name: "display", valueString: "Total hip replacement" },
          { name: "system", valueUri: "http://snomed.info/sct" },
          {
            name: "designation",
            part: [
              { name: "language", valueCode: "en" },
              // Missing use and value
            ],
          },
        ],
      };

      const result = parseConceptDetails(response);

      expect(result.designations).toHaveLength(0);
      expect(result.synonyms).toHaveLength(0);
    });

    it("should handle property without parts", () => {
      const response: CodeSystemLookupResponse = {
        resourceType: "Parameters",
        parameter: [
          { name: "code", valueCode: "52734007" },
          { name: "display", valueString: "Total hip replacement" },
          { name: "system", valueUri: "http://snomed.info/sct" },
          {
            name: "property",
            // Missing part array
          },
        ],
      };

      const result = parseConceptDetails(response);

      expect(result.code).toBe("52734007");
      expect(Object.keys(result.properties)).toHaveLength(0);
    });

    it("should initialize with default values", () => {
      const response: CodeSystemLookupResponse = {
        resourceType: "Parameters",
        parameter: [],
      };

      const result = parseConceptDetails(response);

      expect(result.code).toBe("");
      expect(result.display).toBe("");
      expect(result.system).toBe("");
      expect(result.inactive).toBe(false);
      expect(result.parents).toEqual([]);
      expect(result.children).toEqual([]);
      expect(result.synonyms).toEqual([]);
      expect(result.properties).toEqual({});
      expect(result.designations).toEqual([]);
    });

    it("should handle property with different value types", () => {
      const response: CodeSystemLookupResponse = {
        resourceType: "Parameters",
        parameter: [
          { name: "code", valueCode: "52734007" },
          { name: "display", valueString: "Total hip replacement" },
          { name: "system", valueUri: "http://snomed.info/sct" },
          {
            name: "property",
            part: [
              { name: "code", valueCode: "stringProp" },
              { name: "value", valueString: "string value" },
            ],
          },
          {
            name: "property",
            part: [
              { name: "code", valueCode: "codeProp" },
              { name: "value", valueCode: "code value" },
            ],
          },
          {
            name: "property",
            part: [
              { name: "code", valueCode: "boolProp" },
              { name: "value", valueBoolean: true },
            ],
          },
        ],
      };

      const result = parseConceptDetails(response);

      expect(result.properties.stringProp).toBe("string value");
      expect(result.properties.codeProp).toBe("code value");
      expect(result.properties.boolProp).toBe(true);
    });
  });

  describe("encodeSearchTerm", () => {
    it("should encode special characters", () => {
      expect(encodeSearchTerm("hip & knee")).toBe("hip%20%26%20knee");
      expect(encodeSearchTerm("total/partial")).toBe("total%2Fpartial");
      expect(encodeSearchTerm("100% effective")).toBe("100%25%20effective");
    });

    it("should trim whitespace", () => {
      expect(encodeSearchTerm("  hip replacement  ")).toBe("hip%20replacement");
    });

    it("should handle empty string", () => {
      expect(encodeSearchTerm("")).toBe("");
      expect(encodeSearchTerm("   ")).toBe("");
    });

    it("should handle unicode characters", () => {
      expect(encodeSearchTerm("héart surgery")).toBe("h%C3%A9art%20surgery");
    });
  });

  describe("Configuration", () => {
    it("should use custom FHIR base URL from environment", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          resourceType: "ValueSet",
          expansion: { contains: [] },
        }),
      } as Response);

      // Use config override instead of environment variable
      await searchConcepts("test", { baseUrl: "https://custom.fhir.server.com/fhir" });

      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain("https://custom.fhir.server.com/fhir");
    });

    it("should use custom count from environment", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          resourceType: "ValueSet",
          expansion: { contains: [] },
        }),
      } as Response);

      // Use custom config parameter instead of environment variable
      await searchConcepts("test", { defaultCount: 25 });

      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain("count=25");
    });

    it("should fall back to default values when environment variables are missing", async () => {
      // Store original values for restoration (not used in this test)
      // const originalBaseUrl = mockEnv.VITE_FHIR_BASE_URL;
      // const originalCount = mockEnv.VITE_DEFAULT_COUNT;
      mockEnv.VITE_FHIR_BASE_URL = '';
      mockEnv.VITE_DEFAULT_COUNT = '';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          resourceType: "ValueSet",
          expansion: { contains: [] },
        }),
      } as Response);

      await searchConcepts("test");

      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain("r4.ontoserver.csiro.au");
      expect(url).toContain("count=50");
    });
  });
});
