import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import App from "../App";
import * as fhirApi from "../services/fhirApi";
import type { ValueSetExpansion, ConceptDetails } from "../types/fhir";

// Mock the fhirApi module
vi.mock("../services/fhirApi");
const mockSearchConcepts = vi.mocked(fhirApi.searchConcepts);
const mockLookupConcept = vi.mocked(fhirApi.lookupConcept);

describe("App Component", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const mockSearchResponse: ValueSetExpansion = {
    resourceType: "ValueSet",
    url: "http://test.com",
    name: "test",
    status: "active",
    experimental: false,
    expansion: {
      identifier: "test-id",
      timestamp: "2024-01-01T00:00:00Z",
      total: 2,
      offset: 0,
      parameter: [],
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

  const mockConceptDetails: ConceptDetails = {
    code: "52734007",
    display: "Total hip replacement",
    system: "http://snomed.info/sct",
    inactive: false,
    definition: "Total reconstruction of hip with prosthesis.",
    parents: ["398010007"],
    children: ["265157000"],
    synonyms: ["Total hip replacement", "Hip arthroplasty"],
    fullySpecifiedName: "Total hip replacement (procedure)",
    properties: {
      sufficientlyDefined: true,
      moduleId: "900000000000207008",
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
    ],
  };

  describe("Initial Render", () => {
    it("should render the main UI elements", () => {
      render(<App />);

      expect(
        screen.getByRole("heading", { name: /medical procedure search ui/i })
      ).toBeInTheDocument();
      expect(
        screen.getByText(/search for medical procedures using fhir/i)
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText(/search for medical procedures/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/select a concept to view details/i)
      ).toBeInTheDocument();
    });

    it("should display footer with external link", () => {
      render(<App />);

      expect(
        screen.getByText(/this application demonstrates fhir terminology/i)
      ).toBeInTheDocument();
      const externalLink = screen.getByRole("link", {
        name: /csiro ontoserver/i,
      });
      expect(externalLink).toHaveAttribute("target", "_blank");
      expect(externalLink).toHaveAttribute("rel", "noopener noreferrer");
    });
  });

  describe("Search Functionality", () => {
    it("should perform search when user types in search input", async () => {
      mockSearchConcepts.mockResolvedValue(mockSearchResponse);
      render(<App />);

      const searchInput = screen.getByPlaceholderText(
        /search for medical procedures/i
      );
      await user.type(searchInput, "hip replacement");

      // Wait for debounced search
      await waitFor(() => {
        expect(mockSearchConcepts).toHaveBeenCalledWith("hip replacement");
      });
    });

    it("should display search results as suggestions", async () => {
      mockSearchConcepts.mockResolvedValue(mockSearchResponse);
      render(<App />);

      const searchInput = screen.getByPlaceholderText(
        /search for medical procedures/i
      );
      await user.type(searchInput, "hip replacement");

      await waitFor(() => {
        expect(screen.getByText("Total hip replacement")).toBeInTheDocument();
        expect(screen.getByText("Hip replacement")).toBeInTheDocument();
      });
    });

    it("should handle search errors gracefully", async () => {
      mockSearchConcepts.mockRejectedValue(new Error("Network error"));
      render(<App />);

      const searchInput = screen.getByPlaceholderText(
        /search for medical procedures/i
      );
      await user.type(searchInput, "hip replacement");

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
    });

    it("should show loading state during search", async () => {
      let resolveSearch: (_value: ValueSetExpansion) => void;
      const searchPromise = new Promise<ValueSetExpansion>((resolve) => {
        resolveSearch = resolve;
      });
      mockSearchConcepts.mockReturnValue(searchPromise);

      render(<App />);

      const searchInput = screen.getByPlaceholderText(
        /search for medical procedures/i
      );
      await user.type(searchInput, "hip replacement");

      // Check loading state
      await waitFor(() => {
        expect(screen.getByLabelText(/loading/i)).toBeInTheDocument();
      });

      // Resolve the promise
      resolveSearch!(mockSearchResponse);
      await waitFor(() => {
        expect(screen.queryByLabelText(/loading/i)).not.toBeInTheDocument();
      });
    });
  });

  describe("Concept Selection and Details", () => {
    it("should load concept details when a suggestion is clicked", async () => {
      mockSearchConcepts.mockResolvedValue(mockSearchResponse);
      mockLookupConcept.mockResolvedValue(mockConceptDetails);

      render(<App />);

      const searchInput = screen.getByPlaceholderText(
        /search for medical procedures/i
      );
      await user.type(searchInput, "hip replacement");

      await waitFor(() => {
        expect(screen.getByText("Total hip replacement")).toBeInTheDocument();
      });

      await user.click(screen.getByText("Total hip replacement"));

      await waitFor(() => {
        expect(mockLookupConcept).toHaveBeenCalledWith("52734007");
      });
    });

    it("should display concept details after successful lookup", async () => {
      mockSearchConcepts.mockResolvedValue(mockSearchResponse);
      mockLookupConcept.mockResolvedValue(mockConceptDetails);

      render(<App />);

      const searchInput = screen.getByPlaceholderText(
        /search for medical procedures/i
      );
      await user.type(searchInput, "hip replacement");

      await waitFor(() => {
        expect(screen.getByText("Total hip replacement")).toBeInTheDocument();
      });

      await user.click(screen.getByText("Total hip replacement"));

      await waitFor(() => {
        expect(screen.getByText("Code: 52734007")).toBeInTheDocument();
        expect(
          screen.getByText("Total reconstruction of hip with prosthesis.")
        ).toBeInTheDocument();
      });
    });

    it("should handle concept lookup errors", async () => {
      mockSearchConcepts.mockResolvedValue(mockSearchResponse);
      mockLookupConcept.mockRejectedValue(new Error("Lookup failed"));

      render(<App />);

      const searchInput = screen.getByPlaceholderText(
        /search for medical procedures/i
      );
      await user.type(searchInput, "hip replacement");

      await waitFor(() => {
        expect(screen.getByText("Total hip replacement")).toBeInTheDocument();
      });

      await user.click(screen.getByText("Total hip replacement"));

      await waitFor(() => {
        expect(screen.getByText(/lookup failed/i)).toBeInTheDocument();
      });
    });

    it("should show loading state during concept lookup", async () => {
      mockSearchConcepts.mockResolvedValue(mockSearchResponse);

      let resolveLookup: (_value: ConceptDetails) => void;
      const lookupPromise = new Promise<ConceptDetails>((resolve) => {
        resolveLookup = resolve;
      });
      mockLookupConcept.mockReturnValue(lookupPromise);

      render(<App />);

      const searchInput = screen.getByPlaceholderText(
        /search for medical procedures/i
      );
      await user.type(searchInput, "hip replacement");

      await waitFor(() => {
        expect(screen.getByText("Total hip replacement")).toBeInTheDocument();
      });

      await user.click(screen.getByText("Total hip replacement"));

      // Check loading state
      await waitFor(() => {
        expect(
          screen.getByText(/loading concept details/i)
        ).toBeInTheDocument();
      });

      // Resolve the promise
      resolveLookup!(mockConceptDetails);
      await waitFor(() => {
        expect(
          screen.queryByText(/loading concept details/i)
        ).not.toBeInTheDocument();
      });
    });

    it("should clear concept details when close button is clicked", async () => {
      mockSearchConcepts.mockResolvedValue(mockSearchResponse);
      mockLookupConcept.mockResolvedValue(mockConceptDetails);

      render(<App />);

      const searchInput = screen.getByPlaceholderText(
        /search for medical procedures/i
      );
      await user.type(searchInput, "hip replacement");

      await waitFor(() => {
        expect(screen.getByText("Total hip replacement")).toBeInTheDocument();
      });

      await user.click(screen.getByText("Total hip replacement"));

      await waitFor(() => {
        expect(screen.getByText("Code: 52734007")).toBeInTheDocument();
      });

      const closeButton = screen.getByLabelText(/close concept details/i);
      await user.click(closeButton);

      expect(
        screen.getByText(/select a concept to view details/i)
      ).toBeInTheDocument();
    });
  });

  describe("State Management", () => {
    it("should manage search state correctly through multiple searches", async () => {
      mockSearchConcepts.mockResolvedValue(mockSearchResponse);
      render(<App />);

      const searchInput = screen.getByPlaceholderText(
        /search for medical procedures/i
      );

      // First search
      await user.type(searchInput, "hip");
      await waitFor(() => {
        expect(mockSearchConcepts).toHaveBeenCalledWith("hip");
      });

      // Clear and second search
      await user.clear(searchInput);
      await user.type(searchInput, "knee");

      await waitFor(() => {
        expect(mockSearchConcepts).toHaveBeenCalledWith("knee");
      });
    });


  });

  describe("Error Boundaries and Edge Cases", () => {
    it("should handle non-Error objects thrown from API", async () => {
      mockSearchConcepts.mockRejectedValue("String error");
      render(<App />);

      const searchInput = screen.getByPlaceholderText(
        /search for medical procedures/i
      );
      await user.type(searchInput, "hip replacement");

      await waitFor(() => {
        expect(
          screen.getByText(/failed to search concepts/i)
        ).toBeInTheDocument();
      });
    });

    it("should handle non-Error objects thrown from concept lookup", async () => {
      mockSearchConcepts.mockResolvedValue(mockSearchResponse);
      mockLookupConcept.mockRejectedValue("String error");

      render(<App />);

      const searchInput = screen.getByPlaceholderText(
        /search for medical procedures/i
      );
      await user.type(searchInput, "hip replacement");

      await waitFor(() => {
        expect(screen.getByText("Total hip replacement")).toBeInTheDocument();
      });

      await user.click(screen.getByText("Total hip replacement"));

      await waitFor(() => {
        expect(
          screen.getByText(/failed to load concept details/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe("Accessibility", () => {


    it("should have proper link attributes for external link", () => {
      render(<App />);

      const externalLink = screen.getByRole("link", {
        name: /csiro ontoserver/i,
      });
      expect(externalLink).toHaveAttribute("target", "_blank");
      expect(externalLink).toHaveAttribute("rel", "noopener noreferrer");
    });
  });
});
