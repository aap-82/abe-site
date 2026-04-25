export const ABE_AUTHORITY = {
  organizationName: "ABE Education",
  isRto: false,
  // ABE must never display these claims anywhere:
  prohibitedClaims: [
    "ASQA approved",
    "ASQA registered",
    "RTO 40984",           // that's Blue Dog's code, not ABE's
    "nationally recognised training"  // only via partner RTO
  ],
  // Always display on course pages with accredited training:
  deliveryRtoDisclosure: (rto: string, code: string) =>
    `Training delivered by ${rto} (RTO ${code}) under partnership with ABE Education.`,
  // ASQA disclosure boilerplate
  asqaDisclosure: "ABE Education is not a Registered Training Organisation (RTO). Accredited course delivery and Statement of Attainment issuance is provided by our partner RTOs."
} as const;
