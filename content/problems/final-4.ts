import { sectionProblems, t } from "../helpers";

// Final Exam, Chapter 4 Review Exercises (OpenStax Calculus Volume 1), 525–541 and 543–552.
// Exercise 542 (the L'Hôpital's Rule item) is left out on purpose; the numbers are not changed.
// Statements follow the import specification; hints, answers and worked solutions are original to this site.

const TF = t`True or False? Justify your answer with a proof or a counterexample. Assume that $f(x)$ is continuous and differentiable unless stated otherwise.`;
const EXTREMA = t`Find the critical points and the local and absolute extrema of the function on the given interval.`;
const SHAPE = t`Determine over which intervals the function is increasing, decreasing, concave up, and concave down.`;
const LIMIT = t`Evaluate the limit.`;
const NEWTON = t`Use Newton's method to find the first two iterations, given the starting point.`;
const ANTI = t`Find the antiderivative $F(x)$ of the function.`;
const GRAPH = t`Graph the function by hand. Make sure to label the inflection points, critical points, zeros, and asymptotes.`;

export default sectionProblems("4", [
  // ---------- True or False ----------
  {
    n: 525, d: "F", c: ["derivative-facts"],
    q: TF + t`

If $f(-1)=-6$ and $f(1)=2$, then there exists at least one point $x\in[-1,1]$ such that $f'(x)=4$.`,
    hints: [t`Which theorem connects $f(b)-f(a)$ to a value of the derivative somewhere between $a$ and $b$?`],
    a: t`True, by the Mean Value Theorem: the average rate of change is $\dfrac{2-(-6)}{1-(-1)}=4$, so $f'(c)=4$ for some $c\in(-1,1)$.`,
    steps: [
      ["Hypotheses", t`$f$ is continuous on $[-1,1]$ and differentiable on $(-1,1)$ (assumed in the problem).`],
      ["Average rate of change", t`$\dfrac{f(1)-f(-1)}{1-(-1)}=\dfrac{2-(-6)}{2}=4$.`],
      ["Mean Value Theorem", t`There is a $c\in(-1,1)$ with $f'(c)=4$, so the statement is true.`],
    ],
    check: { kind: "value", expr: "(2 - (-6))/(1 - (-1))", value: "4" },
  },
  {
    n: 526, d: "F", c: ["derivative-facts"],
    q: TF + t`

If $f'(c)=0$, there is a maximum or minimum at $x=c$.`,
    hints: [t`Try $f(x)=x^3$ at $c=0$.`],
    a: t`False. $f(x)=x^3$ has $f'(0)=0$, but $f$ is increasing on both sides of $0$, so there is no maximum or minimum there.`,
    steps: [
      ["Critical points and extrema", t`$f'(c)=0$ makes $c$ a critical point, but an extremum also needs $f'$ to change sign there.`],
      ["A counterexample", t`$f(x)=x^3$: $f'(x)=3x^2$, so $f'(0)=0$.`],
      ["Check", t`$f'(x)=3x^2>0$ for $x\neq0$, so $f$ increases straight through $x=0$: $f(x)<0$ for $x<0$ and $f(x)>0$ for $x>0$. There is no maximum or minimum at $0$.`],
    ],
    check: { kind: "derivative", expr: "x**3", value: "3*x**2" },
  },
  {
    n: 527, d: "C", c: ["derivative-facts"],
    q: TF + t`

There is a function such that $f(x)<0$, $f'(x)>0$, and $f''(x)<0$. (A graphical "proof" is acceptable for this answer.)`,
    hints: [t`Picture a graph that stays below the $x$-axis, rises, and bends downward: it rises toward the axis but levels off.`],
    a: t`True. For example $f(x)=-e^{-x}$: $f(x)=-e^{-x}<0$, $f'(x)=e^{-x}>0$, and $f''(x)=-e^{-x}<0$ for all $x$.`,
    steps: [
      ["What the conditions mean", t`$f<0$: below the $x$-axis. $f'>0$: increasing. $f''<0$: concave down.`],
      ["Pick a function", t`$f(x)=-e^{-x}$ rises toward the $x$-axis and flattens out, always staying below it.`],
      ["Check the derivatives", t`$f'(x)=e^{-x}>0$ and $f''(x)=-e^{-x}<0$, while $f(x)=-e^{-x}<0$. So such a function exists.`],
    ],
    check: [
      { kind: "derivative", expr: "-exp(-x)", value: "exp(-x)" },
      { kind: "derivative", expr: "exp(-x)", value: "-exp(-x)" },
    ],
  },
  {
    n: 528, d: "F", c: ["derivative-facts"],
    q: TF + t`

There is a function such that there is both an inflection point and a critical point for some value $x=a$.`,
    hints: [t`Look again at $f(x)=x^3$ at $x=0$.`],
    a: t`True. For $f(x)=x^3$ at $a=0$: $f'(0)=0$, so $0$ is a critical point, and $f''(x)=6x$ changes sign at $0$, so $(0,0)$ is an inflection point.`,
    steps: [
      ["Critical point", t`$f'(x)=3x^2$, so $f'(0)=0$.`],
      ["Inflection point", t`$f''(x)=6x$ is negative for $x<0$ and positive for $x>0$, so the concavity changes at $x=0$.`],
      ["Conclusion", t`At $x=0$, $f(x)=x^3$ has both a critical point and an inflection point, so the statement is true.`],
    ],
    check: { kind: "derivative", expr: "3*x**2", value: "6*x" },
  },

  // ---------- Reading graphs ----------
  {
    n: 529, d: "C", c: ["graph-shape"],
    q: t`Given the graph of $f'$, determine where $f$ is increasing or decreasing.`,
    image: {
      src: "/figures/final/4-529.png",
      width: 652,
      height: 368,
      alt: "Graph of f prime. Coming up from the lower left near x = −3, the curve crosses the x-axis at x = −2, reaches a maximum near x = −1, and falls through the origin to a shallow minimum near x = 1. It rises to just touch the x-axis at x = 2, falls to a deep minimum near x = 3.5, and rises steeply, crossing the x-axis at x = 4.",
    },
    hints: [
      t`$f$ is increasing where $f'>0$ (the graph is above the $x$-axis) and decreasing where $f'<0$ (below it).`,
      t`At $x=2$ the graph of $f'$ only touches the axis. Does the sign of $f'$ change there?`,
    ],
    a: t`Increasing on $(-2,0)$ and $(4,\infty)$; decreasing on $(-\infty,-2)$ and $(0,4)$.`,
    steps: [
      ["Read the sign of f′", t`The graph of $f'$ is above the $x$-axis on $(-2,0)$ and for $x>4$, and below it for $x<-2$, on $(0,2)$, and on $(2,4)$.`],
      ["The touch at x = 2", t`$f'(2)=0$, but $f'$ is negative on both sides, so $f$ keeps decreasing through $x=2$: it decreases on all of $(0,4)$.`],
      ["Conclusion", t`$f$ increases on $(-2,0)$ and $(4,\infty)$ and decreases on $(-\infty,-2)$ and $(0,4)$. (So $f$ has local minima at $x=-2$ and $x=4$ and a local maximum at $x=0$.)`],
    ],
    check: { kind: "manual", note: "Read from the OpenStax graph of f' (Chapter 4 review, exercise 529)." },
  },
  {
    n: 530, d: "C", c: ["graph-shape"],
    q: t`The graph of $f$ is given below. Draw $f'$.`,
    image: {
      src: "/figures/final/4-530.png",
      width: 652,
      height: 431,
      alt: "Graph of f. The curve falls steeply from the upper left, crossing the x-axis near x = −2.5, to a deep local minimum at x = −2. It rises to a local maximum just above the x-axis near x = 0, then decreases slowly and almost levels off near x = 1, falls, crossing the x-axis near x = 2, to a local minimum at x = 3, and rises steeply, crossing the x-axis near x = 3.5.",
    },
    hints: [
      t`Mark where $f$ has a horizontal tangent (its peaks, valleys and flat spots): $f'=0$ there.`,
      t`Between those points $f'$ is positive where $f$ rises and negative where it falls; the steeper $f$ is, the larger $|f'|$.`,
    ],
    a: t`$f'$ is very negative on the far left, $0$ at $x=-2$, positive on $(-2,0)$ with a peak near $x=-1$, $0$ at $x=0$, slightly negative and back near $0$ around $x=1$ where $f$ levels off, most negative between $x=2$ and $x=2.5$, $0$ at $x=3$, and positive and rising steeply for $x>3$.`,
    steps: [
      ["Zeros of f′", t`$f$ has horizontal tangents at its local minimum $x=-2$, its local maximum $x=0$, and its local minimum $x=3$, and it almost levels off near $x=1$. So $f'=0$ at $x=-2$, $0$ and $3$, and $f'$ comes back up close to $0$ near $x=1$.`],
      ["Signs of f′", t`$f$ falls for $x<-2$, rises on $(-2,0)$, falls on $(0,3)$, and rises for $x>3$. So $f'<0$, then $f'>0$, then $f'<0$ (only just below $0$ near $x=1$), then $f'>0$.`],
      ["Sizes", t`$f$ is very steep at both ends, so $f'$ is very negative on the far left and very large on the far right. On $(-2,0)$, $f$ rises fastest near $x=-1$ (the peak of $f'$); on $(0,3)$ it falls fastest between $x=2$ and $x=2.5$ (the lowest point of $f'$).`],
      ["Sketch", t`Draw $f'$ crossing the axis upward at $x=-2$, peaking near $x=-1$, crossing downward at $x=0$, staying just below the axis to about $x=1$, dipping to its minimum near $x=2.3$, crossing upward at $x=3$, and rising steeply after that.`],
    ],
    check: { kind: "manual", note: "Sketch read from the OpenStax graph of f (Chapter 4 review, exercise 530)." },
  },

  // ---------- Linear approximation and differentials ----------
  {
    n: 531, d: "C", c: ["linear-approximation"],
    q: t`Find the linear approximation $L(x)$ to $y=x^2+\tan(\pi x)$ near $x=\frac14$.`,
    hints: [
      t`$L(x)=f(a)+f'(a)(x-a)$ with $a=\frac14$.`,
      t`$\dfrac{d}{dx}\tan(\pi x)=\pi\sec^2(\pi x)$, and $\sec^2\frac{\pi}{4}=2$.`,
    ],
    a: t`$L(x)=\dfrac{17}{16}+\left(\dfrac12+2\pi\right)\left(x-\dfrac14\right)$`,
    steps: [
      ["The value", t`$f\left(\frac14\right)=\frac1{16}+\tan\frac\pi4=\frac1{16}+1=\frac{17}{16}$.`],
      ["The slope", t`$f'(x)=2x+\pi\sec^2(\pi x)$, so $f'\left(\frac14\right)=\frac12+\pi\cdot2=\frac12+2\pi$.`],
      ["Linear approximation", t`$L(x)=\dfrac{17}{16}+\left(\dfrac12+2\pi\right)\left(x-\dfrac14\right)$`],
    ],
    check: [
      { kind: "derivative", expr: "x**2 + tan(pi*x)", value: "2*x + pi*sec(pi*x)**2" },
      { kind: "value", expr: "(1/4)**2 + tan(pi/4)", value: "17/16" },
      { kind: "value", expr: "2*(1/4) + pi*sec(pi/4)**2", value: "1/2 + 2*pi" },
    ],
  },
  {
    n: 532, d: "F", c: ["linear-approximation"],
    q: t`Find the differential of $y=x^2-5x-6$ and evaluate for $x=2$ with $dx=0.1$.`,
    hints: [t`$dy=f'(x)\,dx$.`],
    a: t`$dy=(2x-5)\,dx$; at $x=2$ with $dx=0.1$, $dy=-0.1$.`,
    steps: [
      ["Differential", t`$dy=\dfrac{dy}{dx}\,dx=(2x-5)\,dx$`],
      ["Evaluate", t`$dy=(2\cdot2-5)(0.1)=(-1)(0.1)=-0.1$`],
    ],
    check: [
      { kind: "derivative", expr: "x**2 - 5*x - 6", value: "2*x - 5" },
      { kind: "value", expr: "(2*2 - 5)*0.1", value: "-0.1" },
    ],
  },

  // ---------- Extrema ----------
  {
    n: 533, d: "C", c: ["extrema"],
    q: EXTREMA + t`
$$f(x)=x+\sin^2(x)\quad\text{over }[0,\pi]$$`,
    hints: [
      t`$f'(x)=1+2\sin x\cos x=1+\sin(2x)$. Where is it $0$ on $[0,\pi]$?`,
      t`Compare the values at the critical point and at both endpoints.`,
    ],
    a: t`Critical point $x=\frac{3\pi}{4}$, which is not a local extremum ($f'\ge0$, so $f$ never decreases). Absolute minimum $f(0)=0$; absolute maximum $f(\pi)=\pi$.`,
    steps: [
      ["Derivative", t`$f'(x)=1+2\sin x\cos x=1+\sin(2x)$.`],
      ["Critical points", t`$1+\sin(2x)=0$ means $\sin(2x)=-1$, so $2x=\frac{3\pi}{2}$ and $x=\frac{3\pi}{4}$ in $[0,\pi]$.`],
      ["Is it an extremum?", t`$f'(x)=1+\sin(2x)\ge0$ everywhere, so $f$ is increasing on $[0,\pi]$ and only levels off at $x=\frac{3\pi}{4}$: no local maximum or minimum there.`],
      ["Absolute extrema", t`$f(0)=0$, $f\left(\frac{3\pi}{4}\right)=\frac{3\pi}{4}+\frac12\approx2.86$, and $f(\pi)=\pi$. The absolute minimum is $0$ at $x=0$; the absolute maximum is $\pi$ at $x=\pi$.`],
    ],
    check: [
      { kind: "derivative", expr: "x + sin(x)**2", value: "1 + sin(2*x)" },
      { kind: "value", expr: "3*pi/4 + sin(3*pi/4)**2", value: "3*pi/4 + 1/2" },
    ],
  },
  {
    n: 534, d: "C", c: ["extrema"],
    q: EXTREMA + t`
$$f(x)=3x^4-4x^3-12x^2+6\quad\text{over }[-3,3]$$`,
    hints: [
      t`$f'(x)=12x^3-12x^2-24x=12x(x-2)(x+1)$.`,
      t`Evaluate $f$ at the critical points and at the endpoints $x=-3$ and $x=3$.`,
    ],
    a: t`Critical points $x=-1,0,2$. Local minima $f(-1)=1$ and $f(2)=-26$; local maximum $f(0)=6$. Absolute maximum $f(-3)=249$; absolute minimum $f(2)=-26$.`,
    steps: [
      ["Derivative", t`$f'(x)=12x^3-12x^2-24x=12x\left(x^2-x-2\right)=12x(x-2)(x+1)$.`],
      ["Critical points", t`$f'(x)=0$ at $x=-1$, $0$ and $2$, all inside $[-3,3]$.`],
      ["Local extrema", t`$f'$ changes from $-$ to $+$ at $x=-1$ and $x=2$ (local minima) and from $+$ to $-$ at $x=0$ (local maximum). $f(-1)=1$, $f(0)=6$, $f(2)=-26$.`],
      ["Absolute extrema", t`At the endpoints, $f(-3)=243+108-108+6=249$ and $f(3)=243-108-108+6=33$. The largest value is $249$ at $x=-3$; the smallest is $-26$ at $x=2$.`],
    ],
    check: [
      { kind: "derivative", expr: "3*x**4 - 4*x**3 - 12*x**2 + 6", value: "12*x*(x - 2)*(x + 1)" },
      { kind: "value", expr: "3*(-3)**4 - 4*(-3)**3 - 12*(-3)**2 + 6", value: "249" },
      { kind: "value", expr: "3*2**4 - 4*2**3 - 12*2**2 + 6", value: "-26" },
    ],
  },

  // ---------- Increasing, decreasing and concavity ----------
  {
    n: 535, d: "C", c: ["graph-shape"],
    q: SHAPE + t`
$$x(t)=3t^4-8t^3-18t^2$$`,
    hints: [
      t`$x'(t)=12t(t-3)(t+1)$: make a sign chart with breaks at $t=-1,0,3$.`,
      t`$x''(t)=36t^2-48t-36=12\left(3t^2-4t-3\right)$, whose zeros are $t=\frac{2\pm\sqrt{13}}{3}$.`,
    ],
    a: t`Increasing on $(-1,0)$ and $(3,\infty)$; decreasing on $(-\infty,-1)$ and $(0,3)$. Concave up on $\left(-\infty,\frac{2-\sqrt{13}}{3}\right)$ and $\left(\frac{2+\sqrt{13}}{3},\infty\right)$; concave down on $\left(\frac{2-\sqrt{13}}{3},\frac{2+\sqrt{13}}{3}\right)$.`,
    steps: [
      ["First derivative", t`$x'(t)=12t^3-24t^2-36t=12t\left(t^2-2t-3\right)=12t(t-3)(t+1)$.`],
      ["Increasing and decreasing", t`The sign of $x'$ is negative on $(-\infty,-1)$, positive on $(-1,0)$, negative on $(0,3)$, and positive on $(3,\infty)$.`],
      ["Second derivative", t`$x''(t)=36t^2-48t-36=12\left(3t^2-4t-3\right)$, which is $0$ at $t=\frac{4\pm\sqrt{16+36}}{6}=\frac{2\pm\sqrt{13}}{3}$ (about $-0.54$ and $1.87$).`],
      ["Concavity", t`$x''>0$ outside these roots (concave up) and $x''<0$ between them (concave down).`],
    ],
    check: [
      { kind: "derivative", expr: "3*t**4 - 8*t**3 - 18*t**2", value: "12*t*(t - 3)*(t + 1)", var: "t" },
      { kind: "derivative", expr: "12*t**3 - 24*t**2 - 36*t", value: "12*(3*t**2 - 4*t - 3)", var: "t" },
    ],
  },
  {
    n: 536, d: "Ch", c: ["graph-shape"],
    q: SHAPE + t`
$$y=x+\sin(\pi x)$$`,
    hints: [
      t`$y'=1+\pi\cos(\pi x)$ is negative only where $\cos(\pi x)<-\frac1\pi$.`,
      t`$y''=-\pi^2\sin(\pi x)$, and the sign of $\sin(\pi x)$ repeats every $2$ units.`,
    ],
    a: t`With $a=\frac1\pi\arccos\left(-\frac1\pi\right)\approx0.603$ and any integer $k$: increasing on $(2k-a,\,2k+a)$ and decreasing on $(2k+a,\,2k+2-a)$, about $(2k+0.603,\,2k+1.397)$. Concave up on $(2k-1,\,2k)$; concave down on $(2k,\,2k+1)$.`,
    steps: [
      ["First derivative", t`$y'=1+\pi\cos(\pi x)$, which is negative exactly when $\cos(\pi x)<-\frac1\pi$.`],
      ["Where y′ = 0", t`$\cos(\pi x)=-\frac1\pi$ when $\pi x=\pm\arccos\left(-\frac1\pi\right)+2\pi k$, so $x=\pm a+2k$ with $a=\frac1\pi\arccos\left(-\frac1\pi\right)\approx0.603$.`],
      ["Increasing and decreasing", t`In one period, $y'>0$ on $(-a,a)$ and $y'<0$ on $(a,2-a)\approx(0.603,1.397)$. Shift by $2k$ for the other periods.`],
      ["Concavity", t`$y''=-\pi^2\sin(\pi x)$ is positive where $\sin(\pi x)<0$, on $(2k-1,2k)$ (concave up), and negative on $(2k,2k+1)$ (concave down).`],
    ],
    check: [
      { kind: "derivative", expr: "x + sin(pi*x)", value: "1 + pi*cos(pi*x)" },
      { kind: "value", expr: "1 + pi*cos(pi*(acos(-1/pi)/pi))", value: "0" },
    ],
  },
  {
    n: 537, d: "C", c: ["graph-shape"],
    q: SHAPE + t`
$$g(x)=x-\sqrt{x}$$`,
    hints: [
      t`The domain is $x\ge0$. $g'(x)=1-\dfrac{1}{2\sqrt x}$ is $0$ at $x=\frac14$.`,
      t`$g''(x)=\dfrac{1}{4x^{3/2}}$.`,
    ],
    a: t`Decreasing on $\left(0,\frac14\right)$ and increasing on $\left(\frac14,\infty\right)$; concave up on $(0,\infty)$ and never concave down.`,
    steps: [
      ["Domain and derivative", t`$g$ is defined for $x\ge0$, and $g'(x)=1-\dfrac{1}{2\sqrt x}$ for $x>0$.`],
      ["Increasing and decreasing", t`$g'(x)<0$ when $2\sqrt x<1$, that is $0<x<\frac14$, and $g'(x)>0$ for $x>\frac14$.`],
      ["Concavity", t`$g''(x)=\dfrac{1}{4x^{3/2}}>0$ for all $x>0$, so $g$ is concave up on $(0,\infty)$ and never concave down.`],
    ],
    check: [
      { kind: "derivative", expr: "x - sqrt(x)", value: "1 - 1/(2*sqrt(x))" },
      { kind: "derivative", expr: "1 - 1/(2*sqrt(x))", value: "1/(4*x**(3/2))" },
    ],
  },
  {
    n: 538, d: "C", c: ["graph-shape"],
    q: SHAPE + t`
$$f(\theta)=\sin(3\theta)$$`,
    hints: [t`$f'(\theta)=3\cos(3\theta)$ and $f''(\theta)=-9\sin(3\theta)$; both repeat every $\frac{2\pi}{3}$.`],
    a: t`For any integer $k$: increasing on $\left(-\frac\pi6+\frac{2\pi k}{3},\ \frac\pi6+\frac{2\pi k}{3}\right)$ and decreasing on $\left(\frac\pi6+\frac{2\pi k}{3},\ \frac\pi2+\frac{2\pi k}{3}\right)$; concave down on $\left(\frac{2\pi k}{3},\ \frac\pi3+\frac{2\pi k}{3}\right)$ and concave up on $\left(\frac\pi3+\frac{2\pi k}{3},\ \frac{2\pi}3+\frac{2\pi k}{3}\right)$.`,
    steps: [
      ["Increasing", t`$f'(\theta)=3\cos(3\theta)>0$ when $-\frac\pi2<3\theta<\frac\pi2$, that is $-\frac\pi6<\theta<\frac\pi6$, plus multiples of $\frac{2\pi}3$.`],
      ["Decreasing", t`$\cos(3\theta)<0$ when $\frac\pi2<3\theta<\frac{3\pi}2$, that is $\frac\pi6<\theta<\frac\pi2$, plus multiples of $\frac{2\pi}3$.`],
      ["Concavity", t`$f''(\theta)=-9\sin(3\theta)$. Since $\sin(3\theta)>0$ for $0<3\theta<\pi$, $f$ is concave down on $\left(0,\frac\pi3\right)$; since $\sin(3\theta)<0$ for $\pi<3\theta<2\pi$, it is concave up on $\left(\frac\pi3,\frac{2\pi}3\right)$. Both repeat every $\frac{2\pi}3$.`],
    ],
    check: [
      { kind: "derivative", expr: "sin(3*theta)", value: "3*cos(3*theta)", var: "theta" },
      { kind: "derivative", expr: "3*cos(3*theta)", value: "-9*sin(3*theta)", var: "theta" },
    ],
  },

  // ---------- Limits ----------
  {
    n: 539, d: "C", c: ["limits"],
    q: LIMIT + t`
$$\lim_{x\to\infty}\frac{3x\sqrt{x^2+1}}{\sqrt{x^4-1}}$$`,
    hints: [t`For $x>0$, $\sqrt{x^2+1}=x\sqrt{1+\frac1{x^2}}$ and $\sqrt{x^4-1}=x^2\sqrt{1-\frac1{x^4}}$. Then cancel $x^2$.`],
    a: t`$3$`,
    steps: [
      ["Factor out the leading powers", t`For $x>0$: $3x\sqrt{x^2+1}=3x^2\sqrt{1+\frac1{x^2}}$ and $\sqrt{x^4-1}=x^2\sqrt{1-\frac1{x^4}}$.`],
      ["Cancel x²", t`$\dfrac{3x\sqrt{x^2+1}}{\sqrt{x^4-1}}=\dfrac{3\sqrt{1+\frac1{x^2}}}{\sqrt{1-\frac1{x^4}}}$`],
      ["Take the limit", t`As $x\to\infty$, $\frac1{x^2}\to0$ and $\frac1{x^4}\to0$, so the limit is $\dfrac{3\cdot1}{1}=3$.`],
    ],
    check: { kind: "value", expr: "limit(3*x*sqrt(x**2 + 1)/sqrt(x**4 - 1), x, oo)", value: "3" },
  },
  {
    n: 540, d: "F", c: ["limits"],
    q: LIMIT + t`
$$\lim_{x\to\infty}\cos\left(\frac1x\right)$$`,
    hints: [t`What does $\frac1x$ approach? Cosine is continuous.`],
    a: t`$1$`,
    steps: [
      ["Inside first", t`$\frac1x\to0$ as $x\to\infty$.`],
      ["Continuity of cosine", t`$\lim_{x\to\infty}\cos\left(\frac1x\right)=\cos\left(\lim_{x\to\infty}\frac1x\right)=\cos0=1$`],
    ],
    check: { kind: "value", expr: "limit(cos(1/x), x, oo)", value: "1" },
  },
  {
    n: 541, d: "C", c: ["limits"],
    q: LIMIT + t`
$$\lim_{x\to1}\frac{x-1}{\sin(\pi x)}$$`,
    hints: [
      t`Substitute $u=x-1$, so $x=1+u$ and $u\to0$. Use $\sin(\pi+\pi u)=-\sin(\pi u)$.`,
      t`Then use $\lim_{\theta\to0}\dfrac{\sin\theta}{\theta}=1$.`,
    ],
    a: t`$-\dfrac1\pi$`,
    steps: [
      ["Indeterminate form", t`At $x=1$ the expression is $\dfrac{0}{\sin\pi}=\dfrac00$.`],
      ["Substitute u = x − 1", t`$\sin(\pi x)=\sin(\pi+\pi u)=-\sin(\pi u)$, so the expression is $\dfrac{u}{-\sin(\pi u)}$ with $u\to0$.`],
      ["Use the special limit", t`$\dfrac{u}{-\sin(\pi u)}=-\dfrac1\pi\cdot\dfrac{\pi u}{\sin(\pi u)}\to-\dfrac1\pi\cdot1=-\dfrac1\pi$`],
    ],
    check: { kind: "value", expr: "limit((x - 1)/sin(pi*x), x, 1)", value: "-1/pi" },
  },

  // ---------- Newton's method ----------
  {
    n: 543, d: "C", c: ["newtons-method"],
    q: NEWTON + t`
$$y=x^3+1,\quad x_0=0.5$$`,
    hints: [t`$x_{n+1}=x_n-\dfrac{f(x_n)}{f'(x_n)}$ with $f(x)=x^3+1$ and $f'(x)=3x^2$.`],
    a: t`$x_1=-1$ and $x_2=-1$. Newton's method lands on the exact root $x=-1$.`,
    steps: [
      ["Set up", t`$f(x)=x^3+1$, $f'(x)=3x^2$, and $x_{n+1}=x_n-\dfrac{x_n^3+1}{3x_n^2}$.`],
      ["First iteration", t`$x_1=0.5-\dfrac{0.125+1}{0.75}=0.5-1.5=-1$`],
      ["Second iteration", t`$x_2=-1-\dfrac{(-1)^3+1}{3(-1)^2}=-1-0=-1$. Since $f(-1)=0$, $x=-1$ is the root.`],
    ],
    check: [
      { kind: "value", expr: "0.5 - (0.5**3 + 1)/(3*0.5**2)", value: "-1" },
      { kind: "value", expr: "-1 - ((-1)**3 + 1)/(3*(-1)**2)", value: "-1" },
    ],
  },
  {
    n: 544, d: "C", c: ["newtons-method"],
    q: NEWTON + t`
$$y=\frac{1}{x+1}=\frac12,\quad x_0=0$$`,
    hints: [t`Read it as solving $\dfrac{1}{x+1}=\dfrac12$: apply Newton's method to $f(x)=\dfrac{1}{x+1}-\dfrac12$, with $f'(x)=-\dfrac{1}{(x+1)^2}$.`],
    a: t`$x_1=0.5$ and $x_2=0.875$ (the exact solution is $x=1$).`,
    steps: [
      ["Set up", t`To solve $\frac{1}{x+1}=\frac12$, find the zero of $f(x)=\frac{1}{x+1}-\frac12$. Its derivative is $f'(x)=-\frac{1}{(x+1)^2}$.`],
      ["First iteration", t`$f(0)=1-\frac12=\frac12$ and $f'(0)=-1$, so $x_1=0-\dfrac{1/2}{-1}=0.5$.`],
      ["Second iteration", t`$f(0.5)=\frac{1}{1.5}-\frac12=\frac16$ and $f'(0.5)=-\frac{1}{2.25}=-\frac49$, so $x_2=0.5-\dfrac{1/6}{-4/9}=0.5+\dfrac38=0.875$.`],
      ["Check", t`The exact solution is $x=1$ (since $\frac{1}{1+1}=\frac12$); the iterates $0,\ 0.5,\ 0.875$ are approaching it.`],
    ],
    check: [
      { kind: "value", expr: "0 - (1/(0 + 1) - 1/2)/(-1/(0 + 1)**2)", value: "1/2" },
      { kind: "value", expr: "1/2 - (1/(1/2 + 1) - 1/2)/(-1/(1/2 + 1)**2)", value: "7/8" },
    ],
  },

  // ---------- Antiderivatives ----------
  {
    n: 545, d: "F", c: ["antiderivatives"],
    q: ANTI + t`
$$g(x)=\sqrt{x}-\frac{1}{x^2}$$`,
    hints: [t`Rewrite as powers, $x^{1/2}-x^{-2}$, then use the power rule for antiderivatives.`],
    a: t`$\dfrac23x^{3/2}+\dfrac1x+C$`,
    steps: [
      ["Rewrite", t`$g(x)=x^{1/2}-x^{-2}$`],
      ["Power rule", t`An antiderivative of $x^{1/2}$ is $\frac{x^{3/2}}{3/2}=\frac23x^{3/2}$, and of $x^{-2}$ is $\frac{x^{-1}}{-1}=-\frac1x$.`],
      ["Combine", t`$\frac23x^{3/2}-\left(-\frac1x\right)+C=\frac23x^{3/2}+\frac1x+C$`],
    ],
    check: { kind: "antiderivative", f: "sqrt(x) - 1/x**2", F: "2*x**(3/2)/3 + 1/x" },
  },
  {
    n: 546, d: "C", c: ["antiderivatives"],
    q: ANTI + t`
$$f(x)=2x+6\cos x,\quad F(\pi)=\pi^2+2$$`,
    hints: [t`Find the general antiderivative, then use $F(\pi)=\pi^2+2$ to find $C$. Remember $\sin\pi=0$.`],
    a: t`$F(x)=x^2+6\sin x+2$`,
    steps: [
      ["General antiderivative", t`$F(x)=x^2+6\sin x+C$`],
      ["Use the condition", t`$F(\pi)=\pi^2+6\sin\pi+C=\pi^2+C$. Setting this equal to $\pi^2+2$ gives $C=2$.`],
      ["Answer", t`$F(x)=x^2+6\sin x+2$`],
    ],
    check: { kind: "ivp", df: "2*x + 6*cos(x)", F: "x**2 + 6*sin(x) + 2", x0: "pi", y0: "pi**2 + 2" },
  },

  // ---------- Graphing by hand ----------
  {
    n: 547, d: "Ch", c: ["curve-sketching"],
    q: GRAPH + t`
$$y=\frac{1}{x(x+1)^2}$$`,
    hints: [
      t`Asymptotes: where is the denominator $0$, and what happens as $x\to\pm\infty$?`,
      t`$y'=-\dfrac{3x+1}{x^2(x+1)^3}$ and $y''=\dfrac{2\left(6x^2+4x+1\right)}{x^3(x+1)^4}$.`,
    ],
    a: t`No zeros. Vertical asymptotes $x=-1$ and $x=0$; horizontal asymptote $y=0$. One critical point, a local maximum at $\left(-\frac13,-\frac{27}{4}\right)$. Decreasing on $(-\infty,-1)$, $\left(-\frac13,0\right)$ and $(0,\infty)$; increasing on $\left(-1,-\frac13\right)$. Concave down for $x<0$ (with $x\neq-1$), concave up for $x>0$; no inflection points.`,
    steps: [
      ["Domain, zeros, asymptotes", t`The domain is $x\neq0,-1$. The numerator is $1$, so there are no zeros. There are vertical asymptotes at $x=0$ and $x=-1$, and $y\to0$ as $x\to\pm\infty$, so $y=0$ is a horizontal asymptote.`],
      ["First derivative", t`With $y=\left(x^3+2x^2+x\right)^{-1}$: $y'=-\dfrac{3x^2+4x+1}{\left(x(x+1)^2\right)^2}=-\dfrac{(3x+1)(x+1)}{x^2(x+1)^4}=-\dfrac{3x+1}{x^2(x+1)^3}$.`],
      ["Increasing and decreasing", t`$y'=0$ at $x=-\frac13$. $y'$ is negative on $(-\infty,-1)$, positive on $\left(-1,-\frac13\right)$, and negative on $\left(-\frac13,0\right)$ and $(0,\infty)$. So $x=-\frac13$ is a local maximum, with $y=\dfrac{1}{\left(-\frac13\right)\left(\frac23\right)^2}=-\dfrac{27}{4}$.`],
      ["Concavity", t`$y''=\dfrac{2\left(6x^2+4x+1\right)}{x^3(x+1)^4}$. Since $6x^2+4x+1>0$ always (negative discriminant) and $(x+1)^4>0$, $y''$ has the sign of $x^3$: concave down for $x<0$, concave up for $x>0$. The concavity changes only at $x=0$, which is not in the domain, so there is no inflection point.`],
      ["Sketch", t`Left of $x=-1$: below the axis, falling from near $0$ toward $-\infty$. Between $-1$ and $0$: rising from $-\infty$ to the peak $\left(-\frac13,-\frac{27}4\right)$, then falling back to $-\infty$. Right of $0$: coming down from $+\infty$ toward $0$, concave up.`],
    ],
    check: [
      { kind: "derivative", expr: "1/(x*(x + 1)**2)", value: "-(3*x + 1)/(x**2*(x + 1)**3)" },
      { kind: "derivative", expr: "-(3*x + 1)/(x**2*(x + 1)**3)", value: "2*(6*x**2 + 4*x + 1)/(x**3*(x + 1)**4)" },
    ],
  },
  {
    n: 548, d: "Ch", c: ["curve-sketching"],
    q: GRAPH + t`
$$y=x-\sqrt{4-x^2}$$`,
    hints: [
      t`The domain is $[-2,2]$. Solve $y'=1+\dfrac{x}{\sqrt{4-x^2}}=0$; it forces $x<0$.`,
      t`$y''=\dfrac{4}{\left(4-x^2\right)^{3/2}}$.`,
    ],
    a: t`Domain $[-2,2]$, from $(-2,-2)$ to $(2,2)$. Zero at $x=\sqrt2$. Critical point $x=-\sqrt2$, the minimum $\left(-\sqrt2,-2\sqrt2\right)$. Decreasing on $\left(-2,-\sqrt2\right)$, increasing on $\left(-\sqrt2,2\right)$. Concave up on $(-2,2)$, with no inflection points and no asymptotes (vertical tangents at $x=\pm2$).`,
    steps: [
      ["Domain and zeros", t`$4-x^2\ge0$ gives $[-2,2]$. $y=0$ when $x=\sqrt{4-x^2}$, which needs $x\ge0$ and $x^2=4-x^2$, so $x=\sqrt2$.`],
      ["Critical point", t`$y'=1+\dfrac{x}{\sqrt{4-x^2}}=0$ means $x=-\sqrt{4-x^2}$, so $x<0$ and $x^2=2$: $x=-\sqrt2$, where $y=-\sqrt2-\sqrt2=-2\sqrt2$.`],
      ["Increasing and decreasing", t`$y'<0$ on $\left(-2,-\sqrt2\right)$ and $y'>0$ on $\left(-\sqrt2,2\right)$, so $\left(-\sqrt2,-2\sqrt2\right)$ is the minimum. The endpoints are $(-2,-2)$ and $(2,2)$.`],
      ["Concavity", t`$y''=\dfrac{\sqrt{4-x^2}+\frac{x^2}{\sqrt{4-x^2}}}{4-x^2}=\dfrac{4}{\left(4-x^2\right)^{3/2}}>0$, so the graph is concave up on $(-2,2)$, with no inflection points.`],
      ["Asymptotes", t`None: the domain is a closed interval. As $x\to\pm2$, $|y'|\to\infty$, so the graph has vertical tangents at the endpoints.`],
    ],
    check: [
      { kind: "derivative", expr: "x - sqrt(4 - x**2)", value: "1 + x/sqrt(4 - x**2)" },
      { kind: "derivative", expr: "1 + x/sqrt(4 - x**2)", value: "4/(4 - x**2)**(3/2)" },
    ],
  },

  // ---------- Related rates and optimization ----------
  {
    n: 549, d: "Ch", c: ["related-rates"],
    q: t`A car is being compacted into a rectangular solid. The volume is decreasing at a rate of 2 m$^3$/sec. The length and width of the compactor are square, but the height is not the same length as the length and width. If the length and width walls move toward each other at a rate of 0.25 m/sec, find the rate at which the height is changing when the length and width are 2 m and the height is 1.5 m.`,
    hints: [
      t`Let $s$ be the side of the square base and $h$ the height, so $V=s^2h$. Differentiate with respect to $t$ using the product rule.`,
      t`Use $\frac{dV}{dt}=-2$ and $\frac{ds}{dt}=-0.25$ (both are decreasing).`,
    ],
    a: t`$\dfrac{dh}{dt}=-0.125$ m/sec: the height is decreasing at $0.125$ m/sec.`,
    steps: [
      ["Set up", t`Square base side $s$ and height $h$, so $V=s^2h$. We know $\frac{dV}{dt}=-2$ m$^3$/s and $\frac{ds}{dt}=-0.25$ m/s, and we want $\frac{dh}{dt}$ when $s=2$ and $h=1.5$.`],
      ["Differentiate", t`$\dfrac{dV}{dt}=2sh\dfrac{ds}{dt}+s^2\dfrac{dh}{dt}$`],
      ["Substitute", t`$-2=2(2)(1.5)(-0.25)+4\dfrac{dh}{dt}=-1.5+4\dfrac{dh}{dt}$`],
      ["Solve", t`$4\dfrac{dh}{dt}=-0.5$, so $\dfrac{dh}{dt}=-0.125$ m/s. The height is decreasing at $0.125$ m/s.`],
    ],
    check: { kind: "value", expr: "(-2 - 2*2*1.5*(-0.25))/2**2", value: "-0.125" },
  },
  {
    n: 550, d: "Ch", c: ["related-rates"],
    q: t`A rocket is launched into space; its kinetic energy is given by $K(t)=\left(\frac12\right)m(t)v(t)^2$, where $K$ is the kinetic energy in joules, $m$ is the mass of the rocket in kilograms, and $v$ is the velocity of the rocket in meters/second. Assume the velocity is increasing at a rate of 15 m/sec$^2$ and the mass is decreasing at a rate of 10 kg/sec because the fuel is being burned. At what rate is the rocket's kinetic energy changing when the mass is 2000 kg and the velocity is 5000 m/sec? Give your answer in mega-Joules per second (MJ/s), which is equivalent to $10^6$ J/s.`,
    hints: [t`Differentiate $K=\frac12mv^2$ with the product rule: $\dfrac{dK}{dt}=\dfrac12\dfrac{dm}{dt}v^2+mv\dfrac{dv}{dt}$.`],
    a: t`$\dfrac{dK}{dt}=25{,}000{,}000$ J/s $=25$ MJ/s, so the kinetic energy is increasing at 25 MJ/s.`,
    steps: [
      ["Differentiate", t`$\dfrac{dK}{dt}=\dfrac12\dfrac{dm}{dt}v^2+mv\dfrac{dv}{dt}$`],
      ["Substitute", t`With $\frac{dm}{dt}=-10$, $v=5000$, $m=2000$ and $\frac{dv}{dt}=15$: $\frac12(-10)(5000)^2+(2000)(5000)(15)$.`],
      ["Compute", t`$-125{,}000{,}000+150{,}000{,}000=25{,}000{,}000$ J/s, which is $25$ MJ/s.`],
    ],
    check: { kind: "value", expr: "(1/2)*(-10)*5000**2 + 2000*5000*15", value: "25000000" },
  },
  {
    n: 551, d: "Ch", c: ["optimization"],
    q: t`The famous Regiomontanus' problem for angle maximization was proposed during the 15th century. A painting hangs on a wall with the bottom of the painting a distance $a$ feet above eye level, and the top $b$ feet above eye level. What distance $x$ (in feet) from the wall should the viewer stand to maximize the angle subtended by the painting, $\theta$?`,
    image: {
      src: "/figures/final/4-551.png",
      width: 624,
      height: 332,
      alt: "Diagram: the viewer's eye is at eye level, a horizontal distance x from the wall. The bottom of the picture is a feet above eye level and the top is b feet above eye level. One sight line runs from the eye to the bottom of the picture and another to the top; theta is the angle between them.",
    },
    hints: [
      t`From the figure, $\theta=\arctan\dfrac{b}{x}-\arctan\dfrac{a}{x}$.`,
      t`Set $\dfrac{d\theta}{dx}=0$ and solve for $x$.`,
    ],
    a: t`$x=\sqrt{ab}$ feet`,
    steps: [
      ["Write the angle", t`The sight line to the top makes the angle $\arctan\frac bx$ with eye level, and the line to the bottom makes $\arctan\frac ax$. So $\theta(x)=\arctan\frac bx-\arctan\frac ax$ for $x>0$.`],
      ["Differentiate", t`$\dfrac{d}{dx}\arctan\dfrac cx=\dfrac{1}{1+c^2/x^2}\cdot\left(-\dfrac{c}{x^2}\right)=-\dfrac{c}{x^2+c^2}$, so $\theta'(x)=\dfrac{a}{x^2+a^2}-\dfrac{b}{x^2+b^2}$.`],
      ["Solve θ′(x) = 0", t`$\dfrac{a}{x^2+a^2}=\dfrac{b}{x^2+b^2}$ gives $ax^2+ab^2=bx^2+a^2b$, so $(a-b)x^2=ab(a-b)$ and, since $a\neq b$, $x^2=ab$.`],
      ["Check it's the maximum", t`$\theta\to0$ as $x\to0^+$ and as $x\to\infty$, and $\theta>0$ in between, so the only critical point, $x=\sqrt{ab}$, gives the largest angle.`],
    ],
    check: [
      { kind: "derivative", expr: "atan(b/x) - atan(a/x)", value: "a/(x**2 + a**2) - b/(x**2 + b**2)" },
      { kind: "value", expr: "a/(a*b + a**2) - b/(a*b + b**2)", value: "0" },
    ],
  },
  {
    n: 552, d: "Ch", c: ["optimization"],
    q: t`An airline sells tickets from Tokyo to Detroit for \$1200. There are 500 seats available and a typical flight books 350 seats. For every \$10 decrease in price, the airline observes an additional five seats sold. What should the fare be to maximize profit? How many passengers would be onboard?`,
    hints: [
      t`Let $n$ be the number of \$10 decreases. Then the price is $1200-10n$ dollars and $350+5n$ passengers fly (at most 500).`,
      t`Maximize the revenue $R(n)=(1200-10n)(350+5n)$. No costs are given, so profit here is the revenue.`,
    ],
    a: t`A fare of \$950, with 475 passengers onboard (revenue \$451,250).`,
    steps: [
      ["Model", t`After $n$ decreases of \$10, the price is $1200-10n$ dollars and $350+5n$ passengers fly. The 500 seats allow $n\le30$.`],
      ["Revenue", t`$R(n)=(1200-10n)(350+5n)=420{,}000+2500n-50n^2$. No costs are given, so maximizing profit means maximizing $R$.`],
      ["Maximize", t`$R'(n)=2500-100n=0$ at $n=25$, and $R''(n)=-100<0$, so this is a maximum. $n=25\le30$ fits the seats.`],
      ["Answer", t`The fare is $1200-250=950$ dollars, with $350+125=475$ passengers, for a revenue of $950\cdot475=451{,}250$ dollars.`],
    ],
    check: [
      { kind: "derivative", expr: "(1200 - 10*x)*(350 + 5*x)", value: "2500 - 100*x" },
      { kind: "value", expr: "(1200 - 10*25)*(350 + 5*25)", value: "451250" },
    ],
  },
]);
