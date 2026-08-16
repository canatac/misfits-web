import type { AccountProvider, AccountServerConfig } from "@/types/account";
import {
  ACCOUNT_COLORS,
  PROVIDER_PRESETS,
  type ValidationResult,
} from "@/lib/account-presets";

export interface FormState {
  provider: AccountProvider;
  email: string;
  name: string;
  password: string;
  color: string;
  customColor: string;
  serverConfig: AccountServerConfig;
  testing: boolean;
  testResult: ValidationResult | null;
}

export type FormAction =
  | { type: "setProvider"; provider: AccountProvider }
  | { type: "setEmail"; email: string }
  | { type: "setName"; name: string }
  | { type: "setPassword"; password: string }
  | { type: "setColor"; color: string }
  | { type: "setCustomColor"; customColor: string }
  | { type: "setServerConfig"; serverConfig: AccountServerConfig }
  | { type: "setTesting"; testing: boolean }
  | { type: "setTestResult"; testResult: ValidationResult | null }
  | { type: "startTest" }
  | { type: "reset" };

export const initialFormState: FormState = {
  provider: "gmail",
  email: "",
  name: "",
  password: "",
  color: ACCOUNT_COLORS[0],
  customColor: "",
  serverConfig: PROVIDER_PRESETS.gmail.serverConfig!,
  testing: false,
  testResult: null,
};

export function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case "setProvider": {
      const preset = PROVIDER_PRESETS[action.provider];
      return {
        ...state,
        provider: action.provider,
        serverConfig: preset.serverConfig
          ? { ...preset.serverConfig }
          : state.serverConfig,
        testResult: null,
      };
    }
    case "setEmail":
      return { ...state, email: action.email, testResult: null };
    case "setName":
      return { ...state, name: action.name };
    case "setPassword":
      return { ...state, password: action.password, testResult: null };
    case "setColor":
      return { ...state, color: action.color, customColor: "" };
    case "setCustomColor":
      return { ...state, customColor: action.customColor };
    case "setServerConfig":
      return { ...state, serverConfig: action.serverConfig };
    case "setTesting":
      return { ...state, testing: action.testing };
    case "setTestResult":
      return { ...state, testResult: action.testResult };
    case "startTest":
      return { ...state, testing: true, testResult: null };
    case "reset":
      return initialFormState;
    default:
      return state;
  }
}
