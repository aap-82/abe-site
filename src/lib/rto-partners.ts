// Per-RTO partner details used by <WhoDelivers> to render the role-separation
// cards (ASQA Loc 7). Keyed by the deliveryRto.name enum value from the
// courses schema.
//
// Why a constant instead of frontmatter: these values (handbook URL,
// refund form, etc.) are partner-wide, not course-specific. Putting them
// per-course would mean copy-pasting the same URLs across every course
// markdown file.
//
// To add a partner: extend the deliveryRto enum in src/content.config.ts,
// then add an entry here with the same key.

export interface RtoPartner {
  /** Legal name as it appears on the national register */
  legalName: string;
  /** RTO code as it appears on the national register */
  rtoCode: string;
  /** Marketing site (homepage). Optional. */
  website?: string;
  /** training.gov.au lookup URL */
  nationalRegisterUrl: string;
  /** Student handbook PDF (latest year). Optional — falls back to RTO Policies. */
  studentHandbookUrl?: string;
  /** Refund policy / application form. Optional. */
  refundFormUrl?: string;
  /** Complaints & appeals form. Optional. */
  complaintsFormUrl?: string;
  /** Index page for all RTO policies. Optional but encouraged. */
  rtoPoliciesUrl?: string;
  /** Short pill labels for the AlertForce/Blue Dog card */
  badges: string[];
  /** What the RTO provides (used by the WhoDelivers card list) */
  provides: string[];
}

export const RTO_PARTNERS: Record<string, RtoPartner> = {
  AlertForce: {
    legalName: 'AlertForce Pty Ltd',
    rtoCode: '91826',
    website: 'https://www.alertforce.com.au',
    nationalRegisterUrl: 'https://training.gov.au/Organisation/Details/91826',
    studentHandbookUrl:
      'https://alertforce.com.au/wp-content/uploads/2025/11/AlertForce-Student-handbook_v2025.pdf',
    refundFormUrl:
      'https://alertforce.com.au/wp-content/uploads/2022/07/Form-alertforce_refund_application_july2022-1.pdf',
    complaintsFormUrl:
      'https://alertforce.com.au/wp-content/uploads/2016/05/alertforce_complaint_may16.doc',
    rtoPoliciesUrl: 'https://alertforce.com.au/rto-policies/',
    badges: ['RTO 91826', 'ASQA Regulated', 'National Provider', 'Standards for RTOs 2025'],
    provides: [
      'Online learning portal & course access',
      'Course materials & learning content',
      'Assessment & assessor sign-off',
      'Statement of Attainment',
      'Student support for course questions',
      'Student records under the Standards for RTOs 2025',
    ],
  },
  // Blue Dog Training entry can be added when a course uses it.
  // Confirm RTO code (40984 vs 31193 — the codebase has both at different
  // points) with the partner before publishing.
};

/** ABE Education's enrolment-partner side of the role-separation card.
 *  Same regardless of which RTO delivers the course. */
export const ABE_ENROLMENT_PARTNER = {
  legalName: 'ABE Education Pty Ltd',
  abn: '64 125 455 272',
  websiteLabel: 'abeeducation.edu.au',
  badges: ['Since 2007', 'Not an RTO'],
  description:
    "ABE Education is an authorised third-party enrolment partner. We market this course and process your enrolment — that's it. Once enrolled, you complete your training on the RTO's portal.",
  contactFor: ['Enrolment & payment', 'Refund requests', 'Account & invoicing'],
  contactEmail: 'info@abeeducation.edu.au',
  contactPhone: '02 9798 5000',
  contactPhoneLink: 'tel:0297985000',
} as const;
