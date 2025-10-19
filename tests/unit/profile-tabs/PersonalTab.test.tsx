import { describe, it, expect as vitestExpect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import PersonalTab from "../../../src/components/profile/tabs/PersonalTab";
import * as profileHook from "../../../src/lib/hooks/profile";

// ============================================================
// MOCKS
// ============================================================

/**
 * Mock useProfile hook z TanStack React Query
 * Zwraca dane profilu i mutacje
 */
vi.mock("../../../src/lib/hooks/profile", () => ({
  useProfile: vi.fn(),
}));

/**
 * Mock komponenty UI aby uprościć testowanie
 */
vi.mock("../../../src/components/ui/button", () => ({
  Button: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
    <button {...props}>{children}</button>
  ),
}));

vi.mock("../../../src/components/ui/input", () => ({
  Input: (props: Record<string, unknown>) => <input {...props} />,
}));

vi.mock("../../../src/components/ui/select", () => ({
  Select: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
    <select {...props}>{children}</select>
  ),
}));

vi.mock("../../../src/components/ui/toast", () => ({
  Toast: ({ message, onClose, ...props }: { message: string; onClose: () => void } & Record<string, unknown>) => (
    <div {...props}>
      <span>{message}</span>
      <button type="button" onClick={onClose}>
        Close
      </button>
    </div>
  ),
}));

// ============================================================
// TEST SETUP & FIXTURES
// ============================================================

const mockProfileData = {
  id: "123",
  weight_kg: 80,
  height_cm: 180,
  gender: "male",
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
  injuries_limitations: null,
};

const createMockUseProfile = (overrides = {}) =>
  ({
    data: mockProfileData,
    updateProfile: vi.fn().mockResolvedValue(mockProfileData),
    updating: false,
    isLoading: false,
    error: null,
    isPending: false,
    isError: false,
    isLoadingError: false,
    isRefetchError: false,
    isSuccess: true,
    failureCount: 0,
    failureReason: null,
    promise: Promise.resolve(mockProfileData),
    status: "success",
    ...overrides,
  }) as unknown as ReturnType<typeof profileHook.useProfile>;

