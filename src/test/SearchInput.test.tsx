import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { SearchInput } from "../components/SearchInput";
import type { ConceptSuggestion } from "../types/fhir";

// Mock the useDebounce hook
vi.mock("../hooks/useDebounce", () => ({
  useDebounce: (value: string, _delay: number) => value,
}));

describe("SearchInput Component", () => {
  const user = userEvent.setup();
  const mockOnSearch = vi.fn();
  const mockOnSelect = vi.fn();

  const mockSuggestions: ConceptSuggestion[] = [
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
        {
          language: "en",
          use: {
            system: "http://snomed.info/sct",
            code: "900000000000013009",
            display: "Synonym",
          },
          value: "Hip arthroplasty",
        },
      ],
    },
    {
      system: "http://snomed.info/sct",
      code: "179344006",
      display: "Hip replacement",
      inactive: true,
      designation: [
        {
          language: "en",
          use: {
            system: "http://snomed.info/sct",
            code: "900000000000013009",
            display: "Synonym",
          },
          value: "Hip joint replacement",
        },
      ],
    },
    {
      system: "http://snomed.info/sct",
      code: "265157000",
      display: "Total hip arthroplasty",
    },
  ];

  const defaultProps = {
    onSearch: mockOnSearch,
    onSelect: mockOnSelect,
    suggestions: [],
    isLoading: false,
    error: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Initial Render", () => {
    it("should render search input with default placeholder", () => {
      render(<SearchInput {...defaultProps} />);

      const input = screen.getByRole("combobox");
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute(
        "placeholder",
        "Search for medical procedures..."
      );
    });

    it("should render search input with custom placeholder", () => {
      render(
        <SearchInput {...defaultProps} placeholder="Custom placeholder text" />
      );

      const input = screen.getByPlaceholderText("Custom placeholder text");
      expect(input).toBeInTheDocument();
    });

    it("should have proper accessibility attributes", () => {
      render(<SearchInput {...defaultProps} />);

      const input = screen.getByRole("combobox");
      expect(input).toHaveAttribute("aria-expanded", "false");
      expect(input).toHaveAttribute("aria-haspopup", "listbox");
      expect(input).toHaveAttribute("aria-autocomplete", "list");
    });
  });

  describe("Input Handling", () => {
    it("should call onSearch when user types", async () => {
      render(<SearchInput {...defaultProps} />);

      const input = screen.getByRole("combobox");
      await user.type(input, "hip replacement");

      expect(mockOnSearch).toHaveBeenCalledWith("hip replacement");
    });

    it("should update input value when typing", async () => {
      render(<SearchInput {...defaultProps} />);

      const input = screen.getByRole("combobox");
      await user.type(input, "test query");

      expect(input.value).toBe("test query");
    });

    it("should not call onSearch for empty query", async () => {
      render(<SearchInput {...defaultProps} />);

      const input = screen.getByRole("combobox");
      await user.type(input, "test");
      await user.clear(input);

      // onSearch should be called for "test" but not for empty string
      expect(mockOnSearch).toHaveBeenCalledWith("test");
      expect(mockOnSearch).not.toHaveBeenCalledWith("");
    });

    it("should trim whitespace from query", async () => {
      render(<SearchInput {...defaultProps} />);

      const input = screen.getByRole("combobox");
      await user.type(input, "  hip replacement  ");

      expect(mockOnSearch).toHaveBeenCalledWith("hip replacement");
    });
  });

  describe("Suggestions Display", () => {
    it("should display suggestions when provided", () => {
      render(<SearchInput {...defaultProps} suggestions={mockSuggestions} />);

      expect(screen.getByRole("listbox")).toBeInTheDocument();
      expect(screen.getByText("Total hip replacement")).toBeInTheDocument();
      expect(screen.getByText("Hip replacement")).toBeInTheDocument();
      expect(screen.getByText("Total hip arthroplasty")).toBeInTheDocument();
    });

    it("should show fully specified names when different from display", () => {
      render(<SearchInput {...defaultProps} suggestions={mockSuggestions} />);

      expect(
        screen.getByText(/Total hip replacement \(procedure\)/)
      ).toBeInTheDocument();
    });

    it("should show concept codes", () => {
      render(<SearchInput {...defaultProps} suggestions={mockSuggestions} />);

      expect(screen.getByText("Code: 52734007")).toBeInTheDocument();
      expect(screen.getByText("Code: 179344006")).toBeInTheDocument();
      expect(screen.getByText("Code: 265157000")).toBeInTheDocument();
    });

    it("should mark inactive concepts", () => {
      render(<SearchInput {...defaultProps} suggestions={mockSuggestions} />);

      const inactiveBadge = screen.getByText("Inactive");
      expect(inactiveBadge).toBeInTheDocument();
    });

    it("should handle suggestions without designations", () => {
      const suggestionsWithoutDesignations: ConceptSuggestion[] = [
        {
          system: "http://snomed.info/sct",
          code: "123456789",
          display: "Test concept",
        },
      ];

      render(
        <SearchInput
          {...defaultProps}
          suggestions={suggestionsWithoutDesignations}
        />
      );

      expect(screen.getByText("Test concept")).toBeInTheDocument();
      expect(screen.getByText("Code: 123456789")).toBeInTheDocument();
    });

    it("should show no results message when no suggestions and not loading", () => {
      render(<SearchInput {...defaultProps} suggestions={[]} />);

      const input = screen.getByRole("combobox");
      fireEvent.change(input, { target: { value: "test query" } });
      fireEvent.focus(input);

      expect(
        screen.getByText('No results found for "test query"')
      ).toBeInTheDocument();
    });
  });

  describe("Loading State", () => {
    it("should show loading indicator when loading", () => {
      render(<SearchInput {...defaultProps} isLoading={true} />);

      expect(screen.getByLabelText("Loading")).toBeInTheDocument();
      expect(
        screen.getByRole("progressbar", { hidden: true })
      ).toBeInTheDocument();
    });

    it("should hide loading indicator when not loading", () => {
      render(<SearchInput {...defaultProps} isLoading={false} />);

      expect(screen.queryByLabelText("Loading")).not.toBeInTheDocument();
    });
  });

  describe("Error Handling", () => {
    it("should display error message when error prop is provided", () => {
      render(
        <SearchInput {...defaultProps} error="Network connection failed" />
      );

      const errorMessage = screen.getByRole("alert");
      expect(errorMessage).toBeInTheDocument();
      expect(errorMessage).toHaveTextContent("Network connection failed");
    });

    it("should add error class to input when error exists", () => {
      render(<SearchInput {...defaultProps} error="Test error" />);

      const input = screen.getByRole("combobox");
      expect(input).toHaveClass("error");
    });

    it("should not display error message when error is null", () => {
      render(<SearchInput {...defaultProps} error={null} />);

      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });

  describe("Keyboard Navigation", () => {
    beforeEach(() => {
      render(<SearchInput {...defaultProps} suggestions={mockSuggestions} />);
    });

    it("should navigate down with ArrowDown key", async () => {
      const input = screen.getByRole("combobox");
      await user.click(input);

      await user.keyboard("{ArrowDown}");

      const firstOption = screen.getByRole("option", {
        name: /total hip replacement/i,
      });
      expect(firstOption).toHaveAttribute("aria-selected", "true");
    });

    it("should navigate up with ArrowUp key", async () => {
      const input = screen.getByRole("combobox");
      await user.click(input);

      // Go to first item then up to last item
      await user.keyboard("{ArrowDown}");
      await user.keyboard("{ArrowUp}");

      const lastOption = screen.getByRole("option", {
        name: /total hip arthroplasty/i,
      });
      expect(lastOption).toHaveAttribute("aria-selected", "true");
    });

    it("should wrap around when navigating past bounds", async () => {
      const input = screen.getByRole("combobox");
      await user.click(input);

      // Go down past the last item
      await user.keyboard("{ArrowDown}");
      await user.keyboard("{ArrowDown}");
      await user.keyboard("{ArrowDown}");
      await user.keyboard("{ArrowDown}");

      const firstOption = screen.getByRole("option", {
        name: /total hip replacement/i,
      });
      expect(firstOption).toHaveAttribute("aria-selected", "true");
    });

    it("should select highlighted item with Enter key", async () => {
      const input = screen.getByRole("combobox");
      await user.click(input);

      await user.keyboard("{ArrowDown}");
      await user.keyboard("{Enter}");

      expect(mockOnSelect).toHaveBeenCalledWith(mockSuggestions[0]);
    });

    it("should close dropdown with Escape key", async () => {
      const input = screen.getByRole("combobox");
      await user.click(input);

      expect(screen.getByRole("listbox")).toBeInTheDocument();

      await user.keyboard("{Escape}");

      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });
  });

  describe("Mouse Interaction", () => {
    it("should select suggestion when clicked", async () => {
      render(<SearchInput {...defaultProps} suggestions={mockSuggestions} />);

      const suggestion = screen.getByText("Total hip replacement");
      await user.click(suggestion);

      expect(mockOnSelect).toHaveBeenCalledWith(mockSuggestions[0]);
    });

    it("should hide dropdown after suggestion is clicked and not reopen on focus", async () => {
      render(<SearchInput {...defaultProps} suggestions={mockSuggestions} />);

      // Verify dropdown is initially open with suggestions
      expect(screen.getByRole("listbox")).toBeInTheDocument();

      // Click on a suggestion
      const suggestion = screen.getByText("Total hip replacement");
      await user.click(suggestion);

      // Verify dropdown is now closed
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();

      // Focus the input again - dropdown should stay closed
      const input = screen.getByRole("combobox");
      await user.click(input);
      
      // Dropdown should still be closed because justSelected flag is set
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();

      // Start typing new search - this should reset justSelected and allow dropdown to open
      await user.clear(input);
      await user.type(input, "knee");
      
      // Now suggestions should be able to show again (if provided)
      expect(input).toHaveValue("knee");
    });

    it("should highlight suggestion on mouse enter", async () => {
      render(<SearchInput {...defaultProps} suggestions={mockSuggestions} />);

      const suggestion = screen.getByRole("option", {
        name: /total hip replacement/i,
      });
      await user.hover(suggestion);

      expect(suggestion).toHaveAttribute("aria-selected", "true");
    });

    it("should update input value when suggestion is selected", async () => {
      render(<SearchInput {...defaultProps} suggestions={mockSuggestions} />);

      const suggestion = screen.getByText("Total hip replacement");
      await user.click(suggestion);

      const input = screen.getByRole("combobox");
      expect(input.value).toBe("Total hip replacement");
    });
  });

  describe("Focus and Blur Handling", () => {
    it("should show suggestions on focus if query exists", async () => {
      render(<SearchInput {...defaultProps} suggestions={mockSuggestions} />);

      const input = screen.getByRole("combobox");
      await user.type(input, "test");
      await user.tab(); // blur
      await user.click(input); // focus again

      expect(screen.getByRole("listbox")).toBeInTheDocument();
    });

    it("should close suggestions after delay on blur", async () => {
      render(<SearchInput {...defaultProps} suggestions={mockSuggestions} />);

      const input = screen.getByRole("combobox");
      await user.type(input, "test");
      expect(screen.getByRole("listbox")).toBeInTheDocument();

      await user.tab(); // blur

      // Wait for the setTimeout delay
      await waitFor(
        () => {
          expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
        },
        { timeout: 200 }
      );
    });
  });

  describe("Debouncing", () => {
    it("should use custom debounce delay", () => {
      render(<SearchInput {...defaultProps} debounceDelay={500} />);

      // Since we mocked useDebounce to return the value immediately,
      // we can only test that the component renders with the prop
      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });

    it("should use default debounce delay when not specified", () => {
      render(<SearchInput {...defaultProps} />);

      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA attributes for combobox", () => {
      render(<SearchInput {...defaultProps} suggestions={mockSuggestions} />);

      const input = screen.getByRole("combobox");
      expect(input).toHaveAttribute("aria-expanded", "true");
      expect(input).toHaveAttribute("aria-haspopup", "listbox");
      expect(input).toHaveAttribute("aria-autocomplete", "list");
    });

    it("should have proper ARIA attributes for listbox", () => {
      render(<SearchInput {...defaultProps} suggestions={mockSuggestions} />);

      const listbox = screen.getByRole("listbox");
      expect(listbox).toHaveAttribute("aria-label", "Search suggestions");
    });

    it("should have proper ARIA attributes for options", () => {
      render(<SearchInput {...defaultProps} suggestions={mockSuggestions} />);

      const options = screen.getAllByRole("option");
      options.forEach((option) => {
        expect(option).toHaveAttribute("aria-selected");
      });
    });

    it("should announce loading state to screen readers", () => {
      render(<SearchInput {...defaultProps} isLoading={true} />);

      expect(screen.getByLabelText("Loading")).toBeInTheDocument();
    });

    it("should announce errors to screen readers", () => {
      render(<SearchInput {...defaultProps} error="Test error" />);

      const errorMessage = screen.getByRole("alert");
      expect(errorMessage).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty suggestions array", () => {
      render(<SearchInput {...defaultProps} suggestions={[]} />);

      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });

    it("should handle suggestions with duplicate keys", () => {
      const duplicateSuggestions: ConceptSuggestion[] = [
        {
          system: "http://snomed.info/sct",
          code: "52734007",
          display: "Total hip replacement",
        },
        {
          system: "http://snomed.info/sct",
          code: "52734007",
          display: "Total hip replacement - duplicate",
        },
      ];

      render(
        <SearchInput {...defaultProps} suggestions={duplicateSuggestions} />
      );

      expect(screen.getByText("Total hip replacement")).toBeInTheDocument();
      expect(
        screen.getByText("Total hip replacement - duplicate")
      ).toBeInTheDocument();
    });

    it("should handle very long suggestion text", () => {
      const longTextSuggestion: ConceptSuggestion[] = [
        {
          system: "http://snomed.info/sct",
          code: "123456789",
          display:
            "This is a very long medical procedure name that might overflow the container and cause layout issues",
        },
      ];

      render(
        <SearchInput {...defaultProps} suggestions={longTextSuggestion} />
      );

      expect(
        screen.getByText(
          "This is a very long medical procedure name that might overflow the container and cause layout issues"
        )
      ).toBeInTheDocument();
    });
  });
});
