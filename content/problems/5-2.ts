import { sample, sectionProblems, t } from "../helpers";

const GIVEN = t`Suppose $\int_0^4 f(x)\,dx=5$, $\int_0^2 f(x)\,dx=-3$, $\int_0^4 g(x)\,dx=-1$ and $\int_0^2 g(x)\,dx=2$.`;

export default sectionProblems("5.2", [
  // ---------- Foundation ----------
  {
    n: 60, d: "F", c: ["limit-to-integral"],
    q: t`Express the limit as a definite integral.
$$\lim_{n\to\infty}\sum_{i=1}^{n}x_i^{*}\,\Delta x\quad\text{over }[1,3]$$`,
    hints: [t`A limit of Riemann sums $\lim\sum f(x_i^*)\Delta x$ over $[a,b]$ is $\int_a^b f(x)\,dx$. What is $f$ here?`],
    a: t`$\displaystyle\int_1^3 x\,dx$`,
    steps: [
      ["Match the pattern", t`The sum has the form $\sum f(x_i^*)\Delta x$ with $f(x_i^*)=x_i^*$, so $f(x)=x$.`],
      ["Use the interval", t`The interval $[1,3]$ gives the limits of integration: $\int_1^3 x\,dx$ (which equals 4, the area of a trapezoid).`],
    ],
    check: { kind: "definite", f: "x", a: "1", b: "3", value: "4" },
  },
  {
    n: 65, d: "F", c: ["limit-to-integral"],
    q: t`Express the limit of the right-endpoint sum as $n\to\infty$ as a definite integral, identifying the interval.
$$R_n=\frac{1}{n}\sum_{i=1}^{n}\frac{i}{n}$$`,
    hints: [t`Here $\Delta x=\frac1n$, so the interval has length 1. The right endpoints are $x_i=\frac{i}{n}$, which run from near 0 up to 1.`],
    a: t`$\displaystyle\int_0^1 x\,dx$`,
    steps: [
      ["Width and endpoints", t`$\Delta x=\frac1n$ and $x_i=\frac in$, so the interval is $[0,1]$.`],
      ["Function", t`The height is $\frac in=x_i$, so $f(x)=x$.`],
      ["Integral", t`$\lim_{n\to\infty}R_n=\int_0^1x\,dx=\frac12$.`],
    ],
    check: [
      { kind: "definite", f: "x", a: "0", b: "1", value: "1/2" },
      { kind: "value", expr: "limit(Sum(i/n, (i, 1, n)).doit()/n, n, oo)", value: "1/2" },
    ],
  },
  {
    n: 76, d: "F", c: ["area-geometry"],
    q: t`Evaluate the integral using area formulas.
$$\int_0^3(3-x)\,dx$$`,
    hints: [t`Sketch $y=3-x$ from $x=0$ to $x=3$. What shape is the region under it?`],
    a: t`$\dfrac92$`,
    steps: [
      ["Identify the shape", t`$y=3-x$ goes from $(0,3)$ down to $(3,0)$: a right triangle with base 3 and height 3.`],
      ["Area", t`$\frac12\cdot3\cdot3=\frac92$`],
    ],
    check: { kind: "definite", f: "3 - x", a: "0", b: "3", value: "9/2" },
  },
  {
    n: 77, d: "F", c: ["area-geometry"],
    q: t`Evaluate the integral using area formulas.
$$\int_2^3(3-x)\,dx$$`,
    hints: [t`On $[2,3]$ the line $y=3-x$ goes from height 1 down to 0.`],
    a: t`$\dfrac12$`,
    steps: [
      ["Identify the shape", t`A right triangle with base $3-2=1$ and height $f(2)=1$.`],
      ["Area", t`$\frac12\cdot1\cdot1=\frac12$`],
    ],
    check: { kind: "definite", f: "3 - x", a: "2", b: "3", value: "1/2" },
  },
  {
    n: 80, d: "F", c: ["area-geometry"],
    q: t`Evaluate the integral using area formulas.
$$\int_{-2}^{2}\sqrt{4-x^2}\,dx$$`,
    hints: [t`$y=\sqrt{4-x^2}$ is the top half of the circle $x^2+y^2=4$.`],
    a: t`$2\pi$`,
    steps: [
      ["Identify the shape", t`The graph is the upper half of a circle of radius 2 centered at the origin.`],
      ["Area of a half-disk", t`$\frac12\pi r^2=\frac12\pi(2)^2=2\pi$`],
    ],
    check: { kind: "definite", f: "sqrt(4 - x**2)", a: "-2", b: "2", value: "2*pi" },
  },
  {
    n: 88, d: "F", c: ["integral-properties"],
    q: GIVEN + t` Compute the integral.
$$\int_0^4\left(f(x)+g(x)\right)dx$$`,
    hints: [t`The integral of a sum is the sum of the integrals.`],
    a: t`$4$`,
    steps: [
      ["Split", t`$\int_0^4(f+g)\,dx=\int_0^4f\,dx+\int_0^4g\,dx$`],
      ["Substitute", t`$5+(-1)=4$`],
    ],
    check: { kind: "value", expr: "5 + (-1)", value: "4" },
  },
  {
    n: 90, d: "F", c: ["integral-properties"],
    q: GIVEN + t` Compute the integral.
$$\int_0^2\left(f(x)-g(x)\right)dx$$`,
    hints: [t`Split into $\int_0^2 f\,dx-\int_0^2 g\,dx$ and use the given values on $[0,2]$.`],
    a: t`$-5$`,
    steps: [
      ["Split", t`$\int_0^2(f-g)\,dx=\int_0^2f\,dx-\int_0^2g\,dx$`],
      ["Substitute", t`$-3-2=-5$`],
    ],
    check: { kind: "value", expr: "-3 - 2", value: "-5" },
  },
  {
    n: 138, d: "F", c: ["integral-properties"],
    q: t`If $\displaystyle\int_1^5\sqrt{1+t^4}\,dt=41.7133\ldots$, what is $\displaystyle\int_1^5\sqrt{1+u^4}\,du$?`,
    hints: [t`Does the name of the variable of integration change the value of a definite integral?`],
    a: t`$41.7133\ldots$, the same number.`,
    steps: [
      ["Dummy variable", t`The variable of integration is a placeholder: renaming $t$ to $u$ does not change the function or the interval.`],
      ["Answer", t`So $\int_1^5\sqrt{1+u^4}\,du=41.7133\ldots$`],
    ],
    check: { kind: "manual", note: "Dummy-variable property; value given in the problem." },
  },

  // ---------- Core ----------
  {
    n: 66, d: "C", c: ["limit-to-integral"],
    q: t`Express the limit of the left-endpoint sum as $n\to\infty$ as a definite integral, identifying the interval.
$$L_n=\frac{2}{n}\sum_{i=1}^{n}\left(1+2\,\frac{i-1}{n}\right)$$`,
    hints: [
      t`$\Delta x=\frac2n$, so the interval has length 2.`,
      t`If the left endpoints are $x_{i-1}=2\cdot\frac{i-1}{n}$ (starting at 0), what function gives the height $1+x_{i-1}$?`,
    ],
    a: t`$\displaystyle\int_0^2(1+x)\,dx$ (equivalently $\displaystyle\int_1^3x\,dx$; both equal 4).`,
    steps: [
      ["Width", t`$\Delta x=\frac2n$, so $b-a=2$.`],
      ["Endpoints and heights", t`With $a=0$: $x_{i-1}=\frac{2(i-1)}{n}$ and the height is $1+x_{i-1}$, so $f(x)=1+x$ on $[0,2]$.`],
      ["Another valid reading", t`With $a=1$: $x_{i-1}=1+\frac{2(i-1)}{n}$ and the height is $x_{i-1}$, giving $\int_1^3x\,dx$. Both equal $4$.`],
    ],
    check: [
      { kind: "definite", f: "1 + x", a: "0", b: "2", value: "4" },
      { kind: "definite", f: "x", a: "1", b: "3", value: "4" },
      { kind: "value", expr: "limit(2/n*Sum(1 + 2*(i - 1)/n, (i, 1, n)).doit(), n, oo)", value: "4" },
    ],
  },
  {
    n: 78, d: "C", c: ["area-geometry"],
    q: t`Evaluate the integral using area formulas.
$$\int_{-3}^{3}\left(3-|x|\right)dx$$`,
    hints: [t`$y=3-|x|$ is a tent: it rises from $(-3,0)$ to $(0,3)$ and falls to $(3,0)$.`],
    a: t`$9$`,
    steps: [
      ["Identify the shape", t`A triangle with base $6$ (from $-3$ to $3$) and height $3$.`],
      ["Area", t`$\frac12\cdot6\cdot3=9$`],
    ],
    check: { kind: "definite", f: "3 - Abs(x)", a: "-3", b: "3", value: "9" },
  },
  {
    n: 81, d: "C", c: ["area-geometry"],
    q: t`Evaluate the integral using area formulas.
$$\int_1^5\sqrt{4-(x-3)^2}\,dx$$`,
    hints: [t`Square both sides of $y=\sqrt{4-(x-3)^2}$: $(x-3)^2+y^2=4$. Where is the center, and what is the radius?`],
    a: t`$2\pi$`,
    steps: [
      ["Identify the shape", t`$(x-3)^2+y^2=4$ with $y\ge0$: the top half of a circle with center $(3,0)$ and radius 2.`],
      ["Check the interval", t`$[1,5]$ is exactly $3\pm2$, the full width of the semicircle.`],
      ["Area", t`$\frac12\pi(2)^2=2\pi$`],
    ],
    check: { kind: "definite", f: "sqrt(4 - (x - 3)**2)", a: "1", b: "5", value: "2*pi" },
  },
  {
    n: 83, d: "C", c: ["area-geometry"],
    q: t`Evaluate the integral using area formulas.
$$\int_{-2}^{3}\left(3-|x|\right)dx$$`,
    hints: [t`Split at $x=0$. On $[-2,0]$ the region is a trapezoid; on $[0,3]$ it is a triangle.`],
    a: t`$\dfrac{17}{2}$`,
    steps: [
      ["Left piece", t`On $[-2,0]$: heights go from $f(-2)=1$ to $f(0)=3$, a trapezoid: $2\cdot\frac{1+3}{2}=4$.`],
      ["Right piece", t`On $[0,3]$: a triangle with base 3 and height 3: $\frac92$.`],
      ["Add", t`$4+\frac92=\frac{17}{2}$`],
    ],
    check: { kind: "definite", f: "3 - Abs(x)", a: "-2", b: "3", value: "17/2" },
  },
  {
    n: 84, d: "C", c: ["area-geometry", "net-signed-area"],
    q: t`The graph of a piecewise linear function passes through the points $(0,0),(2,1),(4,3),(5,0),(6,0),(8,3)$. Use averages of the values at the left and right endpoints of each piece to compute $\displaystyle\int_0^8 f(x)\,dx$.`,
    figure: {
      xMin: -0.5, xMax: 8.5, yMin: -0.5, yMax: 3.5,
      curves: [{ points: [[0, 0], [2, 1], [4, 3], [5, 0], [6, 0], [8, 3]], shade: true }],
      dots: [[0, 0], [2, 1], [4, 3], [5, 0], [6, 0], [8, 3]],
      xTicks: [0, 1, 2, 3, 4, 5, 6, 7, 8], yTicks: [1, 2, 3],
      alt: "Piecewise linear graph through (0, 0), (2, 1), (4, 3), (5, 0), (6, 0) and (8, 3), with the region under it shaded.",
    },
    hints: [t`On each straight piece, the area is a trapezoid: width $\times\frac{\text{left value}+\text{right value}}{2}$.`],
    a: t`$\dfrac{19}{2}=9.5$`,
    steps: [
      ["Piece by piece", t`$[0,2]$: $2\cdot\frac{0+1}{2}=1$; $\ [2,4]$: $2\cdot\frac{1+3}{2}=4$; $\ [4,5]$: $1\cdot\frac{3+0}{2}=1.5$`],
      ["The rest", t`$[5,6]$: $0$; $\ [6,8]$: $2\cdot\frac{0+3}{2}=3$`],
      ["Add", t`$1+4+1.5+0+3=9.5$`],
    ],
    check: { kind: "value", expr: "2*(0 + 1)/2 + 2*(1 + 3)/2 + 1*(3 + 0)/2 + 1*(0 + 0)/2 + 2*(0 + 3)/2", value: "19/2" },
  },
  {
    n: 89, d: "C", c: ["integral-properties"],
    q: GIVEN + t` Compute the integral.
$$\int_2^4\left(f(x)+g(x)\right)dx$$`,
    hints: [t`Use $\int_2^4 f\,dx=\int_0^4f\,dx-\int_0^2f\,dx$, and the same for $g$.`],
    a: t`$5$`,
    steps: [
      ["Integral of f on [2,4]", t`$\int_2^4f\,dx=5-(-3)=8$`],
      ["Integral of g on [2,4]", t`$\int_2^4g\,dx=-1-2=-3$`],
      ["Add", t`$8+(-3)=5$`],
    ],
    check: { kind: "value", expr: "(5 - (-3)) + (-1 - 2)", value: "5" },
  },
  {
    n: 93, d: "C", c: ["integral-properties"],
    q: GIVEN + t` Compute the integral.
$$\int_2^4\left(4f(x)-3g(x)\right)dx$$`,
    hints: [t`First find $\int_2^4f\,dx$ and $\int_2^4g\,dx$ by subtracting the $[0,2]$ part from the $[0,4]$ total.`],
    a: t`$41$`,
    steps: [
      ["Pieces on [2,4]", t`$\int_2^4f\,dx=5-(-3)=8$ and $\int_2^4g\,dx=-1-2=-3$`],
      ["Linearity", t`$4\int_2^4f\,dx-3\int_2^4g\,dx=4(8)-3(-3)$`],
      ["Compute", t`$32+9=41$`],
    ],
    check: { kind: "value", expr: "4*(5 - (-3)) - 3*(-1 - 2)", value: "41" },
  },
  {
    n: 94, d: "C", c: ["odd-symmetry", "integral-properties"],
    q: t`Use the identity $\int_{-A}^{A}f\,dx=\int_{-A}^{0}f\,dx+\int_0^{A}f\,dx$ to compute the integral.
$$\int_{-\pi}^{\pi}\frac{\sin t}{1+t^2}\,dt$$`,
    hints: [t`$\sin(-t)=-\sin t$ while $1+(-t)^2=1+t^2$. Is the integrand even or odd?`],
    a: t`$0$`,
    steps: [
      ["Check symmetry", t`$f(-t)=\frac{\sin(-t)}{1+t^2}=-f(t)$, so $f$ is odd.`],
      ["Split at 0", t`The area on $[-\pi,0]$ is the negative of the area on $[0,\pi]$, so the two pieces cancel.`],
      ["Answer", t`$\int_{-\pi}^{\pi}\frac{\sin t}{1+t^2}\,dt=0$`],
    ],
    check: { kind: "definite", f: "sin(t)/(1 + t**2)", a: "-pi", b: "pi", value: "0", var: "t" },
  },
  {
    n: 96, d: "C", c: ["net-signed-area"],
    q: t`Find the net signed area between $f(x)$ and the $x$-axis. (Hint: look at the graph of $f$.)
$$\int_1^3(2-x)\,dx$$`,
    hints: [t`$y=2-x$ crosses the $x$-axis at $x=2$. Compare the area above the axis on $[1,2]$ with the area below on $[2,3]$.`],
    a: t`$0$`,
    steps: [
      ["Above the axis", t`On $[1,2]$: a triangle with base 1 and height 1, area $\frac12$.`],
      ["Below the axis", t`On $[2,3]$: a triangle with base 1 and depth 1, signed area $-\frac12$.`],
      ["Net signed area", t`$\frac12-\frac12=0$`],
    ],
    check: { kind: "definite", f: "2 - x", a: "1", b: "3", value: "0" },
  },
  {
    n: 110, d: "C", c: ["average-value"],
    q: t`Find the average value $f_{\text{ave}}$ of $f$ between $a$ and $b$, and find a point $c$ where $f(c)=f_{\text{ave}}$. Use $\int_0^1x^2\,dx=\frac13$.
$$f(x)=x^2,\qquad a=-1,\ b=1$$`,
    hints: [
      t`$f_{\text{ave}}=\frac{1}{b-a}\int_a^bf(x)\,dx$. Since $x^2$ is even, $\int_{-1}^{1}x^2\,dx=2\int_0^1x^2\,dx$.`,
    ],
    a: t`$f_{\text{ave}}=\dfrac13$, at $c=\pm\dfrac{1}{\sqrt3}$.`,
    steps: [
      ["Integral", t`$\int_{-1}^{1}x^2\,dx=2\cdot\frac13=\frac23$`],
      ["Average", t`$f_{\text{ave}}=\frac{1}{1-(-1)}\cdot\frac23=\frac13$`],
      ["Solve f(c) = average", t`$c^2=\frac13$, so $c=\pm\frac{1}{\sqrt3}\approx\pm0.577$; both are in $[-1,1]$.`],
    ],
    check: [
      { kind: "definite", f: "x**2", a: "-1", b: "1", value: "2/3" },
      { kind: "value", expr: "(1/sqrt(3))**2", value: "1/3" },
    ],
  },

  // ---------- Challenge ----------
  {
    n: 72, d: "Ch", c: ["net-signed-area", "area-geometry"],
    q: t`Evaluate $\displaystyle\int_0^{12}f(x)\,dx$ for the function graphed, using the formulas for areas of triangles and circles and subtracting the areas below the $x$-axis.`,
    figure: {
      xMin: -0.5, xMax: 12.5, yMin: -2.6, yMax: 3.4, aspect: "equal",
      curves: [
        { points: sample((x) => Math.sqrt(Math.max(0, 2 * x - x * x)), 0, 2, 48), shade: true },
        { points: [[2, 0], [4, -2], [6, 0]], shade: true },
        { points: sample((x) => Math.sqrt(Math.max(0, -72 + 18 * x - x * x)), 6, 12, 96), shade: true },
      ],
      xTicks: [0, 2, 4, 6, 8, 10, 12], yTicks: [-2, -1, 1, 2, 3],
      alt: "On [0, 2]: the top half of a circle with center (1, 0) and radius 1. On [2, 6]: a triangle below the x-axis with vertices (2, 0), (4, −2) and (6, 0). On [6, 12]: the top half of a circle with center (9, 0) and radius 3. All three regions are shaded.",
    },
    hints: [
      t`Find each piece's area separately: two half-disks above the axis and one triangle below it.`,
      t`Areas below the $x$-axis count as negative.`,
    ],
    a: t`$5\pi-4$`,
    steps: [
      ["Half-disk of radius 1", t`$\frac12\pi(1)^2=\frac{\pi}{2}$ (above the axis)`],
      ["Triangle below the axis", t`Base 4, depth 2: area $\frac12\cdot4\cdot2=4$, counted as $-4$.`],
      ["Half-disk of radius 3", t`$\frac12\pi(3)^2=\frac{9\pi}{2}$ (above the axis)`],
      ["Net signed area", t`$\frac{\pi}{2}-4+\frac{9\pi}{2}=5\pi-4\approx11.71$`],
    ],
    check: [
      { kind: "definite", f: "sqrt(2*x - x**2)", a: "0", b: "2", value: "pi/2" },
      { kind: "definite", f: "Abs(x - 4) - 2", a: "2", b: "6", value: "-4" },
      { kind: "definite", f: "sqrt(-72 + 18*x - x**2)", a: "6", b: "12", value: "9*pi/2" },
      { kind: "value", expr: "pi/2 - 4 + 9*pi/2", value: "5*pi - 4" },
    ],
  },
  {
    n: 97, d: "Ch", c: ["net-signed-area", "odd-symmetry"],
    q: t`Find the net signed area between $f(x)$ and the $x$-axis. (Hint: look at the graph of $f$.)
$$\int_2^4(x-3)^3\,dx$$`,
    hints: [t`The graph of $(x-3)^3$ is the graph of $x^3$ shifted right by 3. It is symmetric about the point $(3,0)$.`],
    a: t`$0$`,
    steps: [
      ["Symmetry", t`Shift $u=x-3$: the interval $[2,4]$ becomes $[-1,1]$ and the function becomes $u^3$, which is odd.`],
      ["Cancel", t`The area below the axis on $[2,3]$ exactly matches the area above it on $[3,4]$.`],
      ["Answer", t`Net signed area $=0$.`],
    ],
    check: { kind: "definite", f: "(x - 3)**3", a: "2", b: "4", value: "0" },
  },
  {
    n: 109, d: "Ch", c: ["comparison"],
    q: t`Use the comparison theorem to show that
$$\int_{-\pi/4}^{\pi/4}\cos t\,dt\ \ge\ \frac{\pi\sqrt2}{4}.$$`,
    hints: [
      t`What is the smallest value of $\cos t$ on $[-\frac{\pi}{4},\frac{\pi}{4}]$?`,
      t`If $f(t)\ge m$ on $[a,b]$, then $\int_a^bf(t)\,dt\ge m(b-a)$.`,
    ],
    a: t`On $[-\frac{\pi}{4},\frac{\pi}{4}]$, $\cos t\ge\frac{\sqrt2}{2}$, so the integral is at least $\frac{\sqrt2}{2}\cdot\frac{\pi}{2}=\frac{\pi\sqrt2}{4}$.`,
    steps: [
      ["Lower bound for the integrand", t`$\cos t$ is smallest at the endpoints $t=\pm\frac{\pi}{4}$, where it equals $\frac{\sqrt2}{2}$.`],
      ["Length of the interval", t`$\frac{\pi}{4}-\left(-\frac{\pi}{4}\right)=\frac{\pi}{2}$`],
      ["Comparison theorem", t`$\int_{-\pi/4}^{\pi/4}\cos t\,dt\ge\frac{\sqrt2}{2}\cdot\frac{\pi}{2}=\frac{\pi\sqrt2}{4}$. (The actual value is $\sqrt2\approx1.41$, which is indeed larger than $1.11$.)`],
    ],
    check: [
      { kind: "value", expr: "(sqrt(2)/2)*(pi/2)", value: "pi*sqrt(2)/4" },
      { kind: "definite", f: "cos(t)", a: "-pi/4", b: "pi/4", value: "sqrt(2)", var: "t" },
    ],
  },
  {
    n: 114, d: "Ch", c: ["average-value", "odd-symmetry"],
    q: t`Find the average value $f_{\text{ave}}$ of $f$ between $a$ and $b$, and find a point $c$ where $f(c)=f_{\text{ave}}$.
$$f(x)=\sin x,\qquad a=0,\ b=2\pi$$`,
    hints: [t`Compare the area under $\sin x$ on $[0,\pi]$ with the area on $[\pi,2\pi]$.`],
    a: t`$f_{\text{ave}}=0$, at $c=0$, $c=\pi$, or $c=2\pi$.`,
    steps: [
      ["Integral by symmetry", t`The hump above the axis on $[0,\pi]$ is mirrored by an equal hump below the axis on $[\pi,2\pi]$, so $\int_0^{2\pi}\sin x\,dx=0$.`],
      ["Average", t`$f_{\text{ave}}=\frac{1}{2\pi}\cdot0=0$`],
      ["Where sin c = 0", t`$\sin c=0$ at $c=0,\ \pi,\ 2\pi$ in the interval.`],
    ],
    check: [
      { kind: "definite", f: "sin(x)", a: "0", b: "2*pi", value: "0" },
      { kind: "value", expr: "sin(pi)", value: "0" },
    ],
  },
]);
