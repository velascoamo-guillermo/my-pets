export function calculateAge(birthDate: Date): string {
  const now = new Date();
  const years = now.getFullYear() - birthDate.getFullYear();
  const months = now.getMonth() - birthDate.getMonth();

  if (years < 1) {
    const totalMonths = months >= 0 ? months : 12 + months;
    return `${totalMonths} month${totalMonths !== 1 ? "s" : ""}`;
  }

  if (years === 1 && months < 0) {
    const totalMonths = 12 + months;
    return `${totalMonths} month${totalMonths !== 1 ? "s" : ""}`;
  }

  return `${years} year${years !== 1 ? "s" : ""} old`;
}
