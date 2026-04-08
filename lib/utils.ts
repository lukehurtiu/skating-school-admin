export function formatSchedule(day: string, start: string, end: string): string {
  const capitalizedDay = day.charAt(0).toUpperCase() + day.slice(1);
  const startFormatted = start.slice(0, 5);
  const endFormatted = end.slice(0, 5);
  return `${capitalizedDay}, ${startFormatted} – ${endFormatted}`;
}

export function isAdmin(role: string | undefined): boolean {
  return role === "admin";
}
