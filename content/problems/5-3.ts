import { sectionProblems, t } from "../helpers";

const FTC1 = t`Use the Fundamental Theorem of Calculus, Part 1, to find the derivative.`;
const FTC2 = t`Evaluate the definite integral using the Fundamental Theorem of Calculus, Part 2.`;

export default sectionProblems("5.3", [
  // ---------- Foundation ----------
  {
    n: 148, d: "F", c: ["ftc1"],
    q: FTC1 + t`
$$\frac{d}{dx}\int_1^x e^{-t^2}\,dt$$`,
    hints: [t`FTC Part 1: if $F(x)=\int_a^x f(t)\,dt$ with $f$ continuous, then $F'(x)=f(x)$.`],
    a: t`$e^{-x^2}$`,
    steps: [
      ["Check the form", t`The lower limit is a constant and the upper limit is just $x$.`],
      ["Apply FTC Part 1", t`Replace $t$ with $x$ in the integrand: $\frac{d}{dx}\int_1^x e^{-t^2}\,dt=e^{-x^2}$.`],
    ],
    check: { kind: "derivative", expr: "Integral(exp(-t**2), (t, 1, x))", value: "exp(-x**2)" },
  },
  {
    n: 150, d: "F", c: ["ftc1"],
    q: FTC1 + t`
$$\frac{d}{dx}\int_3^x\sqrt{9-y^2}\,dy$$`,
    hints: [t`The variable of integration ($y$) does not matter. The upper limit is $x$.`],
    a: t`$\sqrt{9-x^2}$`,
    steps: [
      ["Check the form", t`Constant lower limit, upper limit $x$.`],
      ["Apply FTC Part 1", t`$\frac{d}{dx}\int_3^x\sqrt{9-y^2}\,dy=\sqrt{9-x^2}$`],
    ],
    check: { kind: "derivative", expr: "Integral(sqrt(9 - y**2), (y, 3, x))", value: "sqrt(9 - x**2)" },
  },
  {
    n: 170, d: "F", c: ["ftc2"],
    q: FTC2 + t`
$$\int_{-1}^{2}\left(x^2-3x\right)dx$$`,
    hints: [t`An antiderivative is $F(x)=\frac{x^3}{3}-\frac{3x^2}{2}$. Compute $F(2)-F(-1)$.`],
    a: t`$-\dfrac32$`,
    steps: [
      ["Antiderivative", t`$F(x)=\frac{x^3}{3}-\frac{3x^2}{2}$`],
      ["Evaluate at the limits", t`$F(2)=\frac83-6=-\frac{10}{3}$ and $F(-1)=-\frac13-\frac32=-\frac{11}{6}$`],
      ["Subtract", t`$-\frac{10}{3}-\left(-\frac{11}{6}\right)=-\frac{20}{6}+\frac{11}{6}=-\frac32$`],
    ],
    check: { kind: "definite", f: "x**2 - 3*x", a: "-1", b: "2", value: "-3/2" },
  },
  {
    n: 174, d: "F", c: ["ftc2"],
    q: FTC2 + t`
$$\int_1^2x^9\,dx$$`,
    hints: [t`An antiderivative of $x^9$ is $\frac{x^{10}}{10}$.`],
    a: t`$\dfrac{1023}{10}=102.3$`,
    steps: [
      ["Antiderivative", t`$F(x)=\frac{x^{10}}{10}$`],
      ["Evaluate", t`$F(2)-F(1)=\frac{1024}{10}-\frac{1}{10}=\frac{1023}{10}$`],
    ],
    check: { kind: "definite", f: "x**9", a: "1", b: "2", value: "1023/10" },
  },
  {
    n: 179, d: "F", c: ["ftc2"],
    q: FTC2 + t`
$$\int_1^4\frac{1}{2\sqrt{x}}\,dx$$`,
    hints: [t`What is the derivative of $\sqrt{x}$?`],
    a: t`$1$`,
    steps: [
      ["Antiderivative", t`$\frac{d}{dx}\sqrt x=\frac{1}{2\sqrt x}$, so $F(x)=\sqrt x$.`],
      ["Evaluate", t`$\sqrt4-\sqrt1=2-1=1$`],
    ],
    check: { kind: "definite", f: "1/(2*sqrt(x))", a: "1", b: "4", value: "1" },
  },
  {
    n: 183, d: "F", c: ["ftc2-trig"],
    q: FTC2 + t`
$$\int_0^{\pi/2}\sin\theta\,d\theta$$`,
    hints: [t`An antiderivative of $\sin\theta$ is $-\cos\theta$.`],
    a: t`$1$`,
    steps: [
      ["Antiderivative", t`$F(\theta)=-\cos\theta$`],
      ["Evaluate", t`$-\cos\frac{\pi}{2}-(-\cos0)=0+1=1$`],
    ],
    check: { kind: "definite", f: "sin(theta)", a: "0", b: "pi/2", value: "1", var: "theta" },
  },
  {
    n: 184, d: "F", c: ["ftc2-trig"],
    q: FTC2 + t`
$$\int_0^{\pi/4}\sec^2\theta\,d\theta$$`,
    hints: [t`Which function has derivative $\sec^2\theta$?`],
    a: t`$1$`,
    steps: [
      ["Antiderivative", t`$F(\theta)=\tan\theta$`],
      ["Evaluate", t`$\tan\frac{\pi}{4}-\tan0=1-0=1$`],
    ],
    check: { kind: "definite", f: "sec(theta)**2", a: "0", b: "pi/4", value: "1", var: "theta" },
  },
  {
    n: 192, d: "F", c: ["accumulation", "ftc2-trig"],
    q: t`Use the evaluation theorem to express the integral as a function $F(x)$.
$$\int_0^x\cos t\,dt$$`,
    hints: [t`Find an antiderivative of $\cos t$, then evaluate it at $t=x$ and $t=0$.`],
    a: t`$F(x)=\sin x$`,
    steps: [
      ["Antiderivative", t`$\int\cos t\,dt=\sin t$`],
      ["Evaluate", t`$\sin x-\sin0=\sin x$`],
    ],
    check: { kind: "value", expr: "integrate(cos(t), (t, 0, x))", value: "sin(x)" },
  },

  // ---------- Core ----------
  {
    n: 153, d: "C", c: ["ftc1-chain"],
    q: FTC1 + t`
$$\frac{d}{dx}\int_0^{\sqrt{x}}t\,dt$$`,
    hints: [
      t`The upper limit is a function of $x$, so use the chain rule: $\frac{d}{dx}\int_a^{g(x)}f(t)\,dt=f(g(x))\,g'(x)$.`,
    ],
    a: t`$\dfrac12$`,
    steps: [
      ["Identify the pieces", t`$f(t)=t$ and $g(x)=\sqrt x$, so $g'(x)=\frac{1}{2\sqrt x}$.`],
      ["FTC Part 1 with the chain rule", t`$f(g(x))\,g'(x)=\sqrt x\cdot\frac{1}{2\sqrt x}=\frac12$`],
      ["Check another way", t`$\int_0^{\sqrt x}t\,dt=\frac{(\sqrt x)^2}{2}=\frac x2$, whose derivative is $\frac12$.`],
    ],
    check: { kind: "derivative", expr: "Integral(t, (t, 0, sqrt(x)))", value: "1/2" },
  },
  {
    n: 156, d: "C", c: ["ftc1-chain"],
    q: FTC1 + t`
$$\frac{d}{dx}\int_1^{\sqrt{x}}\frac{t^2}{1+t^4}\,dt$$`,
    hints: [t`Substitute $t=\sqrt x$ into the integrand, then multiply by the derivative of $\sqrt x$.`],
    a: t`$\dfrac{\sqrt{x}}{2\left(1+x^2\right)}$`,
    steps: [
      ["Integrand at the upper limit", t`With $t=\sqrt x$: $t^2=x$ and $t^4=x^2$, so $f(\sqrt x)=\frac{x}{1+x^2}$.`],
      ["Multiply by the inner derivative", t`$\frac{x}{1+x^2}\cdot\frac{1}{2\sqrt x}=\frac{\sqrt x}{2(1+x^2)}$`],
    ],
    check: { kind: "derivative", expr: "Integral(t**2/(1 + t**4), (t, 1, sqrt(x)))", value: "sqrt(x)/(2*(1 + x**2))" },
  },
  {
    n: 158, d: "C", c: ["ftc1-chain"],
    q: FTC1 + t`
$$\frac{d}{dx}\int_0^{\ln x}e^t\,dt$$`,
    hints: [t`Use $f(g(x))\,g'(x)$ with $g(x)=\ln x$. Remember $e^{\ln x}=x$.`],
    a: t`$1$ (for $x>0$)`,
    steps: [
      ["FTC Part 1 with the chain rule", t`$e^{\ln x}\cdot\frac{d}{dx}\ln x=x\cdot\frac1x$`],
      ["Simplify", t`$=1$. (Directly: $\int_0^{\ln x}e^t\,dt=e^{\ln x}-1=x-1$, whose derivative is 1.)`],
    ],
    check: { kind: "derivative", expr: "Integral(exp(t), (t, 0, log(x)))", value: "1" },
  },
  {
    n: 171, d: "C", c: ["ftc2"],
    q: FTC2 + t`
$$\int_{-2}^{3}\left(x^2+3x-5\right)dx$$`,
    hints: [t`Use $F(x)=\frac{x^3}{3}+\frac{3x^2}{2}-5x$ and be careful with the negative lower limit.`],
    a: t`$-\dfrac{35}{6}$`,
    steps: [
      ["Antiderivative", t`$F(x)=\frac{x^3}{3}+\frac{3x^2}{2}-5x$`],
      ["Upper limit", t`$F(3)=9+\frac{27}{2}-15=\frac{15}{2}$`],
      ["Lower limit", t`$F(-2)=-\frac83+6+10=\frac{40}{3}$`],
      ["Subtract", t`$\frac{15}{2}-\frac{40}{3}=\frac{45-80}{6}=-\frac{35}{6}$`],
    ],
    check: { kind: "definite", f: "x**2 + 3*x - 5", a: "-2", b: "3", value: "-35/6" },
  },
  {
    n: 180, d: "C", c: ["ftc2"],
    q: FTC2 + t`
$$\int_1^4\frac{2-\sqrt{t}}{t^2}\,dt$$`,
    hints: [t`Split the fraction first: $\frac{2}{t^2}-\frac{\sqrt t}{t^2}=2t^{-2}-t^{-3/2}$.`],
    a: t`$\dfrac12$`,
    steps: [
      ["Rewrite", t`$\frac{2-\sqrt t}{t^2}=2t^{-2}-t^{-3/2}$`],
      ["Antiderivative", t`$F(t)=-2t^{-1}+2t^{-1/2}=-\frac2t+\frac{2}{\sqrt t}$`],
      ["Evaluate", t`$F(4)=-\frac12+1=\frac12$ and $F(1)=-2+2=0$, so the integral is $\frac12$.`],
    ],
    check: { kind: "definite", f: "(2 - sqrt(t))/t**2", a: "1", b: "4", value: "1/2", var: "t" },
  },
  {
    n: 185, d: "C", c: ["ftc2-trig"],
    q: FTC2 + t`
$$\int_0^{\pi/4}\sec\theta\tan\theta\,d\theta$$`,
    hints: [t`$\frac{d}{d\theta}\sec\theta=\sec\theta\tan\theta$.`],
    a: t`$\sqrt2-1$`,
    steps: [
      ["Antiderivative", t`$F(\theta)=\sec\theta$`],
      ["Evaluate", t`$\sec\frac{\pi}{4}-\sec0=\sqrt2-1$`],
    ],
    check: { kind: "definite", f: "sec(theta)*tan(theta)", a: "0", b: "pi/4", value: "sqrt(2) - 1", var: "theta" },
  },
  {
    n: 187, d: "C", c: ["ftc2-trig"],
    q: FTC2 + t`
$$\int_{\pi/4}^{\pi/2}\csc^2\theta\,d\theta$$`,
    hints: [t`$\frac{d}{d\theta}\cot\theta=-\csc^2\theta$, so an antiderivative of $\csc^2\theta$ is $-\cot\theta$.`],
    a: t`$1$`,
    steps: [
      ["Antiderivative", t`$F(\theta)=-\cot\theta$`],
      ["Evaluate", t`$-\cot\frac{\pi}{2}-\left(-\cot\frac{\pi}{4}\right)=0+1=1$`],
    ],
    check: { kind: "definite", f: "csc(theta)**2", a: "pi/4", b: "pi/2", value: "1", var: "theta" },
  },
  {
    n: 193, d: "C", c: ["accumulation", "ftc2-trig"],
    q: t`Use the evaluation theorem to express the integral as a function $F(x)$.
$$\int_{-x}^{x}\sin t\,dt$$`,
    hints: [t`Use the antiderivative $-\cos t$, and remember that $\cos(-x)=\cos x$.`],
    a: t`$F(x)=0$`,
    steps: [
      ["Evaluate", t`$\left[-\cos t\right]_{-x}^{x}=-\cos x+\cos(-x)$`],
      ["Simplify", t`Cosine is even, so $\cos(-x)=\cos x$ and $F(x)=0$. (Sine is odd, so the areas cancel.)`],
    ],
    check: { kind: "value", expr: "integrate(sin(t), (t, -x, x))", value: "0" },
  },
  {
    n: 194, d: "C", c: ["absolute-value"],
    q: t`Identify the roots of the integrand to remove the absolute value, then evaluate.
$$\int_{-2}^{3}|x|\,dx$$`,
    hints: [t`$|x|=-x$ for $x<0$ and $|x|=x$ for $x\ge0$. Split the integral at $x=0$.`],
    a: t`$\dfrac{13}{2}$`,
    steps: [
      ["Split at the root", t`$\int_{-2}^{0}(-x)\,dx+\int_0^3x\,dx$`],
      ["Evaluate each", t`$\left[-\frac{x^2}{2}\right]_{-2}^{0}=0-(-2)=2$ and $\left[\frac{x^2}{2}\right]_0^3=\frac92$`],
      ["Add", t`$2+\frac92=\frac{13}{2}$`],
    ],
    check: { kind: "definite", f: "Abs(x)", a: "-2", b: "3", value: "13/2" },
  },
  {
    n: 196, d: "C", c: ["absolute-value", "ftc2-trig"],
    q: t`Identify the roots of the integrand to remove the absolute value, then evaluate.
$$\int_0^{\pi}|\cos t|\,dt$$`,
    hints: [t`$\cos t\ge0$ on $[0,\frac{\pi}{2}]$ and $\cos t\le0$ on $[\frac{\pi}{2},\pi]$.`],
    a: t`$2$`,
    steps: [
      ["Split at t = π/2", t`$\int_0^{\pi/2}\cos t\,dt-\int_{\pi/2}^{\pi}\cos t\,dt$`],
      ["Evaluate each", t`$\left[\sin t\right]_0^{\pi/2}=1$ and $\left[\sin t\right]_{\pi/2}^{\pi}=0-1=-1$`],
      ["Combine", t`$1-(-1)=2$`],
    ],
    check: { kind: "definite", f: "Abs(cos(t))", a: "0", b: "pi", value: "2", var: "t" },
  },

  // ---------- Challenge ----------
  {
    n: 144, d: "Ch", c: ["mvt-integrals"],
    q: t`Two athletes run at variable speeds $v_1(t)$ and $v_2(t)$. They start and finish a race at exactly the same time. Explain why the two runners must be going the same speed at some point.`,
    hints: [
      t`Consider the difference $v_1(t)-v_2(t)$. What is $\int_0^T\left(v_1(t)-v_2(t)\right)dt$, where $T$ is the finishing time?`,
      t`Use the Mean Value Theorem for Integrals (or the Mean Value Theorem on the difference of the positions).`,
    ],
    a: t`Both run the same distance in the same time $T$, so $\int_0^T(v_1-v_2)\,dt=0$. By the Mean Value Theorem for Integrals, the continuous function $v_1-v_2$ equals its average value, 0, at some time $c$. So $v_1(c)=v_2(c)$.`,
    steps: [
      ["Equal distances", t`Each runner covers the race distance $D$: $\int_0^Tv_1\,dt=\int_0^Tv_2\,dt=D$.`],
      ["Average of the difference", t`So $\int_0^T(v_1-v_2)\,dt=0$, and the average value of $v_1-v_2$ on $[0,T]$ is $0$.`],
      ["Mean Value Theorem for Integrals", t`A continuous function takes on its average value somewhere: $v_1(c)-v_2(c)=0$ for some $c$ in $[0,T]$.`],
    ],
    check: { kind: "manual", note: "Conceptual: MVT for integrals applied to v1 - v2." },
  },
  {
    n: 147, d: "Ch", c: ["ftc1", "mvt-integrals", "accumulation"],
    q: t`Let $F(x)=\displaystyle\int_1^x(1-t)\,dt$. Find $F'(2)$ and the average value of $F'$ over $[1,2]$.`,
    hints: [
      t`By FTC Part 1, $F'(x)=1-x$.`,
      t`The average value of $F'$ on $[1,2]$ is $\frac{1}{2-1}\int_1^2F'(x)\,dx=F(2)-F(1)$.`,
    ],
    a: t`$F'(2)=-1$, and the average value of $F'$ over $[1,2]$ is $-\dfrac12$.`,
    steps: [
      ["FTC Part 1", t`$F'(x)=1-x$, so $F'(2)=-1$.`],
      ["Average value", t`$\frac{1}{2-1}\int_1^2(1-x)\,dx=\left[x-\frac{x^2}{2}\right]_1^2=(2-2)-\left(1-\frac12\right)=-\frac12$`],
    ],
    check: [
      { kind: "derivative", expr: "Integral(1 - t, (t, 1, x))", value: "1 - x" },
      { kind: "value", expr: "integrate(1 - t, (t, 1, 2))", value: "-1/2" },
    ],
  },
  {
    n: 152, d: "Ch", c: ["ftc1-chain"],
    q: FTC1 + t`
$$\frac{d}{dx}\int_x^{2x}t\,dt$$`,
    hints: [
      t`Both limits depend on $x$. Split: $\int_x^{2x}=\int_0^{2x}-\int_0^{x}$.`,
      t`Then $\frac{d}{dx}\int_a^{g(x)}f(t)\,dt=f(g(x))\,g'(x)$ for each piece.`,
    ],
    a: t`$3x$`,
    steps: [
      ["Split at a constant", t`$\int_x^{2x}t\,dt=\int_0^{2x}t\,dt-\int_0^{x}t\,dt$`],
      ["Differentiate each piece", t`$\frac{d}{dx}\int_0^{2x}t\,dt=(2x)(2)=4x$ and $\frac{d}{dx}\int_0^{x}t\,dt=x$`],
      ["Subtract", t`$4x-x=3x$. (Check: $\int_x^{2x}t\,dt=\frac{4x^2-x^2}{2}=\frac{3x^2}{2}$.)`],
    ],
    check: { kind: "derivative", expr: "Integral(t, (t, x, 2*x))", value: "3*x" },
  },
  {
    n: 160, d: "Ch", c: ["accumulation", "ftc1"],
    q: t`The graph of $y=\displaystyle\int_0^x f(t)\,dt$ is shown, where $f$ is a piecewise constant function. (a) Over which intervals is $f$ positive, negative, or zero? (b) What are the maximum and minimum values of $f$? (c) What is the average value of $f$ on $[0,6]$?`,
    figure: {
      xMin: -0.5, xMax: 6.5, yMin: -0.5, yMax: 3.6,
      curves: [{ points: [[0, 0], [1, 3], [2, 2], [3, 0], [4, 3], [5, 3], [6, 2]] }],
      dots: [[0, 0], [1, 3], [2, 2], [3, 0], [4, 3], [5, 3], [6, 2]],
      xTicks: [0, 1, 2, 3, 4, 5, 6], yTicks: [1, 2, 3],
      alt: "Graph of the accumulation function, made of straight segments through (0, 0), (1, 3), (2, 2), (3, 0), (4, 3), (5, 3) and (6, 2).",
    },
    hints: [
      t`By FTC Part 1, $f$ is the derivative of the graphed function, so $f$ is the slope of each segment.`,
      t`The average value of $f$ on $[0,6]$ is $\frac{1}{6}\int_0^6f(t)\,dt$, and that integral is the graph's value at $x=6$.`,
    ],
    a: t`(a) $f>0$ on $(0,1)$ and $(3,4)$; $f<0$ on $(1,3)$ and $(5,6)$; $f=0$ on $(4,5)$. (b) Maximum $3$, minimum $-2$. (c) $\frac{2}{6}=\frac13$.`,
    steps: [
      ["Slopes of the segments", t`$f=3$ on $(0,1)$, $-1$ on $(1,2)$, $-2$ on $(2,3)$, $3$ on $(3,4)$, $0$ on $(4,5)$, $-1$ on $(5,6)$.`],
      ["Signs", t`Positive where the graph rises, negative where it falls, zero where it is flat.`],
      ["Max and min", t`The largest slope is $3$ and the smallest is $-2$.`],
      ["Average value", t`$\frac16\int_0^6f(t)\,dt=\frac16\left(\text{graph at }6-\text{graph at }0\right)=\frac{2-0}{6}=\frac13$`],
    ],
    check: { kind: "value", expr: "(3 + (-1) + (-2) + 3 + 0 + (-1))/6", value: "1/3" },
  },
  {
    n: 195, d: "Ch", c: ["absolute-value", "ftc2"],
    q: t`Identify the roots of the integrand to remove the absolute value, then evaluate.
$$\int_{-2}^{4}\left|t^2-2t-3\right|dt$$`,
    hints: [
      t`Factor: $t^2-2t-3=(t-3)(t+1)$. Find where it is positive and where it is negative on $[-2,4]$.`,
      t`Use $G(t)=\frac{t^3}{3}-t^2-3t$ on each piece, flipping the sign of the negative piece.`,
    ],
    a: t`$\dfrac{46}{3}$`,
    steps: [
      ["Sign chart", t`$(t-3)(t+1)>0$ on $[-2,-1)$ and $(3,4]$; $<0$ on $(-1,3)$.`],
      ["Antiderivative values", t`$G(-2)=-\frac23,\ G(-1)=\frac53,\ G(3)=-9,\ G(4)=-\frac{20}{3}$`],
      ["Each piece", t`$[-2,-1]$: $\frac53+\frac23=\frac73$. $\ [-1,3]$: $-(G(3)-G(-1))=\frac{32}{3}$. $\ [3,4]$: $-\frac{20}{3}+9=\frac73$`],
      ["Add", t`$\frac73+\frac{32}{3}+\frac73=\frac{46}{3}$`],
    ],
    check: { kind: "definite", f: "Abs(t**2 - 2*t - 3)", a: "-2", b: "4", value: "46/3", var: "t" },
  },
]);
