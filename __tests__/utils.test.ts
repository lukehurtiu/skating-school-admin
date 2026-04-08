import { formatSchedule, isAdmin } from "@/lib/utils";

describe("formatSchedule", () => {
  it("formats a basic schedule correctly", () => {
    expect(formatSchedule("monday", "14:30:00", "15:30:00")).toBe(
      "Monday, 14:30 – 15:30"
    );
  });

  it("capitalizes the day", () => {
    expect(formatSchedule("saturday", "09:00:00", "10:00:00")).toBe(
      "Saturday, 09:00 – 10:00"
    );
  });

  it("handles times that are already HH:MM format", () => {
    expect(formatSchedule("friday", "08:00", "09:00")).toBe(
      "Friday, 08:00 – 09:00"
    );
  });

  it("works for all days of the week", () => {
    expect(formatSchedule("wednesday", "17:00:00", "18:00:00")).toBe(
      "Wednesday, 17:00 – 18:00"
    );
  });
});

describe("isAdmin", () => {
  it("returns true for admin role", () => {
    expect(isAdmin("admin")).toBe(true);
  });

  it("returns false for instructor role", () => {
    expect(isAdmin("instructor")).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(isAdmin(undefined)).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(isAdmin("")).toBe(false);
  });
});