describe("PersonalTab Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================
  // RENDERING TESTS
  // ============================================================

  describe("Rendering", () => {
    it("powinien renderować formularz z wszystkimi polami", () => {
      vi.mocked(profileHook.useProfile).mockReturnValue(createMockUseProfile());
      render(<PersonalTab />);

      vitestExpect(screen.getByLabelText(/Waga \(kg\)/)).toBeTruthy();
      vitestExpect(screen.getByLabelText(/Wzrost \(cm\)/)).toBeTruthy();
      vitestExpect(screen.getByLabelText(/Płeć/)).toBeTruthy();
      vitestExpect(screen.getByTestId("submit-button")).toBeTruthy();
    });

    it("powinien wyświetlać button submit z tekstem 'Zapisz'", () => {
      vi.mocked(profileHook.useProfile).mockReturnValue(createMockUseProfile());
      render(<PersonalTab />);

      const submitBtn = screen.getByTestId("submit-button");
      vitestExpect(submitBtn.textContent).toBe("Zapisz");
      vitestExpect((submitBtn as HTMLButtonElement).disabled).toBe(false);
    });

    it("powinien renderować wszystkie opcje w select dla płci", () => {
      vi.mocked(profileHook.useProfile).mockReturnValue(createMockUseProfile());
      render(<PersonalTab />);

      const genderSelect = screen.getByTestId("gender-select");
      const options = genderSelect.querySelectorAll("option");

      vitestExpect(options.length).toBe(4);
      vitestExpect((options[0] as HTMLOptionElement).value).toBe("");
      vitestExpect((options[1] as HTMLOptionElement).value).toBe("male");
      vitestExpect((options[2] as HTMLOptionElement).value).toBe("female");
      vitestExpect((options[3] as HTMLOptionElement).value).toBe("na");
    });
  });

  // ============================================================
  // FORM POPULATION TESTS
  // ============================================================

  describe("Form Population from Profile Data", () => {
    it("powinien wypełnić formularz danymi z profilu użytkownika", async () => {
      vi.mocked(profileHook.useProfile).mockReturnValue(createMockUseProfile());
      render(<PersonalTab />);

      await waitFor(() => {
        const weightInput = screen.getByTestId("weight-input") as HTMLInputElement;
        const heightInput = screen.getByTestId("height-input") as HTMLInputElement;
        const genderSelect = screen.getByTestId("gender-select") as HTMLSelectElement;

        vitestExpect(weightInput.value).toBe("80");
        vitestExpect(heightInput.value).toBe("180");
        vitestExpect(genderSelect.value).toBe("male");
      });
    });

    it("powinien obsługiwać profile bez danych (wartości undefined)", async () => {
      const emptyProfile = {
        ...mockProfileData,
        weight_kg: undefined,
        height_cm: undefined,
        gender: undefined,
      };
      vi.mocked(profileHook.useProfile).mockReturnValue(createMockUseProfile({ data: emptyProfile }));
      render(<PersonalTab />);

      await waitFor(() => {
        const weightInput = screen.getByTestId("weight-input") as HTMLInputElement;
        const heightInput = screen.getByTestId("height-input") as HTMLInputElement;
        const genderSelect = screen.getByTestId("gender-select") as HTMLSelectElement;

        vitestExpect(weightInput.value).toBe("");
        vitestExpect(heightInput.value).toBe("");
        vitestExpect(genderSelect.value).toBe("");
      });
    });

    it("powinien aktualizować formularz gdy zmienia się profil", async () => {
      vi.mocked(profileHook.useProfile).mockReturnValue(createMockUseProfile());
      const { rerender } = render(<PersonalTab />);

      await waitFor(() => {
        vitestExpect((screen.getByTestId("weight-input") as HTMLInputElement).value).toBe("80");
      });

      const newProfileData = { ...mockProfileData, weight_kg: 95, height_cm: 185 };
      vi.mocked(profileHook.useProfile).mockReturnValue(createMockUseProfile({ data: newProfileData }));
      rerender(<PersonalTab />);

      await waitFor(() => {
        const weightInput = screen.getByTestId("weight-input") as HTMLInputElement;
        const heightInput = screen.getByTestId("height-input") as HTMLInputElement;

        vitestExpect(weightInput.value).toBe("95");
        vitestExpect(heightInput.value).toBe("185");
      });
    });
  });

  // ============================================================
  // USER INTERACTION TESTS
  // ============================================================

  describe("User Interactions", () => {
    it("powinien pozwolić na zmianę wartości pól", async () => {
      const user = userEvent.setup();
      vi.mocked(profileHook.useProfile).mockReturnValue(createMockUseProfile());
      render(<PersonalTab />);

      const weightInput = screen.getByTestId("weight-input") as HTMLInputElement;
      const heightInput = screen.getByTestId("height-input") as HTMLInputElement;

      await user.clear(weightInput);
      await user.type(weightInput, "90");
      await user.clear(heightInput);
      await user.type(heightInput, "190");

      vitestExpect(weightInput.value).toBe("90");
      vitestExpect(heightInput.value).toBe("190");
    });

    it("powinien pozwolić na zmianę płci", async () => {
      const user = userEvent.setup();
      vi.mocked(profileHook.useProfile).mockReturnValue(createMockUseProfile());
      render(<PersonalTab />);

      const genderSelect = screen.getByTestId("gender-select") as HTMLSelectElement;

      await user.selectOptions(genderSelect, "female");

      vitestExpect(genderSelect.value).toBe("female");
    });

    it("powinien czyszczać opcję płci gdy wybrano puste pole", async () => {
      const user = userEvent.setup();
      vi.mocked(profileHook.useProfile).mockReturnValue(createMockUseProfile());
      render(<PersonalTab />);

      const genderSelect = screen.getByTestId("gender-select") as HTMLSelectElement;

      await user.selectOptions(genderSelect, "");

      vitestExpect(genderSelect.value).toBe("");
    });
  });

  // ============================================================
  // FORM SUBMISSION TESTS
  // ============================================================

  describe("Form Submission", () => {
    it("powinien wysłać dane formularza do updateProfile", async () => {
      const user = userEvent.setup();
      const updateProfileMock = vi.fn().mockResolvedValue(mockProfileData);
      vi.mocked(profileHook.useProfile).mockReturnValue(createMockUseProfile({ updateProfile: updateProfileMock }));
      render(<PersonalTab />);

      const weightInput = screen.getByTestId("weight-input") as HTMLInputElement;
      const submitBtn = screen.getByTestId("submit-button");

      await user.clear(weightInput);
      await user.type(weightInput, "85");
      await user.click(submitBtn);

      await waitFor(() => {
        vitestExpect(updateProfileMock).toHaveBeenCalledWith(
          vitestExpect.objectContaining({
            weight_kg: 85,
          })
        );
      });
    });

    it("powinien wyświetlić toast przy sukcesie", async () => {
      const user = userEvent.setup();
      const updateProfileMock = vi.fn().mockResolvedValue(mockProfileData);
      vi.mocked(profileHook.useProfile).mockReturnValue(createMockUseProfile({ updateProfile: updateProfileMock }));
      render(<PersonalTab />);

      const submitBtn = screen.getByTestId("submit-button");

      await user.click(submitBtn);

      await waitFor(() => {
        const toast = screen.getByTestId("toast");
        vitestExpect(toast).toBeTruthy();
        vitestExpect(toast.textContent).toContain("Zapisano zmiany");
      });
    });

    it("powinien wyświetlić toast przy błędzie", async () => {
      const user = userEvent.setup();
      const updateProfileMock = vi.fn().mockRejectedValue(new Error("Network error"));
      vi.mocked(profileHook.useProfile).mockReturnValue(createMockUseProfile({ updateProfile: updateProfileMock }));

      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {
        // Intentionally empty to suppress console.error in tests
      });

      render(<PersonalTab />);

      const submitBtn = screen.getByTestId("submit-button");

      await user.click(submitBtn);

      await waitFor(() => {
        const toast = screen.getByTestId("toast");
        vitestExpect(toast).toBeTruthy();
        vitestExpect(toast.textContent).toContain("Błąd podczas zapisywania");
      });

      consoleErrorSpy.mockRestore();
    });

    it("powinien resetować formularz do wysłanych danych po sukcesie", async () => {
      const user = userEvent.setup();
      const updateProfileMock = vi.fn().mockResolvedValue(mockProfileData);
      vi.mocked(profileHook.useProfile).mockReturnValue(createMockUseProfile({ updateProfile: updateProfileMock }));
      render(<PersonalTab />);

      const weightInput = screen.getByTestId("weight-input") as HTMLInputElement;
      const submitBtn = screen.getByTestId("submit-button");

      await user.clear(weightInput);
      await user.type(weightInput, "88");
      await user.click(submitBtn);

      await waitFor(() => {
        vitestExpect(weightInput.value).toBe("88");
      });
    });

    it("powinien zamknąć toast po kliknięciu Close", async () => {
      const user = userEvent.setup();
      const updateProfileMock = vi.fn().mockResolvedValue(mockProfileData);
      vi.mocked(profileHook.useProfile).mockReturnValue(createMockUseProfile({ updateProfile: updateProfileMock }));
      render(<PersonalTab />);

      const submitBtn = screen.getByTestId("submit-button");

      await user.click(submitBtn);

      const toast = await screen.findByTestId("toast");
      vitestExpect(toast).toBeTruthy();

      const closeBtn = screen.getByRole("button", { name: /close/i });
      await user.click(closeBtn);

      await waitFor(() => {
        vitestExpect(screen.queryByTestId("toast")).toBeNull();
      });
    });
  });

  // ============================================================
  // LOADING STATE TESTS
  // ============================================================

  describe("Loading State", () => {
    it("powinien wyłączyć button podczas aktualizacji", () => {
      vi.mocked(profileHook.useProfile).mockReturnValue(createMockUseProfile({ updating: true }));

      render(<PersonalTab />);

      const submitBtn = screen.getByTestId("submit-button") as HTMLButtonElement;
      vitestExpect(submitBtn.disabled).toBe(true);
    });

    it("powinien zmienić tekst buttona podczas aktualizacji", () => {
      vi.mocked(profileHook.useProfile).mockReturnValue(createMockUseProfile({ updating: true }));

      render(<PersonalTab />);

      const submitBtn = screen.getByTestId("submit-button");
      vitestExpect(submitBtn.textContent).toBe("Zapisywanie…");
    });

    it("powinien przywrócić button do stanu normalnego po aktualizacji", async () => {
      vi.mocked(profileHook.useProfile).mockReturnValue(createMockUseProfile({ updating: true }));
      const { rerender } = render(<PersonalTab />);

      let submitBtn = screen.getByTestId("submit-button") as HTMLButtonElement;
      vitestExpect(submitBtn.disabled).toBe(true);
      vitestExpect(submitBtn.textContent).toBe("Zapisywanie…");

      vi.mocked(profileHook.useProfile).mockReturnValue(createMockUseProfile({ updating: false }));
      rerender(<PersonalTab />);

      submitBtn = screen.getByTestId("submit-button") as HTMLButtonElement;
      vitestExpect(submitBtn.disabled).toBe(false);
      vitestExpect(submitBtn.textContent).toBe("Zapisz");
    });
  });

  // ============================================================
  // EDGE CASES & VALIDATION
  // ============================================================

  describe("Edge Cases", () => {
    it("powinien obsługiwać null w profile.data", () => {
      vi.mocked(profileHook.useProfile).mockReturnValue(createMockUseProfile({ data: null }));

      vitestExpect(() => {
        render(<PersonalTab />);
      }).not.toThrow();
    });

    it("powinien wysłać tylko zmienione pola", async () => {
      const user = userEvent.setup();
      const updateProfileMock = vi.fn().mockResolvedValue(mockProfileData);
      vi.mocked(profileHook.useProfile).mockReturnValue(createMockUseProfile({ updateProfile: updateProfileMock }));
      render(<PersonalTab />);

      const genderSelect = screen.getByTestId("gender-select") as HTMLSelectElement;
      const submitBtn = screen.getByTestId("submit-button");

      await user.selectOptions(genderSelect, "female");
      await user.click(submitBtn);

      await waitFor(() => {
        vitestExpect(updateProfileMock).toHaveBeenCalledWith(
          vitestExpect.objectContaining({
            gender: "female",
          })
        );
      });
    });

    it("powinien obsługiwać wartości dziesiętne dla wagi", async () => {
      const user = userEvent.setup();
      const updateProfileMock = vi.fn().mockResolvedValue(mockProfileData);
      vi.mocked(profileHook.useProfile).mockReturnValue(createMockUseProfile({ updateProfile: updateProfileMock }));
      render(<PersonalTab />);

      const weightInput = screen.getByTestId("weight-input") as HTMLInputElement;
      const submitBtn = screen.getByTestId("submit-button");

      await user.clear(weightInput);
      await user.type(weightInput, "82.5");
      await user.click(submitBtn);

      await waitFor(() => {
        vitestExpect(updateProfileMock).toHaveBeenCalledWith(
          vitestExpect.objectContaining({
            weight_kg: 82.5,
          })
        );
      });
    });
  });

  // ============================================================
  // INTEGRATION TESTS
  // ============================================================

  describe("Integration Scenarios", () => {
    it("powinien obsługiwać pełny cykl: załadowanie -> zmiana -> submit", async () => {
      const user = userEvent.setup();
      const updateProfileMock = vi.fn().mockResolvedValue({
        ...mockProfileData,
        weight_kg: 92,
      });
      vi.mocked(profileHook.useProfile).mockReturnValue(createMockUseProfile({ updateProfile: updateProfileMock }));

      render(<PersonalTab />);

      await waitFor(() => {
        vitestExpect((screen.getByTestId("weight-input") as HTMLInputElement).value).toBe("80");
      });

      const weightInput = screen.getByTestId("weight-input");
      await user.clear(weightInput);
      await user.type(weightInput, "92");
      await user.click(screen.getByTestId("submit-button"));

      await waitFor(() => {
        const toast = screen.getByTestId("toast");
        vitestExpect(toast.textContent).toContain("Zapisano zmiany");
      });

      vitestExpect(updateProfileMock).toHaveBeenCalledWith(
        vitestExpect.objectContaining({
          weight_kg: 92,
        })
      );
    });

    it("powinien obsługiwać wiele zmian w sekwencji", async () => {
      const user = userEvent.setup();
      const updateProfileMock = vi.fn().mockResolvedValue(mockProfileData);
      vi.mocked(profileHook.useProfile).mockReturnValue(createMockUseProfile({ updateProfile: updateProfileMock }));

      render(<PersonalTab />);

      const weightInput = screen.getByTestId("weight-input");
      const heightInput = screen.getByTestId("height-input");
      const genderSelect = screen.getByTestId("gender-select");
      const submitBtn = screen.getByTestId("submit-button");

      await user.clear(weightInput);
      await user.type(weightInput, "75");
      await user.click(submitBtn);

      await waitFor(() => {
        vitestExpect(updateProfileMock).toHaveBeenCalledTimes(1);
      });

      await user.clear(heightInput);
      await user.type(heightInput, "175");
      await user.selectOptions(genderSelect, "female");
      await user.click(submitBtn);

      await waitFor(() => {
        vitestExpect(updateProfileMock).toHaveBeenCalledTimes(2);
      });
    });
  });
});
