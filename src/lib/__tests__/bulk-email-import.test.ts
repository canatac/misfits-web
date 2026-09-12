import { describe, it, expect } from "vitest";
import { parseEmailCSV, dedupeEntries, validateImportEmail, formatImportSummary } from "@/lib/bulk-email-import";
describe("parseEmailCSV", () => {
  it("with header", () => { const r = parseEmailCSV("email, name\nalice@example.com, Alice\nbob@test.org, Bob"); expect(r.total).toBe(2); expect(r.valid).toBe(2); expect(r.entries[0].email).toBe("alice@example.com"); expect(r.entries[0].name).toBe("Alice"); });
  it("without header", () => { const r = parseEmailCSV("alice@example.com, Alice"); expect(r.total).toBe(1); expect(r.valid).toBe(1); });
  it("invalid emails", () => { const r = parseEmailCSV("email\nbad-email\ngood@test.com"); expect(r.valid).toBe(1); expect(r.invalid).toBe(1); expect(r.errors[0].reason).toBe("Invalid email format"); });
  it("missing emails", () => { const r = parseEmailCSV("email\n, Name\nvalid@test.com"); expect(r.invalid).toBe(1); expect(r.errors[0].reason).toBe("Missing email"); });
  it("empty", () => { expect(parseEmailCSV("")).toEqual({total:0,valid:0,invalid:0,entries:[],errors:[]}); expect(parseEmailCSV("  \n  ")).toEqual({total:0,valid:0,invalid:0,entries:[],errors:[]}); });
  it("lowercase", () => { const r = parseEmailCSV("ALICE@EXAMPLE.COM"); expect(r.entries[0].email).toBe("alice@example.com"); });
});
describe("dedupeEntries", () => {
  it("dedupes", () => { const r = dedupeEntries([{email:"a@test.com",row:1,valid:true},{email:"a@test.com",row:2,valid:true},{email:"b@test.com",row:3,valid:true}]); expect(r).toHaveLength(2); expect(r[0].row).toBe(1); });
  it("filters invalid", () => { const r = dedupeEntries([{email:"a@test.com",row:1,valid:true},{email:"b@test.com",row:2,valid:false}]); expect(r).toHaveLength(1); });
});
describe("validateImportEmail", () => {
  it("good", () => { expect(validateImportEmail("user@test.com")).toEqual({valid:true}); });
  it("empty", () => { expect(validateImportEmail("")).toEqual({valid:false,reason:"Empty email"}); });
  it("invalid", () => { expect(validateImportEmail("not-email")).toEqual({valid:false,reason:"Invalid email format"}); });
  it("trim", () => { expect(validateImportEmail("  user@test.com  ")).toEqual({valid:true}); });
});
describe("formatImportSummary", () => {
  it("empty", () => { expect(formatImportSummary({total:0,valid:0,invalid:0,entries:[],errors:[]})).toBe("No entries found."); });
  it("success", () => { expect(formatImportSummary({total:10,valid:10,invalid:0,entries:[],errors:[]})).toBe("Imported 10 of 10 emails (0 invalid)."); });
  it("partial", () => { expect(formatImportSummary({total:5,valid:3,invalid:2,entries:[],errors:[]})).toBe("Imported 3 of 5 emails (2 invalid)."); });
});
