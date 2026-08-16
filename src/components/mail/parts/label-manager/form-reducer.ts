import type { Label } from "@/types/label";
import { LABEL_COLORS } from "@/stores/label-store";

export interface FormState {
  editingId: string | null;
  isCreating: boolean;
  name: string;
  color: string;
  customColor: string;
  icon: string;
  parentId: string;
  description: string;
}

export type FormAction =
  | { type: "reset" }
  | { type: "startCreate" }
  | { type: "startEdit"; label: Label }
  | { type: "setName"; name: string }
  | { type: "setColor"; color: string }
  | { type: "setCustomColor"; customColor: string }
  | { type: "setIcon"; icon: string }
  | { type: "setParentId"; parentId: string }
  | { type: "setDescription"; description: string };

export const initialFormState: FormState = {
  editingId: null,
  isCreating: false,
  name: "",
  color: LABEL_COLORS[0],
  customColor: "",
  icon: "",
  parentId: "__none__",
  description: "",
};

export function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case "reset":
      return initialFormState;
    case "startCreate":
      return { ...initialFormState, isCreating: true };
    case "startEdit":
      return {
        editingId: action.label.id,
        isCreating: false,
        name: action.label.name,
        color: action.label.color,
        customColor: "",
        icon: action.label.icon,
        parentId: action.label.parentId ?? "__none__",
        description: action.label.description ?? "",
      };
    case "setName":
      return { ...state, name: action.name };
    case "setColor":
      return { ...state, color: action.color, customColor: "" };
    case "setCustomColor":
      return { ...state, customColor: action.customColor };
    case "setIcon":
      return { ...state, icon: action.icon };
    case "setParentId":
      return { ...state, parentId: action.parentId };
    case "setDescription":
      return { ...state, description: action.description };
    default:
      return state;
  }
}
