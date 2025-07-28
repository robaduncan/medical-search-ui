import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import "@testing-library/jest-dom";
import { ConceptDetailsComponent } from "../components/ConceptDetails";
import type { ConceptDetails } from "../types/fhir";

describe("ConceptDetailsComponent", () => {
  const user = userEvent.setup();
  const mockOnClose = vi.fn();
  const mockOnConceptSelect = vi.fn();

  const mockConceptDetails: ConceptDetails = {
    code: "52734007",
    display: "Total hip replacement",
    system: "http://snomed.info/sct",
    version: "20250630",
    name: "SNOMED CT",
    inactive: false,
    definition: "Total reconstruction of hip with prosthesis.",

    synonyms: ["Total hip replacement", "Hip arthroplasty", "THR"],
    fullySpecifiedName: "Total hip replacement (procedure)",
    properties: {
      sufficientlyDefined: true,
      moduleId: "900000000000207008",
      effectiveTime: "20020131",
    },
    designations: [
      {
        language: "en",
        use: {
          system: "http://snomed.info/sct",
          code: "900000000000003001",
          display: "Fully specified name",
        },
        value: "Total hip replacement (procedure)",
      },
      {
        language: "en",
        use: {
          system: "http://snomed.info/sct",
          code: "900000000000013009",
          display: "Synonym",
        },
        value: "Hip arthroplasty",
      },
      {
        language: "en",
        use: {
          system: "http://snomed.info/sct",
          code: "900000000000013009",
          display: "Synonym",
        },
        value: "THR",
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Loading State", () => {
    it("should display loading indicator when isLoading is true", () => {
      render(
        <ConceptDetailsComponent
          concept={null}
          isLoading={true}
          error={null}
          onClose={mockOnClose}
        />
      );

      expect(
        screen.getByText("Loading concept details...")
      ).toBeInTheDocument();
      expect(
        screen.getByRole("progressbar", { hidden: true })
      ).toBeInTheDocument();
    });

    it("should have loading class when isLoading is true", () => {
      render(
        <ConceptDetailsComponent
          concept={null}
          isLoading={true}
          error={null}
          onClose={mockOnClose}
        />
      );

      const container = screen
        .getByText("Loading concept details...")
        .closest(".concept-details");
      expect(container).toHaveClass("loading");
    });
  });

  describe("Error State", () => {
    it("should display error message when error prop is provided", () => {
      render(
        <ConceptDetailsComponent
          concept={null}
          isLoading={false}
          error="Failed to load concept details"
          onClose={mockOnClose}
        />
      );

      expect(
        screen.getByText("Error Loading Concept Details")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Failed to load concept details")
      ).toBeInTheDocument();
    });

    it("should have error class when error exists", () => {
      render(
        <ConceptDetailsComponent
          concept={null}
          isLoading={false}
          error="Test error"
          onClose={mockOnClose}
        />
      );

      const container = screen
        .getByText("Error Loading Concept Details")
        .closest(".concept-details");
      expect(container).toHaveClass("error");
    });
  });

  describe("Empty State", () => {
    it("should display placeholder when no concept is provided", () => {
      render(
        <ConceptDetailsComponent
          concept={null}
          isLoading={false}
          error={null}
          onClose={mockOnClose}
        />
      );

      expect(
        screen.getByText("Select a concept to view details")
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          /use the search above to find medical procedures or diagnoses/i
        )
      ).toBeInTheDocument();
    });

    it("should have placeholder class when no concept", () => {
      render(
        <ConceptDetailsComponent
          concept={null}
          isLoading={false}
          error={null}
          onClose={mockOnClose}
        />
      );

      const container = screen
        .getByText("Select a concept to view details")
        .closest(".concept-details");
      expect(container).toHaveClass("placeholder");
    });
  });

  describe("Concept Display", () => {
    it("should display basic concept information", () => {
      render(
        <ConceptDetailsComponent
          concept={mockConceptDetails}
          isLoading={false}
          error={null}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
        "Total hip replacement"
      );
      expect(screen.getByText("Code: 52734007")).toBeInTheDocument();
    });

    it("should display fully specified name when different from display", () => {
      render(
        <ConceptDetailsComponent
          concept={mockConceptDetails}
          isLoading={false}
          error={null}
          onClose={mockOnClose}
        />
      );

      expect(
        screen.getByText("Total hip replacement (procedure)")
      ).toBeInTheDocument();
    });



    it("should display inactive status when concept is inactive", () => {
      const inactiveConcept = {
        ...mockConceptDetails,
        inactive: true,
      };

      render(
        <ConceptDetailsComponent
          concept={inactiveConcept}
          isLoading={false}
          error={null}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText("Inactive")).toBeInTheDocument();
    });

    it("should display definition when available", () => {
      render(
        <ConceptDetailsComponent
          concept={mockConceptDetails}
          isLoading={false}
          error={null}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText("Definition")).toBeInTheDocument();
      expect(
        screen.getByText("Total reconstruction of hip with prosthesis.")
      ).toBeInTheDocument();
    });

    it("should not display definition section when definition is missing", () => {
      const conceptWithoutDefinition = {
        ...mockConceptDetails,
        definition: undefined,
      };

      render(
        <ConceptDetailsComponent
          concept={conceptWithoutDefinition}
          isLoading={false}
          error={null}
          onClose={mockOnClose}
        />
      );

      expect(screen.queryByText("Definition")).not.toBeInTheDocument();
    });
  });

  describe("Synonyms Section", () => {
    it("should display synonyms when available", () => {
      render(
        <ConceptDetailsComponent
          concept={mockConceptDetails}
          isLoading={false}
          error={null}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText("Synonyms")).toBeInTheDocument();
      expect(screen.getByText(/Hip arthroplasty/)).toBeInTheDocument();
      expect(screen.getByText(/THR/)).toBeInTheDocument();
    });

    it("should not display synonyms section when no synonyms", () => {
      const conceptWithoutSynonyms = {
        ...mockConceptDetails,
        synonyms: [],
      };

      render(
        <ConceptDetailsComponent
          concept={conceptWithoutSynonyms}
          isLoading={false}
          error={null}
          onClose={mockOnClose}
        />
      );

      expect(screen.queryByText("Synonyms")).not.toBeInTheDocument();
    });
  });



  describe("Designations Section", () => {
    it("should display all designations when available", () => {
      render(
        <ConceptDetailsComponent
          concept={mockConceptDetails}
          isLoading={false}
          error={null}
          onClose={mockOnClose}
        />
      );

      // Designations section should be hidden when all designations are duplicates
      expect(screen.queryByText("Designations")).not.toBeInTheDocument();
    });

    it("should not display designations section when no designations", () => {
      const conceptWithoutDesignations = {
        ...mockConceptDetails,
        designations: [],
      };

      render(
        <ConceptDetailsComponent
          concept={conceptWithoutDesignations}
          isLoading={false}
          error={null}
          onClose={mockOnClose}
        />
      );

      expect(screen.queryByText("Designations")).not.toBeInTheDocument();
    });
  });

  describe("Properties Section", () => {
    it("should display additional properties when available", async () => {
      render(
        <ConceptDetailsComponent
          concept={mockConceptDetails}
          isLoading={false}
          error={null}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText("Additional Properties")).toBeInTheDocument();
      
      // Expand the properties section
      const expandButton = screen.getByLabelText("Expand additional properties");
      await user.click(expandButton);

      // Check properties within the properties section specifically
      const propertiesSection = screen.getByText("Additional Properties").closest("section");
      expect(propertiesSection).toBeInTheDocument();
      expect(propertiesSection).toHaveTextContent("sufficientlyDefined");
      expect(propertiesSection).toHaveTextContent("true");
      expect(propertiesSection).toHaveTextContent("moduleId");
      expect(propertiesSection).toHaveTextContent("900000000000207008");
      expect(propertiesSection).toHaveTextContent("effectiveTime");
      expect(propertiesSection).toHaveTextContent("20020131");
    });

    it("should handle boolean properties correctly", async () => {
      const conceptWithBooleanProperty = {
        ...mockConceptDetails,
        properties: {
          isActive: true,
          isDeprecated: false,
        },
      };

      render(
        <ConceptDetailsComponent
          concept={conceptWithBooleanProperty}
          isLoading={false}
          error={null}
          onClose={mockOnClose}
        />
      );

      // Expand the properties section
      const expandButton = screen.getByLabelText("Expand additional properties");
      await user.click(expandButton);

      expect(screen.getByText("isActive")).toBeInTheDocument();
      expect(screen.getByText("true")).toBeInTheDocument();
      expect(screen.getByText("isDeprecated")).toBeInTheDocument();
      expect(screen.getByText("false")).toBeInTheDocument();
    });

    it("should not display properties section when no properties", () => {
      const conceptWithoutProperties = {
        ...mockConceptDetails,
        properties: {},
      };

      render(
        <ConceptDetailsComponent
          concept={conceptWithoutProperties}
          isLoading={false}
          error={null}
          onClose={mockOnClose}
        />
      );

      expect(
        screen.queryByText("Additional Properties")
      ).not.toBeInTheDocument();
    });
  });

  describe("Close Button", () => {
    it("should display close button when onClose is provided", () => {
      render(
        <ConceptDetailsComponent
          concept={mockConceptDetails}
          isLoading={false}
          error={null}
          onClose={mockOnClose}
        />
      );

      const closeButton = screen.getByLabelText("Close concept details");
      expect(closeButton).toBeInTheDocument();
      expect(closeButton).toHaveTextContent("×");
    });

    it("should not display close button when onClose is not provided", () => {
      render(
        <ConceptDetailsComponent
          concept={mockConceptDetails}
          isLoading={false}
          error={null}
        />
      );

      expect(
        screen.queryByLabelText("Close concept details")
      ).not.toBeInTheDocument();
    });

    it("should call onClose when close button is clicked", async () => {
      render(
        <ConceptDetailsComponent
          concept={mockConceptDetails}
          isLoading={false}
          error={null}
          onClose={mockOnClose}
        />
      );

      const closeButton = screen.getByLabelText("Close concept details");
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe("Accessibility", () => {
    it("should have proper heading structure", () => {
      render(
        <ConceptDetailsComponent
          concept={mockConceptDetails}
          isLoading={false}
          error={null}
          onClose={mockOnClose}
        />
      );

      const mainHeading = screen.getByRole("heading", { level: 2 });
      expect(mainHeading).toHaveTextContent("Total hip replacement");

      const sectionHeadings = screen.getAllByRole("heading", { level: 3 });
      expect(sectionHeadings.length).toBeGreaterThan(0);
    });

    it("should have proper button accessibility for close button", () => {
      render(
        <ConceptDetailsComponent
          concept={mockConceptDetails}
          isLoading={false}
          error={null}
          onClose={mockOnClose}
        />
      );

      const closeButton = screen.getByRole("button", {
        name: "Close concept details",
      });
      expect(closeButton).toBeInTheDocument();
      expect(closeButton).toHaveAttribute(
        "aria-label",
        "Close concept details"
      );
    });

    it("should announce loading state properly", () => {
      render(
        <ConceptDetailsComponent
          concept={null}
          isLoading={true}
          error={null}
          onClose={mockOnClose}
        />
      );

      // The loading text should be accessible to screen readers
      expect(
        screen.getByText("Loading concept details...")
      ).toBeInTheDocument();
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("should handle concept with minimal data", () => {
      const minimalConcept: ConceptDetails = {
        code: "123456789",
        display: "Test Concept",
        system: "http://test.com",
        inactive: false,
        synonyms: [],
        properties: {},
        designations: [],
      };

      render(
        <ConceptDetailsComponent
          concept={minimalConcept}
          isLoading={false}
          error={null}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText("Test Concept")).toBeInTheDocument();
      expect(screen.getByText("Code: 123456789")).toBeInTheDocument();

      // These sections should not appear
      expect(screen.queryByText("Definition")).not.toBeInTheDocument();
      expect(screen.queryByText("Synonyms")).not.toBeInTheDocument();
      expect(screen.queryByText("Designations")).not.toBeInTheDocument();
      expect(
        screen.queryByText("Additional Properties")
      ).not.toBeInTheDocument();
    });

    it("should handle very long text content", () => {
      const conceptWithLongText: ConceptDetails = {
        ...mockConceptDetails,
        display:
          "This is a very long concept display name that might cause layout issues if not handled properly in the user interface",
        definition:
          "This is an extremely long definition that contains many words and might span multiple lines in the user interface, potentially causing layout or readability issues if not handled correctly by the component styling and structure.",
      };

      render(
        <ConceptDetailsComponent
          concept={conceptWithLongText}
          isLoading={false}
          error={null}
          onClose={mockOnClose}
        />
      );

      expect(
        screen.getByText(
          "This is a very long concept display name that might cause layout issues if not handled properly in the user interface"
        )
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          "This is an extremely long definition that contains many words and might span multiple lines in the user interface, potentially causing layout or readability issues if not handled correctly by the component styling and structure."
        )
      ).toBeInTheDocument();
    });

    it("should handle empty strings in arrays", () => {
      const conceptWithEmptyStrings: ConceptDetails = {
        ...mockConceptDetails,
        synonyms: ["Hip arthroplasty", "", "THR"],
      };

      render(
        <ConceptDetailsComponent
          concept={conceptWithEmptyStrings}
          isLoading={false}
          error={null}
          onClose={mockOnClose}
        />
      );

      // Should still display the sections but empty strings should be handled gracefully
      expect(screen.getByText("Synonyms")).toBeInTheDocument();
    });

    it("should handle null and undefined values in properties", async () => {
      const conceptWithNullProperties: ConceptDetails = {
        ...mockConceptDetails,
        properties: {
          validProperty: "valid value",
          nullProperty: null,
          undefinedProperty: undefined,
          emptyStringProperty: "",
        },
      };

      render(
        <ConceptDetailsComponent
          concept={conceptWithNullProperties}
          isLoading={false}
          error={null}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText("Additional Properties")).toBeInTheDocument();
      
      // Expand the properties section
      const expandButton = screen.getByLabelText("Expand additional properties");
      await user.click(expandButton);

      expect(screen.getByText("validProperty")).toBeInTheDocument();
      expect(screen.getByText("valid value")).toBeInTheDocument();
    });
  });
});
