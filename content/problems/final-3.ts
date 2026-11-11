import { sectionProblems, t } from "../helpers";

// Final Exam, Chapter 3 Review Exercises (OpenStax Calculus Volume 1), 386 and 387: added at the
// owner's request (2026-11-10) beyond the 77 questions of the import specification.
// Figures are cropped from the owner's screenshots; hints, answers and worked solutions are original to this site.

const DRAW = t`Draw the derivative for the following graph.`;

export default sectionProblems("3", [
  {
    n: 386, d: "C", c: ["derivative-graphs"],
    q: DRAW,
    image: {
      src: "/figures/final/3-386.png",
      width: 429,
      height: 297,
      alt: "Graph of f for x from −3 to 3. Starting near (−3, 0.6), the curve falls to a local minimum near (−2.3, −2), rises through the x-axis near x = −1.4, and levels off at height 2 with a horizontal tangent at (0, 2). It then rises again, steepest around x = 1.5, to a local maximum near (2.4, 6), and falls to about (3, 3.3).",
    },
    hints: [
      t`Mark every point where the graph has a horizontal tangent: $f'=0$ there. Look for three of them.`,
      t`At the flat spot $(0,2)$ the graph keeps rising on both sides, so $f'$ touches $0$ there without changing sign.`,
    ],
    a: t`$f'$ is negative from $x=-3$ to about $x=-2.3$, $0$ there, positive up to $x=0$ with a peak near $x=-1.4$, back to $0$ at $x=0$ (touching, not crossing), positive again up to about $x=2.4$ with a peak near $x=1.5$, $0$ there, and negative, falling steeply, from $2.4$ to $3$.`,
    steps: [
      ["Horizontal tangents", t`The graph is flat at its local minimum near $x=-2.3$, at the level spot $(0,2)$, and at its local maximum near $x=2.4$. So $f'=0$ at about $x=-2.3$, $0$ and $2.4$.`],
      ["Signs of f′", t`$f$ falls on $(-3,-2.3)$, rises on $(-2.3,0)$ and $(0,2.4)$, and falls on $(2.4,3)$. So $f'<0$, then $f'>0$ (touching $0$ at $x=0$), then $f'<0$.`],
      ["Sizes", t`$f$ rises fastest near $x=-1.4$ and near $x=1.5$, so those are the two peaks of $f'$; the second is higher because the climb from $2$ to $6$ is steeper. At both ends $f$ is falling steeply, so $f'$ is clearly negative near $x=-3$ and very negative near $x=3$.`],
      ["Sketch", t`Draw $f'$ starting below the axis at $x=-3$, crossing upward near $x=-2.3$, rising to a hump near $x=-1.4$, dipping down to just touch the axis at $x=0$, rising to a taller hump near $x=1.5$, then crossing downward near $x=2.4$ and dropping steeply toward $x=3$.`],
    ],
    check: { kind: "manual", note: "Sketch read from the OpenStax graph (Chapter 3 review, exercise 386)." },
  },
  {
    n: 387, d: "C", c: ["derivative-graphs"],
    q: DRAW,
    image: {
      src: "/figures/final/3-387.png",
      width: 316,
      height: 420,
      alt: "Graph of f for x from −1 to 2. A straight line falls from (−1, 4) to the origin, where the graph has a sharp corner. From the origin a curve rises like y = x squared, through (1, 1) to (2, 4).",
    },
    hints: [
      t`The left piece is a straight line through $(-1,4)$ and $(0,0)$. What is its slope?`,
      t`The right piece passes through $(0,0)$, $(1,1)$ and $(2,4)$: it is $y=x^2$. What is the derivative of $x^2$?`,
    ],
    a: t`$f'(x)=-4$ for $-1<x<0$ and $f'(x)=2x$ for $0<x<2$. $f'(0)$ does not exist (the corner): draw the horizontal line $y=-4$ ending in an open circle at $(0,-4)$, and the line $y=2x$ from an open circle at $(0,0)$ up to $(2,4)$.`,
    steps: [
      ["Left piece", t`From $(-1,4)$ to $(0,0)$ the graph is a straight line with slope $\dfrac{0-4}{0-(-1)}=-4$, so $f'(x)=-4$ for $-1<x<0$.`],
      ["Right piece", t`The curve through $(0,0)$, $(1,1)$ and $(2,4)$ is $f(x)=x^2$, so $f'(x)=2x$ for $0<x<2$.`],
      ["At the corner", t`At $x=0$ the slope jumps from $-4$ (from the left) to $0$ (from the right), so $f$ has no derivative at $x=0$.`],
      ["Sketch", t`Draw the horizontal segment $y=-4$ from $x=-1$ to an open circle at $(0,-4)$, then the line $y=2x$ from an open circle at $(0,0)$ to $(2,4)$. The jump at $x=0$ shows the corner.`],
    ],
    check: [
      { kind: "derivative", expr: "-4*x", value: "-4" },
      { kind: "derivative", expr: "x**2", value: "2*x" },
    ],
  },
]);
