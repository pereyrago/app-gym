/** Solo dígitos; para wa.me suele anteponer código país (ej. 54 Argentina). */
export function digitsOnly(phone: string): string {
  return phone.replace(/\D/g, "");
}

export function whatsappUrl(phone: string): string {
  const digits = digitsOnly(phone);
  const withCountry = digits.length <= 10 ? "54" + digits : digits;
  return `https://wa.me/${withCountry}`;
}
