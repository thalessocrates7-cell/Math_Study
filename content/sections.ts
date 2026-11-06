import type { SectionSeed } from "./types";

const BOOK = "https://openstax.org/books/calculus-volume-1/pages/";

/**
 * Exam 4 sections in study order. Objectives are the learning objectives OpenStax lists at the start
 * of each section; concept tags are this site's own vocabulary for matching similar problems.
 */
export const SECTIONS: SectionSeed[] = [
  {
    id: "4.10",
    title: "Antiderivatives",
    sort: 1,
    url: BOOK + "4-10-antiderivatives",
    objectives: [
      "Find the general antiderivative of a given function.",
      "Explain the terms and notation used for an indefinite integral.",
      "State the power rule for integrals.",
      "Use antidifferentiation to solve simple initial-value problems.",
    ],
    concepts: [
      { id: "verify-antiderivative", label: "Checking an antiderivative" },
      { id: "power-rule", label: "Power rule for integrals" },
      { id: "rewrite-first", label: "Rewrite before integrating" },
      { id: "trig-antiderivatives", label: "Trig antiderivatives" },
      { id: "exp-antiderivatives", label: "Exponential and 1/x antiderivatives" },
      { id: "initial-value", label: "Initial-value problems" },
      { id: "motion", label: "Motion: acceleration to velocity to position" },
      { id: "antiderivative-properties", label: "Properties of antiderivatives" },
    ],
  },
  {
    id: "5.1",
    title: "Approximating Areas",
    sort: 2,
    url: BOOK + "5-1-approximating-areas",
    objectives: [
      "Use sigma (summation) notation to calculate sums and powers of integers.",
      "Use the sum of rectangular areas to approximate the area under a curve.",
      "Use Riemann sums to approximate area.",
    ],
    concepts: [
      { id: "sigma-notation", label: "Sigma notation" },
      { id: "sum-properties", label: "Sum properties and formulas" },
      { id: "endpoint-sums", label: "Left and right endpoint sums" },
      { id: "riemann-from-graph", label: "Riemann sums from a graph" },
      { id: "over-under", label: "Overestimates and underestimates" },
      { id: "sum-applications", label: "Sums in context" },
    ],
  },
  {
    id: "5.2",
    title: "The Definite Integral",
    sort: 3,
    url: BOOK + "5-2-the-definite-integral",
    objectives: [
      "State the definition of the definite integral.",
      "Explain the terms integrand, limits of integration, and variable of integration.",
      "Explain when a function is integrable.",
      "Describe the relationship between the definite integral and net area.",
      "Use geometry and the properties of definite integrals to evaluate them.",
      "Calculate the average value of a function.",
    ],
    concepts: [
      { id: "limit-to-integral", label: "Riemann-sum limits as integrals" },
      { id: "area-geometry", label: "Integrals from area formulas" },
      { id: "net-signed-area", label: "Net signed area" },
      { id: "integral-properties", label: "Properties of definite integrals" },
      { id: "odd-symmetry", label: "Symmetry (odd functions)" },
      { id: "comparison", label: "Comparison theorem" },
      { id: "average-value", label: "Average value of a function" },
    ],
  },
  {
    id: "5.3",
    title: "The Fundamental Theorem of Calculus",
    sort: 4,
    url: BOOK + "5-3-the-fundamental-theorem-of-calculus",
    objectives: [
      "Describe the meaning of the Mean Value Theorem for Integrals.",
      "State the meaning of the Fundamental Theorem of Calculus, Part 1.",
      "Use the Fundamental Theorem of Calculus, Part 1, to evaluate derivatives of integrals.",
      "State the meaning of the Fundamental Theorem of Calculus, Part 2.",
      "Use the Fundamental Theorem of Calculus, Part 2, to evaluate definite integrals.",
      "Explain the relationship between differentiation and integration.",
    ],
    concepts: [
      { id: "ftc1", label: "FTC Part 1: derivative of an integral" },
      { id: "ftc1-chain", label: "FTC Part 1 with the chain rule" },
      { id: "ftc2", label: "FTC Part 2: evaluating definite integrals" },
      { id: "ftc2-trig", label: "FTC Part 2 with trig functions" },
      { id: "absolute-value", label: "Integrals of absolute values" },
      { id: "mvt-integrals", label: "Mean Value Theorem for Integrals" },
      { id: "accumulation", label: "Accumulation functions" },
    ],
  },
  {
    id: "5.4",
    title: "Integration Formulas and the Net Change Theorem",
    sort: 5,
    url: BOOK + "5-4-integration-formulas-and-the-net-change-theorem",
    objectives: [
      "Apply the basic integration formulas.",
      "Explain the significance of the net change theorem.",
      "Use the net change theorem to solve applied problems.",
      "Apply the integrals of odd and even functions.",
    ],
    concepts: [
      { id: "basic-formulas", label: "Basic integration formulas" },
      { id: "net-change", label: "Net change theorem" },
      { id: "displacement-distance", label: "Displacement vs. total distance" },
      { id: "motion-ivp", label: "Motion from acceleration" },
      { id: "even-odd", label: "Even and odd functions" },
    ],
  },
  {
    id: "5.5",
    title: "Substitution",
    sort: 6,
    url: BOOK + "5-5-substitution",
    objectives: [
      "Use substitution to evaluate indefinite integrals.",
      "Use substitution to evaluate definite integrals.",
    ],
    concepts: [
      { id: "usub-linear", label: "Substitution with a linear inside" },
      { id: "usub-indefinite", label: "Substitution: indefinite integrals" },
      { id: "usub-trig", label: "Substitution with trig functions" },
      { id: "usub-backsolve", label: "Substitution that needs x in terms of u" },
      { id: "usub-definite", label: "Substitution: definite integrals (change the limits)" },
    ],
  },
  {
    id: "5.6",
    title: "Integrals Involving Exponential and Logarithmic Functions",
    sort: 7,
    url: BOOK + "5-6-integrals-involving-exponential-and-logarithmic-functions",
    objectives: [
      "Integrate functions involving exponential functions.",
      "Integrate functions involving logarithmic functions.",
    ],
    concepts: [
      { id: "exp-basic", label: "Integrals of exponentials" },
      { id: "exp-usub", label: "Exponentials with substitution" },
      { id: "log-basic", label: "Integrals that give ln|x|" },
      { id: "log-usub", label: "u'/u integrals (logarithms)" },
      { id: "trig-log", label: "Trig integrals that give logarithms" },
      { id: "explog-definite", label: "Definite integrals with e and ln" },
    ],
  },
  {
    id: "5.7",
    title: "Integrals Resulting in Inverse Trigonometric Functions",
    sort: 8,
    url: BOOK + "5-7-integrals-resulting-in-inverse-trigonometric-functions",
    objectives: ["Integrate functions resulting in inverse trigonometric functions."],
    concepts: [
      { id: "arcsin-form", label: "The arcsine form" },
      { id: "arctan-form", label: "The arctangent form" },
      { id: "arcsec-form", label: "The arcsecant form" },
      { id: "inverse-trig-usub", label: "Inverse trig with substitution" },
      { id: "inverse-trig-definite", label: "Definite integrals with inverse trig" },
      { id: "inverse-trig-concepts", label: "Domains and identities" },
    ],
  },
];

export const SECTION_IDS = SECTIONS.map((s) => s.id);
