import type { SectionSeed } from "./types";

const BOOK = "https://openstax.org/books/calculus-volume-1/pages/";

/**
 * Exam 4 sections in study order, then the supplementary sections. Objectives are the learning
 * objectives OpenStax lists at the start of each section; concept tags are this site's own
 * vocabulary for matching similar problems.
 *
 * `prerequisites` is a first draft of the skill map, taken from the textbook's order of ideas
 * (for review in /admin). It only steers which earlier units come back sooner in look-backs.
 */
export const SECTIONS: SectionSeed[] = [
  {
    id: "4.10",
    title: "Antiderivatives",
    kind: "core",
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
      { id: "rewrite-first", label: "Rewrite before integrating", prerequisites: ["4.10:power-rule"] },
      { id: "trig-antiderivatives", label: "Trig antiderivatives" },
      { id: "exp-antiderivatives", label: "Exponential and 1/x antiderivatives" },
      { id: "initial-value", label: "Initial-value problems", prerequisites: ["4.10:power-rule"] },
      { id: "motion", label: "Motion: acceleration to velocity to position", prerequisites: ["4.10:initial-value"] },
      { id: "antiderivative-properties", label: "Properties of antiderivatives", prerequisites: ["4.10:power-rule"] },
    ],
  },
  {
    id: "5.1",
    title: "Approximating Areas",
    kind: "core",
    sort: 2,
    url: BOOK + "5-1-approximating-areas",
    objectives: [
      "Use sigma (summation) notation to calculate sums and powers of integers.",
      "Use the sum of rectangular areas to approximate the area under a curve.",
      "Use Riemann sums to approximate area.",
    ],
    concepts: [
      { id: "sigma-notation", label: "Sigma notation" },
      { id: "sum-properties", label: "Sum properties and formulas", prerequisites: ["5.1:sigma-notation"] },
      { id: "endpoint-sums", label: "Left and right endpoint sums", prerequisites: ["5.1:sigma-notation"] },
      { id: "riemann-from-graph", label: "Riemann sums from a graph", prerequisites: ["5.1:endpoint-sums"] },
      { id: "over-under", label: "Overestimates and underestimates", prerequisites: ["5.1:endpoint-sums"] },
      { id: "sum-applications", label: "Sums in context", prerequisites: ["5.1:endpoint-sums"] },
    ],
  },
  {
    id: "5.2",
    title: "The Definite Integral",
    kind: "core",
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
      { id: "limit-to-integral", label: "Riemann-sum limits as integrals", prerequisites: ["5.1:endpoint-sums", "5.1:sum-properties"] },
      { id: "area-geometry", label: "Integrals from area formulas" },
      { id: "net-signed-area", label: "Net signed area", prerequisites: ["5.2:area-geometry"] },
      { id: "integral-properties", label: "Properties of definite integrals", prerequisites: ["5.2:area-geometry"] },
      { id: "odd-symmetry", label: "Symmetry (odd functions)", prerequisites: ["5.2:net-signed-area"] },
      { id: "comparison", label: "Comparison theorem", prerequisites: ["5.2:integral-properties"] },
      { id: "average-value", label: "Average value of a function", prerequisites: ["5.2:area-geometry"] },
    ],
  },
  {
    id: "5.3",
    title: "The Fundamental Theorem of Calculus",
    kind: "core",
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
      { id: "ftc1", label: "FTC Part 1: derivative of an integral", prerequisites: ["5.2:net-signed-area"] },
      { id: "ftc1-chain", label: "FTC Part 1 with the chain rule", prerequisites: ["5.3:ftc1"] },
      { id: "ftc2", label: "FTC Part 2: evaluating definite integrals", prerequisites: ["4.10:power-rule", "4.10:rewrite-first"] },
      { id: "ftc2-trig", label: "FTC Part 2 with trig functions", prerequisites: ["5.3:ftc2", "4.10:trig-antiderivatives"] },
      { id: "absolute-value", label: "Integrals of absolute values", prerequisites: ["5.3:ftc2"] },
      { id: "mvt-integrals", label: "Mean Value Theorem for Integrals", prerequisites: ["5.2:average-value", "5.3:ftc2"] },
      { id: "accumulation", label: "Accumulation functions", prerequisites: ["5.3:ftc1"] },
    ],
  },
  {
    id: "5.4",
    title: "Integration Formulas and the Net Change Theorem",
    kind: "core",
    sort: 5,
    url: BOOK + "5-4-integration-formulas-and-the-net-change-theorem",
    objectives: [
      "Apply the basic integration formulas.",
      "Explain the significance of the net change theorem.",
      "Use the net change theorem to solve applied problems.",
      "Apply the integrals of odd and even functions.",
    ],
    concepts: [
      {
        id: "basic-formulas",
        label: "Basic integration formulas",
        prerequisites: ["4.10:power-rule", "4.10:trig-antiderivatives", "4.10:exp-antiderivatives"],
      },
      { id: "net-change", label: "Net change theorem", prerequisites: ["5.3:ftc2"] },
      { id: "displacement-distance", label: "Displacement vs. total distance", prerequisites: ["5.4:net-change", "5.3:absolute-value"] },
      { id: "motion-ivp", label: "Motion from acceleration", prerequisites: ["4.10:motion", "5.4:net-change"] },
      { id: "even-odd", label: "Even and odd functions", prerequisites: ["5.2:odd-symmetry", "5.3:ftc2"] },
    ],
  },
  {
    id: "5.5",
    title: "Substitution",
    kind: "core",
    sort: 6,
    url: BOOK + "5-5-substitution",
    objectives: [
      "Use substitution to evaluate indefinite integrals.",
      "Use substitution to evaluate definite integrals.",
    ],
    concepts: [
      { id: "usub-linear", label: "Substitution with a linear inside", prerequisites: ["4.10:power-rule"] },
      { id: "usub-indefinite", label: "Substitution: indefinite integrals", prerequisites: ["5.5:usub-linear"] },
      { id: "usub-trig", label: "Substitution with trig functions", prerequisites: ["5.5:usub-indefinite", "4.10:trig-antiderivatives"] },
      { id: "usub-backsolve", label: "Substitution that needs x in terms of u", prerequisites: ["5.5:usub-indefinite"] },
      {
        id: "usub-definite",
        label: "Substitution: definite integrals (change the limits)",
        prerequisites: ["5.5:usub-indefinite", "5.3:ftc2"],
      },
    ],
  },
  {
    id: "5.6",
    title: "Integrals Involving Exponential and Logarithmic Functions",
    kind: "core",
    sort: 7,
    url: BOOK + "5-6-integrals-involving-exponential-and-logarithmic-functions",
    objectives: [
      "Integrate functions involving exponential functions.",
      "Integrate functions involving logarithmic functions.",
    ],
    concepts: [
      { id: "exp-basic", label: "Integrals of exponentials", prerequisites: ["4.10:exp-antiderivatives"] },
      { id: "exp-usub", label: "Exponentials with substitution", prerequisites: ["5.6:exp-basic", "5.5:usub-indefinite"] },
      { id: "log-basic", label: "Integrals that give ln|x|", prerequisites: ["4.10:exp-antiderivatives"] },
      { id: "log-usub", label: "u'/u integrals (logarithms)", prerequisites: ["5.6:log-basic", "5.5:usub-indefinite"] },
      { id: "trig-log", label: "Trig integrals that give logarithms", prerequisites: ["5.6:log-usub", "4.10:trig-antiderivatives"] },
      { id: "explog-definite", label: "Definite integrals with e and ln", prerequisites: ["5.6:exp-usub", "5.3:ftc2"] },
    ],
  },
  {
    id: "5.7",
    title: "Integrals Resulting in Inverse Trigonometric Functions",
    kind: "core",
    sort: 8,
    url: BOOK + "5-7-integrals-resulting-in-inverse-trigonometric-functions",
    objectives: ["Integrate functions resulting in inverse trigonometric functions."],
    concepts: [
      { id: "arcsin-form", label: "The arcsine form" },
      { id: "arctan-form", label: "The arctangent form" },
      { id: "arcsec-form", label: "The arcsecant form" },
      {
        id: "inverse-trig-usub",
        label: "Inverse trig with substitution",
        prerequisites: ["5.5:usub-indefinite", "5.7:arcsin-form", "5.7:arctan-form"],
      },
      { id: "inverse-trig-definite", label: "Definite integrals with inverse trig", prerequisites: ["5.7:inverse-trig-usub", "5.3:ftc2"] },
      { id: "inverse-trig-concepts", label: "Domains and identities", prerequisites: ["5.7:arcsin-form"] },
    ],
  },
  // Supplementary: earlier material for extra practice and look-backs. Not on Exam 4, and no problems yet
  // (problems come with the separate problem-selection step).
  {
    id: "4.1",
    title: "Related Rates",
    kind: "supplementary",
    sort: 90,
    url: BOOK + "4-1-related-rates",
    objectives: [
      "Express changing quantities in terms of derivatives.",
      "Find relationships among the derivatives in a given problem.",
      "Use the chain rule to find the rate of change of one quantity that depends on the rate of change of other quantities.",
    ],
    concepts: [
      { id: "rates-setup", label: "Setting up a related-rates equation" },
      { id: "rates-geometry", label: "Rates of areas and volumes", prerequisites: ["4.1:rates-setup"] },
      { id: "rates-distance", label: "Distances and the Pythagorean theorem", prerequisites: ["4.1:rates-setup"] },
      { id: "rates-angles", label: "Changing angles with trig", prerequisites: ["4.1:rates-setup"] },
    ],
  },
  {
    id: "4.2",
    title: "Linear Approximations and Differentials",
    kind: "supplementary",
    sort: 91,
    url: BOOK + "4-2-linear-approximations-and-differentials",
    objectives: [
      "Describe the linear approximation to a function at a point.",
      "Write the linearization of a given function.",
      "Draw a graph that illustrates the use of differentials to approximate the change in a quantity.",
      "Calculate the relative error and percentage error in using a differential approximation.",
    ],
    concepts: [
      { id: "linearization", label: "Linearization at a point" },
      { id: "linear-estimates", label: "Estimating values with a tangent line", prerequisites: ["4.2:linearization"] },
      { id: "differentials", label: "Differentials dy and dx", prerequisites: ["4.2:linearization"] },
      { id: "error-estimates", label: "Relative and percentage error", prerequisites: ["4.2:differentials"] },
    ],
  },
];

export const SECTION_IDS = SECTIONS.map((s) => s.id);

/** Sections on Exam 4, in study order. */
export const CORE_SECTIONS = SECTIONS.filter((s) => s.kind === "core");
