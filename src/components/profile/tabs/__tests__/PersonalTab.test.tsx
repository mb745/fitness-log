import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import PersonalTab from "../PersonalTab";
import * as profileHook from "../../../../lib/hooks/profile";

// ============================================================
// MOCKS
// ============================================================

/**
 * Mock useProfile hook z TanStack React Query
 * Zwraca dane profilu i mutacje
 */
vi.mock("../../../../lib/hooks/profile", () => ({
  useProfile: vi.fn(),
}));

/**
 * Mock komponenty UI aby uprościć testowanie
 */
vi.mock("../../../ui/button", () => ({
  Button: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
    <button {...props}>{children}</button>
  ),
}));

vi.mock("../../../ui/input", () => ({
  Input: (props: Record<string, unknown>) => <input {...props} />,
}));

vi.mock("../../../ui/select", () => ({
  Select: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
    <select {...props}>{children}</select>
  ),
}));

vi.mock("../../../ui/toast", () => ({
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

      expect(screen.getByLabelText(/Waga \(kg\)/)).toBeTruthy();
      expect(screen.getByLabelText(/Wzrost \(cm\)/)).toBeTruthy();
      expect(screen.getByLabelText(/Płeć/)).toBeTruthy();
      expect(screen.getByTestId("submit-button")).toBeTruthy();
    });

    it("powinien wyświetlać button submit z tekstem 'Zapisz'", () => {
      vi.mocked(profileHook.useProfile).mockReturnValue(createMockUseProfile());
      render(<PersonalTab />);

      const submitBtn = screen.getByTestId("submit-button");
      expect(submitBtn.textContent).toBe("Zapisz");
      expect((submitBtn as HTMLButtonElement).disabled).toBe(false);
    });

    it("powinien renderować wszystkie opcje w select dla płci", () => {
      vi.mocked(profileHook.useProfile).mockReturnValue(createMockUseProfile());
      render(<PersonalTab />);

      const genderSelect = screen.getByTestId("gender-select");
      const options = genderSelect.querySelectorAll("option");

      expect(options.length).toBe(4);
      expect((options[0] as HTMLOptionElement).value).toBe("");
      expect((options[1] as HTMLOptionElement).value).toBe("male");
      expect((options[2] as HTMLOptionElement).value).toBe("female");
      expect((options[3] as HTMLOptionElement).value).toBe("na");
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

        expect(weightInput.value).toBe("80");
        expect(heightInput.value).toBe("180");
        expect(genderSelect.value).toBe("male");
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

        expect(weightInput.value).toBe("");
        expect(heightInput.value).toBe("");
        expect(genderSelect.value).toBe("");
      });
    });

    it("powinien aktualizować formularz gdy zmienia się profil", async () => {
      vi.mocked(profileHook.useProfile).mockReturnValue(createMockUseProfile());
      const { rerender } = render(<PersonalTab />);

      await waitFor(() => {
        expect((screen.getByTestId("weight-input") as HTMLInputElement).value).toBe("80");
      });

      const newProfileData = { ...mockProfileData, weight_kg: 95, height_cm: 185 };
      vi.mocked(profileHook.useProfile).mockReturnValue(createMockUseProfile({ data: newProfileData }));
      rerender(<PersonalTab />);

      await waitFor(() => {
        const weightInput = screen.getByTestId("weight-input") as HTMLInputElement;
        const heightInput = screen.getByTestId("height-input") as HTMLInputElement;

        expect(weightInput.value).toBe("95");
        expect(heightInput.value).toBe("185");
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

      expect(weightInput.value).toBe("90");
      expect(heightInput.value).toBe("190");
    });

    it("powinien pozwolić na zmianę płci", async () => {
      const user = userEvent.setup();
      vi.mocked(profileHook.useProfile).mockReturnValue(createMockUseProfile());
      render(<PersonalTab />);

      const genderSelect = screen.getByTestId("gender-select") as HTMLSelectElement;

      await user.selectOptions(genderSelect, "female");

      expect(genderSelect.value).toBe("female");
    });

    it("powinien czyszczać opcję płci gdy wybrano puste pole", async () => {
      const user = userEvent.setup();
      vi.mocked(profileHook.useProfile).mockReturnValue(createMockUseProfile());
      render(<PersonalTab />);

      const genderSelect = screen.getByTestId("gender-select") as HTMLSelectElement;

      await user.selectOptions(genderSelect, "");

      expect(genderSelect.value).toBe("");
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
        expect(updateProfileMock).toHaveBeenCalledWith(
          expect.objectContaining({
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
        expect(toast).toBeTruthy();
        expect(toast.textContent).toContain("Zapisano zmiany");
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
        expect(toast).toBeTruthy();
        expect(toast.textContent).toContain("Błąd podczas zapisywania");
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
        expect(weightInput.value).toBe("88");
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
      expect(toast).toBeTruthy();

      const closeBtn = screen.getByRole("button", { name: /close/i });
      await user.click(closeBtn);

      await waitFor(() => {
        expect(screen.queryByTestId("toast")).toBeNull();
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
      expect(submitBtn.disabled).toBe(true);
    });

    it("powinien zmienić tekst buttona podczas aktualizacji", () => {
      vi.mocked(profileHook.useProfile).mockReturnValue(createMockUseProfile({ updating: true }));

      render(<PersonalTab />);

      const submitBtn = screen.getByTestId("submit-button");
      expect(submitBtn.textContent).toBe("Zapisywanie…");
    });

    it("powinien przywrócić button do stanu normalnego po aktualizacji", async () => {
      vi.mocked(profileHook.useProfile).mockReturnValue(createMockUseProfile({ updating: true }));
      const { rerender } = render(<PersonalTab />);

      let submitBtn = screen.getByTestId("submit-button") as HTMLButtonElement;
      expect(submitBtn.disabled).toBe(true);
      expect(submitBtn.textContent).toBe("Zapisywanie…");

      vi.mocked(profileHook.useProfile).mockReturnValue(createMockUseProfile({ updating: false }));
      rerender(<PersonalTab />);

      submitBtn = screen.getByTestId("submit-button") as HTMLButtonElement;
      expect(submitBtn.disabled).toBe(false);
      expect(submitBtn.textContent).toBe("Zapisz");
    });
  });

  // ============================================================
  // EDGE CASES & VALIDATION
  // ============================================================

  describe("Edge Cases", () => {
    it("powinien obsługiwać null w profile.data", () => {
      vi.mocked(profileHook.useProfile).mockReturnValue(createMockUseProfile({ data: null }));

      expect(() => {
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
        expect(updateProfileMock).toHaveBeenCalledWith(
          expect.objectContaining({
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
        expect(updateProfileMock).toHaveBeenCalledWith(
          expect.objectContaining({
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
        expect((screen.getByTestId("weight-input") as HTMLInputElement).value).toBe("80");
      });

      const weightInput = screen.getByTestId("weight-input");
      await user.clear(weightInput);
      await user.type(weightInput, "92");
      await user.click(screen.getByTestId("submit-button"));

      await waitFor(() => {
        const toast = screen.getByTestId("toast");
        expect(toast.textContent).toContain("Zapisano zmiany");
      });

      expect(updateProfileMock).toHaveBeenCalledWith(
        expect.objectContaining({
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
        expect(updateProfileMock).toHaveBeenCalledTimes(1);
      });

      await user.clear(heightInput);
      await user.type(heightInput, "175");
      await user.selectOptions(genderSelect, "female");
      await user.click(submitBtn);

      await waitFor(() => {
        expect(updateProfileMock).toHaveBeenCalledTimes(2);
      });
    });
  });
});
