export type RegistrationState = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
  emailTouched: boolean;
  confirmTouched: boolean;
  termsTouched: boolean;
  submitAttempted: boolean;
  avatarSalt: number;
  avatarNameEdits: Record<string, string>;
  selectedAvatar: number;
};

export const initialRegistrationState = (): RegistrationState => ({
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  confirmPassword: "",
  acceptTerms: false,
  emailTouched: false,
  confirmTouched: false,
  termsTouched: false,
  submitAttempted: false,
  avatarSalt: Date.now(),
  avatarNameEdits: {},
  selectedAvatar: 0,
});

export type RegistrationAction =
  | { type: "SET_FIRST_NAME"; value: string }
  | { type: "SET_LAST_NAME"; value: string }
  | { type: "SET_EMAIL"; value: string }
  | { type: "SET_PASSWORD"; value: string }
  | { type: "SET_CONFIRM_PASSWORD"; value: string }
  | { type: "SET_ACCEPT_TERMS"; value: boolean }
  | { type: "SET_EMAIL_TOUCHED"; value: boolean }
  | { type: "SET_CONFIRM_TOUCHED"; value: boolean }
  | { type: "SET_TERMS_TOUCHED"; value: boolean }
  | { type: "SET_SUBMIT_ATTEMPTED"; value: boolean }
  | { type: "SET_SELECTED_AVATAR"; value: number }
  | { type: "SET_AVATAR_NAME"; id: string; value: string }
  | { type: "REGENERATE_AVATARS"; salt: number }
  | { type: "MARK_INVALID_SUBMIT"; needTerms: boolean };

export function registrationReducer(
  state: RegistrationState,
  action: RegistrationAction,
): RegistrationState {
  switch (action.type) {
    case "SET_FIRST_NAME":
      return { ...state, firstName: action.value };
    case "SET_LAST_NAME":
      return { ...state, lastName: action.value };
    case "SET_EMAIL":
      return { ...state, email: action.value };
    case "SET_PASSWORD":
      return { ...state, password: action.value };
    case "SET_CONFIRM_PASSWORD":
      return { ...state, confirmPassword: action.value };
    case "SET_ACCEPT_TERMS":
      return {
        ...state,
        acceptTerms: action.value,
        termsTouched: !action.value,
      };
    case "SET_EMAIL_TOUCHED":
      return { ...state, emailTouched: action.value };
    case "SET_CONFIRM_TOUCHED":
      return { ...state, confirmTouched: action.value };
    case "SET_TERMS_TOUCHED":
      return { ...state, termsTouched: action.value };
    case "SET_SUBMIT_ATTEMPTED":
      return { ...state, submitAttempted: action.value };
    case "SET_SELECTED_AVATAR":
      return { ...state, selectedAvatar: action.value };
    case "SET_AVATAR_NAME":
      return {
        ...state,
        avatarNameEdits: {
          ...state.avatarNameEdits,
          [action.id]: action.value,
        },
      };
    case "REGENERATE_AVATARS":
      return {
        ...state,
        avatarSalt: action.salt,
        avatarNameEdits: {},
        selectedAvatar: 0,
      };
    case "MARK_INVALID_SUBMIT":
      return {
        ...state,
        submitAttempted: true,
        emailTouched: true,
        confirmTouched: true,
        termsTouched: action.needTerms ? true : state.termsTouched,
      };
    default:
      return state;
  }
}
