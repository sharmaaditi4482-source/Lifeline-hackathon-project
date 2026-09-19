/**
 * Medical Knowledge Base used by the RAG (Retrieval-Augmented Generation)
 * pipeline. Each chunk is embedded into a vector at query time and retrieved by
 * semantic similarity; the winning chunks are then passed as grounding context
 * to the LLM so every answer cites a verifiable source chunk.
 */

export interface KnowledgeChunk {
  id: string;
  title: string;
  content: string;
  tags: string[];
}

export const KNOWLEDGE_BASE: KnowledgeChunk[] = [
  {
    id: "abo-system",
    title: "ABO blood group system",
    content:
      "Human blood is grouped into four main ABO types based on the presence of A and B antigens on red blood cells: A, B, AB, and O. A plasma carries anti-B antibodies, B plasma carries anti-A antibodies, AB plasma carries neither, and O plasma carries both. Recipients can only receive blood that their immune system will not attack — this is why ABO matching is a zero-tolerance biological gate. O-negative blood can be given to any patient (universal donor) because it carries no A, B, or Rh antigens. AB-positive patients can receive from any donor (universal recipient).",
    tags: ["abo", "blood group", "compatibility", "antigen", "antibody", "universal donor", "universal recipient"],
  },
  {
    id: "rh-factor",
    title: "Rh factor and Rh incompatibility",
    content:
      "The Rh (Rhesus) factor is the D antigen found on red blood cells. A person who has it is Rh-positive (Rh+); a person who lacks it is Rh-negative (Rh-). Rh-negative patients must only receive Rh-negative blood, otherwise their immune system may create anti-D antibodies. An Rh-negative mother carrying an Rh-positive baby can develop Rh sensitization in a subsequent pregnancy, which is why Rh matching matters in emergency transfusions for women of reproductive age.",
    tags: ["rh", "rhesus", "rh factor", "rh negative", "rh positive", "pregnancy", "sensitization"],
  },
  {
    id: "donor-eligibility",
    title: "WHO donor eligibility criteria",
    content:
      "A voluntary blood donor is generally eligible when he or she is between 18 and 65 years of age, weighs at least 50 kg, has a hemoglobin level of at least 12.5 g/dL, is in good general health and feels well on the day of donation, had an adequate meal and was hydrated in the past hours, and is not running a fever, cough, cold, or any active infection. Donors taking antibiotics, suffering from a chronic disease (heart, kidney, liver), or pregnant, breastfeeding, or having given birth in the last 6 months are deferred. The donor must always provide informed consent.",
    tags: ["eligibility", "criteria", "hemoglobin", "weight", "age", "who", "defer", "consent", "healthy"],
  },
  {
    id: "cooling-period",
    title: "90-day donation gap / cooldown period",
    content:
      "After donating whole blood, a donor's hemoglobin takes time to fully recover. The standard minimum interval between two whole blood donations is 90 days (3 months), enforced in India and by the WHO. Donating again sooner risks the donor's health and the quality of the collected unit. The LifeLine engine hard-blocks any donor whose last donation was fewer than 90 days ago — the remaining days are shown as a live countdown badge.",
    tags: ["90 day", "cooldown", "gap", "interval", "recovery", "hemoglobin", "safety", "donation history"],
  },
  {
    id: "donation-volume",
    title: "Blood volume per donation",
    content:
      "A standard whole blood donation in India draws 350 ml for donors weighing 50-60 kg and 450 ml for donors above 60 kg, never more than approximately 15% of the donor's estimated total blood volume. Plasma and platelet donations (apheresis) can be made more frequently: platelets as often as every 14 days (max 24 times a year) and plasma every 28 days, because red cells are returned to the donor during apheresis.",
    tags: ["volume", "350", "450", "ml", "apheresis", "platelets", "plasma", "donation"],
  },
  {
    id: "storage-shelf-life",
    title: "Blood storage conditions and shelf life",
    content:
      "Whole blood and packed red blood cells stored in a monitored blood-bank refrigerator at 2-6 degrees Celsius have a shelf life of about 35 days. Platelets are stored at 20-24 degrees Celsius with continuous agitation and last only 5 days. Fresh frozen plasma is frozen and lasts up to one year below -18 degrees Celsius. Blood nearing its expiry date must be prioritized for use or returned, otherwise it is discarded — this is the bio-waste problem LifeLine's expiry-prevention vector solves with a 20% scoring weight.",
    tags: ["storage", "shelf life", "expiry", "35 days", "refrigeration", "platelets", "plasma", "waste", "fridge"],
  },
  {
    id: "massive-transfusion",
    title: "Massive Transfusion Protocol (MTP)",
    content:
      "In a massive transfusion (e.g. trauma, post-partum hemorrhage), the standard MTP issues red cells, plasma, and platelets in a balanced ratio — commonly 1:1:1 — and begins with emergency group O blood, usually O-negative for females of childbearing age and O-positive for adult males once no sample has matched. A massive transfusion is defined as replacing the patient's total blood volume in 24 hours or receiving more than 4 units in 1 hour. Continuous monitoring for hypothermia, acidosis, and low calcium (citrate toxicity) is mandatory.",
    tags: ["mtp", "massive transfusion", "trauma", "o negative", "hemorrhage", "ratio", "post partum"],
  },
  {
    id: "emergency-type-o",
    title: "Emergency use of O-negative blood",
    content:
      "When a trauma patient's blood type is unknown and the situation is life-threatening, hospitals issue O-negative red cells because they are compatible with every patient and carry the lowest risk of a hemolytic reaction. Because O-negative is the universal donor type and chronically in short supply, it should be reserved for emergencies and females of childbearing age, while O-positive can be issued to adult males in emergencies once O-negative is scarce.",
    tags: ["o negative", "universal donor", "emergency", "trauma", "unknown type", "reserve", "shortage"],
  },
  {
    id: "transfusion-steps",
    title: "Step-by-step transfusion procedure",
    content:
      "A safe transfusion follows a strict sequence: (1) collect two independent patient identifiers, (2) draw a pre-transfusion blood sample, (3) type the patient's ABO and Rh, (4) cross-match against the donor unit, (5) obtain informed consent where applicable, (6) start the transfusion slowly — the first 15 minutes at a reduced rate while the patient is directly observed for reactions, (7) check vital signs at 15 minutes, 1 hour, and completion, and (8) document the transfusion. Two clinical staff members verify the blood bag label against the patient wristband before the unit is hung.",
    tags: ["procedure", "transfusion", "cross match", "verification", "vital signs", "steps", "protocol"],
  },
  {
    id: "transfusion-reactions",
    title: "Recognizing transfusion reactions",
    content:
      "Signs of an acute transfusion reaction include fever, chills, hives or rash, shortness of breath, low blood pressure, chest pain, dark urine, and back pain. Fever alone appearing within 24 hours is the most common sign of a febrile non-hemolytic reaction; worsening rigors with pain and hypotension within minutes may indicate an acute hemolytic reaction from ABO incompatibility. At the first sign of a reaction the transfusion must be stopped immediately, the line kept open with normal saline, the blood bag and patient samples sent to the lab, and the clinician notified.",
    tags: ["reaction", "fever", "chills", "hemolytic", "allergic", "complication", "back pain", "urine", "safety"],
  },
  {
    id: "hemoglobin-recovery",
    title: "Hemoglobin and iron recovery after donation",
    content:
      "After donating 350-450 ml of whole blood, an average adult loses roughly 200-250 mg of iron. Red cell volume is typically restored within 2 to 4 weeks, but full iron stores can take up to 8 to 12 weeks to replenish. This is the biological basis of the 90-day cooldown: it protects the donor from iron-deficiency anemia. Donors are advised to rest, drink fluids, and eat iron-rich foods after donating.",
    tags: ["hemoglobin", "iron", "recovery", "anemia", "90 days", "rest", "nutrition", "replenish"],
  },
  {
    id: "india-distribution",
    title: "Blood group distribution in India",
    content:
      "In Indian populations the most common blood group is O-positive (around 33-37%), followed by B-positive (roughly 30-32%), A-positive (around 21-24%), and AB-positive (about 7-9%); the Rh-negative types make up only 5-7% of the population combined, with O-negative and B-negative being the rarest high-demand types. When a rare or negative blood type is requested, a wider geographic radius is needed to find compatible donors — the reason LifeLine escalates matching radius tier-by-tier.",
    tags: ["india", "distribution", "o positive", "b positive", "rare", "negative", "supply", "demand", "frequency"],
  },
  {
    id: "screening-tests",
    title: "Pre-donation screening and blood testing",
    content:
      "Every collected unit is screened for transfusion-transmissible infections: HIV-1/2, Hepatitis B (HBsAg), Hepatitis C (anti-HCV), syphilis, and malaria in endemic regions, using validated screening assays. The donor history questionnaire also disqualifies recent tattoos, piercings, or acupuncture within 6 months, high-risk sexual behavior, travel to malaria-endemic zones in the past year, and current medications like certain antibiotics, blood thinners, or disease-modifying agents. Units that react on any marker are discarded and the donor is confidentially counseled.",
    tags: ["screening", "hiv", "hepatitis", "malaria", "syphilis", "testing", "tattoo", "medication", "discard"],
  },
  {
    id: "concurrency-conflict",
    title: "Hard shortage and concurrent booking conflicts",
    content:
      "When multiple emergency rooms request the same rare blood group at the same time, both may try to reserve the same last unit. A safe system uses an atomic first-confirmed-lock: the first hospital to confirm a unit is granted exclusive hold status (confirmed), and every later request for that same unit receives a conflict response and must be presented a freshly refreshed candidate pool. This prevents double-booking a single physical unit, which is the core of LifeLine's HTTP 409 conflict-prevention protocol.",
    tags: ["concurrency", "conflict", "lock", "409", "reservation", "double booking", "atomic", "race"],
  },
  {
    id: "donor-reliability",
    title: "Donor reliability and turnout",
    content:
      "Donor turnout reliability measures how often a volunteer actually shows up when called. A donor with a consistent history of showing up for scheduled donations is scored higher than a newly registered volunteer, and verified donors receive a reliability boost. In LifeLine's scoring engine, reliability is the fourth vector (15% weight) — it makes the matching algorithm favor donors the system can count on during an emergency, reducing the risk of a failed pickup.",
    tags: ["reliability", "turnout", "verified", "show up", "trust", "scoring", "history"],
  },
  {
    id: "privacy-consent",
    title: "Donor privacy and informed consent",
    content:
      "Donor identity, medical history, and test results are confidential and may only be disclosed with consent or as required by law. Before any procedure, the donor must give informed consent after understanding the risks and benefits of donation. In LifeLine models, donor phone numbers and locations are shared with hospitals only for dispatch coordination once a match is confirmed — never publicly listed.",
    tags: ["privacy", "consent", "confidentiality", "data protection", "gdpr", "informed consent", "security"],
  },
];

export function findChunksByKeywords(text: string): KnowledgeChunk[] {
  const needles = text
    .toLowerCase()
    .replace(/[^a-z0-9\s/-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);

  const scored = KNOWLEDGE_BASE.map((chunk) => {
    const haystack = `${chunk.title} ${chunk.content} ${chunk.tags.join(" ")}`.toLowerCase();
    let score = 0;
    for (const needle of needles) {
      if (haystack.includes(needle)) score += 1;
    }
    return { chunk, score };
  })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, 4).map((s) => s.chunk);
}