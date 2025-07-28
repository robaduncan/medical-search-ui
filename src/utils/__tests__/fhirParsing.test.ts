import { describe, it, expect } from "vitest";
import { parseConceptDetails } from "../../services/fhirApi";

// Import sample data
import expandSampleData from "../../test-files/1st-expand-response.json";
import lookupSampleData from "../../test-files/2nd-lookup-response.json";
import type {
  CodeSystemLookupResponse,
  ValueSetExpansion,
} from "../../types/fhir";

describe("FHIR Response Parsing", () => {
  describe("ValueSet Expansion Response", () => {
    it("should have correct structure for expand response", () => {
      const data = expandSampleData as ValueSetExpansion;

      expect(data.resourceType).toBe("ValueSet");
      expect(data.expansion).toBeDefined();
      expect(data.expansion.contains).toBeInstanceOf(Array);
      expect(data.expansion.contains.length).toBeGreaterThan(0);
    });

    it("should contain expected concept properties", () => {
      const data = expandSampleData as ValueSetExpansion;
      const firstConcept = data.expansion.contains[0];

      expect(firstConcept).toHaveProperty("system");
      expect(firstConcept).toHaveProperty("code");
      expect(firstConcept).toHaveProperty("display");
      expect(firstConcept.system).toBe("http://snomed.info/sct");
      expect(typeof firstConcept.code).toBe("string");
      expect(typeof firstConcept.display).toBe("string");
    });

    it("should contain designations with proper structure", () => {
      const data = expandSampleData as ValueSetExpansion;
      const conceptWithDesignations = data.expansion.contains.find(
        (c) => c.designation && c.designation.length > 0
      );

      expect(conceptWithDesignations).toBeDefined();
      expect(conceptWithDesignations!.designation).toBeInstanceOf(Array);

      const designation = conceptWithDesignations!.designation![0];
      expect(designation).toHaveProperty("language");
      expect(designation).toHaveProperty("use");
      expect(designation).toHaveProperty("value");
      expect(designation.use).toHaveProperty("system");
      expect(designation.use).toHaveProperty("code");
      expect(designation.use).toHaveProperty("display");
    });
  });

  describe("CodeSystem Lookup Response Parsing", () => {
    it("should parse lookup response correctly", () => {
      const data = lookupSampleData as CodeSystemLookupResponse;
      const parsed = parseConceptDetails(data);

      expect(parsed).toHaveProperty("code");
      expect(parsed).toHaveProperty("display");
      expect(parsed).toHaveProperty("system");
      expect(parsed).toHaveProperty("inactive");
      expect(parsed).toHaveProperty("parents");
      expect(parsed).toHaveProperty("children");
      expect(parsed).toHaveProperty("synonyms");
      expect(parsed).toHaveProperty("designations");
      expect(parsed).toHaveProperty("properties");
    });

    it("should extract basic concept information", () => {
      const data = lookupSampleData as CodeSystemLookupResponse;
      const parsed = parseConceptDetails(data);

      expect(parsed.code).toBe("52734007");
      expect(parsed.display).toBe("Total hip replacement");
      expect(parsed.system).toBe("http://snomed.info/sct");
      expect(parsed.inactive).toBe(false);
    });

    it("should extract definition from properties", () => {
      const data = lookupSampleData as CodeSystemLookupResponse;
      const parsed = parseConceptDetails(data);

      expect(parsed.definition).toBe(
        "Total reconstruction of hip with prosthesis."
      );
    });

    it("should extract parent and child relationships", () => {
      const data = lookupSampleData as CodeSystemLookupResponse;
      const parsed = parseConceptDetails(data);

      expect(parsed.parents).toBeInstanceOf(Array);
      expect(parsed.children).toBeInstanceOf(Array);
      expect(parsed.parents.length).toBeGreaterThan(0);
      expect(parsed.children.length).toBeGreaterThan(0);

      // Check for expected parent
      expect(parsed.parents).toContain("398010007");

      // Check that children are valid SNOMED codes (numeric)
      parsed.children.forEach((child) => {
        expect(child).toMatch(/^\d+$/);
      });
    });

    it("should extract synonyms from designations", () => {
      const data = lookupSampleData as CodeSystemLookupResponse;
      const parsed = parseConceptDetails(data);

      expect(parsed.synonyms).toBeInstanceOf(Array);
      expect(parsed.synonyms.length).toBeGreaterThan(0);
      expect(parsed.synonyms).toContain("Total hip replacement");
    });

    it("should preserve all designations", () => {
      const data = lookupSampleData as CodeSystemLookupResponse;
      const parsed = parseConceptDetails(data);

      expect(parsed.designations).toBeInstanceOf(Array);
      expect(parsed.designations.length).toBeGreaterThan(0);

      // Check designation structure
      const designation = parsed.designations[0];
      expect(designation).toHaveProperty("language");
      expect(designation).toHaveProperty("use");
      expect(designation).toHaveProperty("value");
      expect(designation.use).toHaveProperty("system");
      expect(designation.use).toHaveProperty("code");
      expect(designation.use).toHaveProperty("display");
    });

    it("should handle missing optional fields gracefully", () => {
      // Test with minimal data
      const minimalData: CodeSystemLookupResponse = {
        resourceType: "Parameters",
        parameter: [
          { name: "code", valueCode: "12345" },
          { name: "display", valueString: "Test Concept" },
          { name: "system", valueUri: "http://snomed.info/sct" },
        ],
      };

      const parsed = parseConceptDetails(minimalData);

      expect(parsed.code).toBe("12345");
      expect(parsed.display).toBe("Test Concept");
      expect(parsed.system).toBe("http://snomed.info/sct");
      expect(parsed.definition).toBeUndefined();
      expect(parsed.parents).toEqual([]);
      expect(parsed.children).toEqual([]);
      expect(parsed.synonyms).toEqual([]);
      expect(parsed.inactive).toBe(false);
    });
  });

  describe("Data Validation", () => {
    it("should validate that sample data represents expected search term", () => {
      const data = expandSampleData as ValueSetExpansion;

      // Check that the sample data is related to hip replacement
      const hipReplacementConcepts = data.expansion.contains.filter(
        (concept) =>
          concept.display.toLowerCase().includes("hip") &&
          concept.display.toLowerCase().includes("replacement")
      );

      expect(hipReplacementConcepts.length).toBeGreaterThan(0);
    });

    it("should verify lookup data matches the first expand result", () => {
      const expandData = expandSampleData as ValueSetExpansion;
      const lookupData = lookupSampleData as CodeSystemLookupResponse;

      const firstConcept = expandData.expansion.contains[0];
      const parsed = parseConceptDetails(lookupData);

      // The lookup should be for the same code as the first expand result
      expect(parsed.code).toBe(firstConcept.code);
      expect(parsed.display).toBe(firstConcept.display);
    });
  });

  describe("Error Handling and Edge Cases", () => {
    it("should handle parseConceptDetails with malformed property parts", () => {
      const malformedData: CodeSystemLookupResponse = {
        resourceType: "Parameters",
        parameter: [
          { name: "code", valueCode: "52734007" },
          { name: "display", valueString: "Total hip replacement" },
          { name: "system", valueUri: "http://snomed.info/sct" },
          {
            name: "property",
            part: [
              // Missing code name
              { name: "value", valueString: "some value" },
            ],
          },
        ],
      };

      const parsed = parseConceptDetails(malformedData);

      expect(parsed.code).toBe("52734007");
      expect(parsed.display).toBe("Total hip replacement");
      expect(parsed.system).toBe("http://snomed.info/sct");
      expect(Object.keys(parsed.properties)).toHaveLength(0);
    });

    it("should handle parseConceptDetails with missing designation use", () => {
      const dataWithMissingUse: CodeSystemLookupResponse = {
        resourceType: "Parameters",
        parameter: [
          { name: "code", valueCode: "52734007" },
          { name: "display", valueString: "Total hip replacement" },
          { name: "system", valueUri: "http://snomed.info/sct" },
          {
            name: "designation",
            part: [
              { name: "language", valueCode: "en" },
              { name: "value", valueString: "Hip replacement procedure" },
              // Missing use
            ],
          },
        ],
      };

      const parsed = parseConceptDetails(dataWithMissingUse);

      expect(parsed.designations).toHaveLength(0);
      expect(parsed.synonyms).toHaveLength(0);
    });

    it("should handle parseConceptDetails with missing designation value", () => {
      const dataWithMissingValue: CodeSystemLookupResponse = {
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
                  code: "900000000000013009",
                  display: "Synonym",
                },
              },
              // Missing value
            ],
          },
        ],
      };

      const parsed = parseConceptDetails(dataWithMissingValue);

      expect(parsed.designations).toHaveLength(0);
      expect(parsed.synonyms).toHaveLength(0);
    });

    it("should handle parseConceptDetails with multiple parent and child relationships", () => {
      const dataWithMultipleRelations: CodeSystemLookupResponse = {
        resourceType: "Parameters",
        parameter: [
          { name: "code", valueCode: "52734007" },
          { name: "display", valueString: "Total hip replacement" },
          { name: "system", valueUri: "http://snomed.info/sct" },
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
              { name: "code", valueCode: "parent" },
              { name: "value", valueCode: "736537007" },
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
              { name: "code", valueCode: "child" },
              { name: "value", valueCode: "397956004" },
            ],
          },
        ],
      };

      const parsed = parseConceptDetails(dataWithMultipleRelations);

      expect(parsed.parents).toHaveLength(2);
      expect(parsed.parents).toContain("398010007");
      expect(parsed.parents).toContain("736537007");
      expect(parsed.children).toHaveLength(2);
      expect(parsed.children).toContain("265157000");
      expect(parsed.children).toContain("397956004");
    });

    it("should handle parseConceptDetails with complex property values", () => {
      const dataWithComplexProperties: CodeSystemLookupResponse = {
        resourceType: "Parameters",
        parameter: [
          { name: "code", valueCode: "52734007" },
          { name: "display", valueString: "Total hip replacement" },
          { name: "system", valueUri: "http://snomed.info/sct" },
          {
            name: "property",
            part: [
              { name: "code", valueCode: "effectiveTime" },
              { name: "value", valueString: "20020131" },
            ],
          },
          {
            name: "property",
            part: [
              { name: "code", valueCode: "moduleId" },
              { name: "value", valueCode: "900000000000207008" },
            ],
          },
          {
            name: "property",
            part: [
              { name: "code", valueCode: "sufficientlyDefined" },
              { name: "value", valueBoolean: true },
            ],
          },
        ],
      };

      const parsed = parseConceptDetails(dataWithComplexProperties);

      expect(parsed.properties.effectiveTime).toBe("20020131");
      expect(parsed.properties.moduleId).toBe("900000000000207008");
      expect(parsed.properties.sufficientlyDefined).toBe(true);
    });

    it("should handle designation with default language when missing", () => {
      const dataWithMissingLanguage: CodeSystemLookupResponse = {
        resourceType: "Parameters",
        parameter: [
          { name: "code", valueCode: "52734007" },
          { name: "display", valueString: "Total hip replacement" },
          { name: "system", valueUri: "http://snomed.info/sct" },
          {
            name: "designation",
            part: [
              // Missing language, should default to 'en'
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

      const parsed = parseConceptDetails(dataWithMissingLanguage);

      expect(parsed.designations).toHaveLength(1);
      expect(parsed.designations[0].language).toBe("en");
      expect(parsed.designations[0].value).toBe("Hip arthroplasty");
      expect(parsed.synonyms).toContain("Hip arthroplasty");
    });

    it("should validate ValueSet expansion structure completeness", () => {
      const data = expandSampleData as ValueSetExpansion;

      // Validate required ValueSet properties
      expect(data.resourceType).toBe("ValueSet");
      expect(data.expansion).toBeDefined();
      expect(data.expansion.contains).toBeInstanceOf(Array);

      // Validate expansion metadata
      expect(data.expansion.identifier).toBeDefined();
      expect(data.expansion.timestamp).toBeDefined();
      expect(typeof data.expansion.total).toBe("number");
      expect(typeof data.expansion.offset).toBe("number");

      // Validate each concept in contains array
      data.expansion.contains.forEach((concept) => {
        expect(concept.system).toBeDefined();
        expect(concept.code).toBeDefined();
        expect(concept.display).toBeDefined();
        expect(typeof concept.code).toBe("string");
        expect(typeof concept.display).toBe("string");

        // If designations exist, validate structure
        if (concept.designation) {
          concept.designation.forEach((designation) => {
            expect(designation.language).toBeDefined();
            expect(designation.use).toBeDefined();
            expect(designation.value).toBeDefined();
            expect(designation.use.system).toBeDefined();
            expect(designation.use.code).toBeDefined();
            expect(designation.use.display).toBeDefined();
          });
        }
      });
    });

    it("should validate CodeSystem lookup structure completeness", () => {
      const data = lookupSampleData as CodeSystemLookupResponse;

      // Validate required Parameters structure
      expect(data.resourceType).toBe("Parameters");
      expect(data.parameter).toBeInstanceOf(Array);
      expect(data.parameter.length).toBeGreaterThan(0);

      // Validate that basic parameters exist
      const codeParam = data.parameter.find((p) => p.name === "code");
      const displayParam = data.parameter.find((p) => p.name === "display");
      const systemParam = data.parameter.find((p) => p.name === "system");

      expect(codeParam).toBeDefined();
      expect(displayParam).toBeDefined();
      expect(systemParam).toBeDefined();

      expect(codeParam?.valueCode).toBeDefined();
      expect(displayParam?.valueString).toBeDefined();
      expect(systemParam?.valueUri).toBeDefined();

      // Validate property parameters if they exist
      const propertyParams = data.parameter.filter(
        (p) => p.name === "property"
      );
      propertyParams.forEach((propParam) => {
        expect(propParam.part).toBeInstanceOf(Array);
        if (propParam.part) {
          const codeElement = propParam.part.find((p) => p.name === "code");
          const valueElement = propParam.part.find((p) => p.name === "value");
          expect(codeElement).toBeDefined();
          expect(valueElement).toBeDefined();
        }
      });

      // Validate designation parameters if they exist
      const designationParams = data.parameter.filter(
        (p) => p.name === "designation"
      );
      designationParams.forEach((desigParam) => {
        expect(desigParam.part).toBeInstanceOf(Array);
        if (desigParam.part) {
          const useElement = desigParam.part.find((p) => p.name === "use");
          const valueElement = desigParam.part.find((p) => p.name === "value");
          expect(useElement?.valueCoding).toBeDefined();
          expect(valueElement?.valueString).toBeDefined();
        }
      });
    });
  });
});
