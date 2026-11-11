import { sectionProblems, t } from "../helpers";

// Final Exam, Chapter 5 Review Exercises (OpenStax Calculus Volume 1), 439–463.
// Statements follow the import specification; hints, answers and worked solutions are original to this site.

const TF = t`True or False. Justify your answer with a proof or a counterexample. Assume all functions $f$ and $g$ are continuous over their domains.`;
const RIEMANN = t`Evaluate the Riemann sums $L_4$ and $R_4$ for the function over the specified interval. Compare your answer with the exact answer, when possible, or use a calculator to determine the answer.`;
const EVALUATE = t`Evaluate the integral.`;
const ANTI = t`Find the antiderivative.`;
const DERIVATIVE = t`Find the derivative.`;
/** The shared data for 459–461 (kept exactly as given). */
const RAM = t`The following problems consider the historic average cost per gigabyte of RAM on a computer.

| Year | 5-Year Change (\$) |
| 1980 | 0 |
| 1985 | −5,468,750 |
| 1990 | −755,495 |
| 1995 | −73,005 |
| 2000 | −29,768 |
| 2005 | −918 |
| 2010 | −177 |`;

export default sectionProblems("5", [
  // ---------- True or False ----------
  {
    n: 439, d: "F", c: ["integral-facts"],
    q: TF + t`

If $f(x)>0$ and $f'(x)>0$ for all $x$, then the right-hand rule underestimates the integral $\int_a^bf(x)\,dx$. Use a graph to justify your answer.`,
    hints: [t`If $f$ is increasing, where on each subinterval is $f$ largest? Which endpoint does the right-hand rule use?`],
    a: t`False. Since $f'>0$, $f$ is increasing, so on each subinterval the right endpoint gives the largest value. Every right-hand rectangle reaches above the curve, so the right-hand rule overestimates the integral.`,
    steps: [
      ["Increasing function", t`$f'(x)>0$ means $f$ is increasing, so on $[x_{i-1},x_i]$ the largest value of $f$ is $f(x_i)$, at the right endpoint.`],
      ["Picture the rectangles", t`Each right-hand rectangle has height $f(x_i)\ge f(x)$ across its subinterval, so it covers the region under the curve there and sticks out above it.`],
      ["Conclusion", t`So $R_n>\int_a^bf(x)\,dx$: the right-hand rule overestimates, and the statement is false. (The left-hand rule would underestimate.)`],
    ],
    check: { kind: "manual", note: "Monotonicity argument: right endpoints of an increasing function overestimate." },
  },
  {
    n: 440, d: "F", c: ["integral-facts"],
    q: TF + t`
$$\int_a^b[f(x)]^2\,dx=\left[\int_a^bf(x)\,dx\right]\left[\int_a^bf(x)\,dx\right]$$`,
    hints: [t`Test it with a simple function, such as $f(x)=x$ on $[0,1]$.`],
    a: t`False. For $f(x)=x$ on $[0,1]$: $\int_0^1x^2\,dx=\frac13$, but $\left(\int_0^1x\,dx\right)^2=\left(\frac12\right)^2=\frac14$.`,
    steps: [
      ["Choose a test function", t`$f(x)=x$ with $a=0$ and $b=1$.`],
      ["Left side", t`$\int_0^1x^2\,dx=\frac13$`],
      ["Right side", t`$\left(\int_0^1x\,dx\right)^2=\left(\frac12\right)^2=\frac14$`],
      ["Compare", t`$\frac13\neq\frac14$, so the statement is false: the integral of a square is not the square of the integral.`],
    ],
    check: [
      { kind: "definite", f: "x**2", a: "0", b: "1", value: "1/3" },
      { kind: "value", expr: "Integral(x, (x, 0, 1))**2", value: "1/4" },
    ],
  },
  {
    n: 441, d: "F", c: ["integral-facts"],
    q: TF + t`

If $f(x)\le g(x)$ for all $x\in[a,b]$, then $\int_a^bf(x)\,dx\le\int_a^bg(x)\,dx$.`,
    hints: [t`Look at $g-f$. What sign does it have, and what does that say about its integral?`],
    a: t`True (for $a\le b$). Since $g(x)-f(x)\ge0$ on $[a,b]$, $\int_a^b[g(x)-f(x)]\,dx\ge0$, so $\int_a^bf(x)\,dx\le\int_a^bg(x)\,dx$.`,
    steps: [
      ["Use the difference", t`$h(x)=g(x)-f(x)\ge0$ on $[a,b]$, and $h$ is continuous.`],
      ["Nonnegative integrand", t`Every Riemann sum of $h$ is $\ge0$ (heights $\ge0$, widths $>0$), so $\int_a^bh(x)\,dx\ge0$.`],
      ["Conclusion", t`$\int_a^bg(x)\,dx-\int_a^bf(x)\,dx=\int_a^bh(x)\,dx\ge0$, which gives $\int_a^bf(x)\,dx\le\int_a^bg(x)\,dx$. This is the comparison property, so the statement is true.`],
    ],
    check: { kind: "manual", note: "Comparison property of definite integrals." },
  },
  {
    n: 442, d: "F", c: ["integral-facts"],
    q: TF + t`

All continuous functions have an antiderivative.`,
    hints: [t`The Fundamental Theorem of Calculus, Part 1, builds an antiderivative out of an integral.`],
    a: t`True. If $f$ is continuous on an interval containing $a$, then $F(x)=\int_a^xf(t)\,dt$ satisfies $F'(x)=f(x)$ by the Fundamental Theorem of Calculus, Part 1.`,
    steps: [
      ["Build a candidate", t`For continuous $f$, define $F(x)=\int_a^xf(t)\,dt$.`],
      ["Apply FTC Part 1", t`FTC Part 1 says $F$ is differentiable with $F'(x)=f(x)$.`],
      ["Conclusion", t`So $F$ is an antiderivative of $f$, even when it has no formula in familiar functions (for example $\int_0^xe^{-t^2}\,dt$). The statement is true.`],
    ],
    check: { kind: "derivative", expr: "Integral(exp(-t**2), (t, 0, x))", value: "exp(-x**2)" },
  },

  // ---------- Riemann sums ----------
  {
    n: 443, d: "C", c: ["riemann-sums"],
    q: RIEMANN + t`
$$y=3x^2-2x+1\quad\text{over }[-1,1]$$`,
    hints: [
      t`$\Delta x=\frac{1-(-1)}{4}=0.5$, so the grid is $-1,\,-0.5,\,0,\,0.5,\,1$.`,
      t`$L_4$ uses the first four grid points and $R_4$ the last four.`,
    ],
    a: t`$L_4=5.25$ and $R_4=3.25$. The exact value is $\int_{-1}^1\left(3x^2-2x+1\right)dx=4$.`,
    steps: [
      ["Grid values", t`$\Delta x=0.5$. At $x=-1,-0.5,0,0.5,1$: $f=6,\ 2.75,\ 1,\ 0.75,\ 2$.`],
      ["Left sum", t`$L_4=0.5(6+2.75+1+0.75)=0.5(10.5)=5.25$`],
      ["Right sum", t`$R_4=0.5(2.75+1+0.75+2)=0.5(6.5)=3.25$`],
      ["Exact value", t`$\int_{-1}^1\left(3x^2-2x+1\right)dx=\left[x^3-x^2+x\right]_{-1}^{1}=1-(-3)=4$, which lies between the two sums (here it is their average).`],
    ],
    check: [
      { kind: "value", expr: "(1/2)*((3*(-1)**2 - 2*(-1) + 1) + (3*(-1/2)**2 - 2*(-1/2) + 1) + 1 + (3*(1/2)**2 - 2*(1/2) + 1))", value: "21/4" },
      { kind: "value", expr: "(1/2)*((3*(-1/2)**2 - 2*(-1/2) + 1) + 1 + (3*(1/2)**2 - 2*(1/2) + 1) + (3*1**2 - 2*1 + 1))", value: "13/4" },
      { kind: "definite", f: "3*x**2 - 2*x + 1", a: "-1", b: "1", value: "4" },
    ],
  },
  {
    n: 444, d: "C", c: ["riemann-sums"],
    q: RIEMANN + t`
$$y=\ln\left(x^2+1\right)\quad\text{over }[0,e]$$`,
    hints: [t`$\Delta x=\frac e4\approx0.6796$, so the grid is $0,\ \frac e4,\ \frac e2,\ \frac{3e}4,\ e$. Use a calculator for the values of $\ln\left(x^2+1\right)$.`],
    a: t`$L_4\approx2.0837$ and $R_4\approx3.5291$. The exact value is $e\ln\left(e^2+1\right)-2e+2\arctan e\approx2.7816$.`,
    steps: [
      ["Grid values", t`$\Delta x=\frac e4\approx0.67957$. $f(0)=0$, $f\left(\frac e4\right)\approx0.37968$, $f\left(\frac e2\right)\approx1.04636$, $f\left(\frac{3e}4\right)\approx1.64023$, $f(e)\approx2.12693$.`],
      ["Left sum", t`$L_4=\frac e4(0+0.37968+1.04636+1.64023)\approx2.0837$`],
      ["Right sum", t`$R_4=\frac e4(0.37968+1.04636+1.64023+2.12693)\approx3.5291$`],
      ["Compare", t`A calculator gives $\int_0^e\ln\left(x^2+1\right)dx\approx2.7816$ (exactly $e\ln\left(e^2+1\right)-2e+2\arctan e$). Since $f$ is increasing on $[0,e]$, $L_4$ underestimates and $R_4$ overestimates.`],
    ],
    check: [
      { kind: "value", expr: "(E/4)*(log((E/4)**2 + 1) + log((E/2)**2 + 1) + log((3*E/4)**2 + 1))", value: "2.0837436896" },
      { kind: "value", expr: "(E/4)*(log((E/4)**2 + 1) + log((E/2)**2 + 1) + log((3*E/4)**2 + 1) + log(E**2 + 1))", value: "3.5291411296" },
      { kind: "definite", f: "log(x**2 + 1)", a: "0", b: "E", value: "E*log(E**2 + 1) - 2*E + 2*atan(E)" },
    ],
  },
  {
    n: 445, d: "C", c: ["riemann-sums"],
    q: RIEMANN + t`
$$y=x^2\sin x\quad\text{over }[0,\pi]$$`,
    hints: [t`$\Delta x=\frac\pi4$, so the grid is $0,\ \frac\pi4,\ \frac\pi2,\ \frac{3\pi}4,\ \pi$. Notice that $f(0)=f(\pi)=0$.`],
    a: t`$L_4=R_4=\dfrac{\pi^3}{64}\left(4+5\sqrt2\right)\approx5.3636$. The exact value is $\pi^2-4\approx5.8696$.`,
    steps: [
      ["Grid values", t`$f(0)=0$, $f\left(\frac\pi4\right)=\frac{\pi^2\sqrt2}{32}\approx0.4362$, $f\left(\frac\pi2\right)=\frac{\pi^2}{4}\approx2.4674$, $f\left(\frac{3\pi}4\right)=\frac{9\pi^2\sqrt2}{32}\approx3.9256$, $f(\pi)=0$.`],
      ["Both sums", t`Because $f(0)=f(\pi)=0$, $L_4$ and $R_4$ use the same three nonzero values: $L_4=R_4=\frac\pi4(0.4362+2.4674+3.9256)\approx5.3636$.`],
      ["Exact value", t`A calculator (or integration by parts) gives $\int_0^\pi x^2\sin x\,dx=\pi^2-4\approx5.8696$, so both sums underestimate here.`],
    ],
    check: [
      { kind: "value", expr: "(pi/4)*((pi/4)**2*sin(pi/4) + (pi/2)**2*sin(pi/2) + (3*pi/4)**2*sin(3*pi/4))", value: "pi**3*(4 + 5*sqrt(2))/64" },
      { kind: "definite", f: "x**2*sin(x)", a: "0", b: "pi", value: "pi**2 - 4" },
    ],
  },
  {
    n: 446, d: "C", c: ["riemann-sums"],
    q: RIEMANN + t`
$$y=\sqrt{x}+\frac1x\quad\text{over }[1,4]$$`,
    hints: [t`$\Delta x=\frac{4-1}{4}=0.75$, so the grid is $1,\ 1.75,\ 2.5,\ 3.25,\ 4$.`],
    a: t`$L_4\approx5.9894$ and $R_4\approx6.1769$. The exact value is $\frac{14}{3}+\ln4\approx6.0530$.`,
    steps: [
      ["Grid values", t`$f(1)=2$, $f(1.75)\approx1.8943$, $f(2.5)\approx1.9811$, $f(3.25)\approx2.1105$, $f(4)=2.25$.`],
      ["Left sum", t`$L_4=0.75(2+1.8943+1.9811+2.1105)\approx5.9894$`],
      ["Right sum", t`$R_4=0.75(1.8943+1.9811+2.1105+2.25)\approx6.1769$`],
      ["Exact value", t`$\int_1^4\left(\sqrt x+\frac1x\right)dx=\left[\frac23x^{3/2}+\ln x\right]_1^4=\frac{16}{3}+\ln4-\frac23=\frac{14}3+\ln4\approx6.0530$, between the two sums.`],
    ],
    check: [
      { kind: "value", expr: "(3/4)*((sqrt(1) + 1) + (sqrt(7/4) + 4/7) + (sqrt(5/2) + 2/5) + (sqrt(13/4) + 4/13))", value: "5.9894332524" },
      { kind: "value", expr: "(3/4)*((sqrt(7/4) + 4/7) + (sqrt(5/2) + 2/5) + (sqrt(13/4) + 4/13) + (sqrt(4) + 1/4))", value: "6.1769332524" },
      { kind: "definite", f: "sqrt(x) + 1/x", a: "1", b: "4", value: "14/3 + log(4)" },
    ],
  },

  // ---------- Definite integrals ----------
  {
    n: 447, d: "F", c: ["definite-integrals"],
    q: EVALUATE + t`
$$\int_{-1}^{1}\left(x^3-2x^2+4x\right)dx$$`,
    hints: [t`$x^3$ and $4x$ are odd functions, so their integrals over $[-1,1]$ are $0$.`],
    a: t`$-\dfrac43$`,
    steps: [
      ["Use symmetry", t`$x^3+4x$ is odd, so $\int_{-1}^1\left(x^3+4x\right)dx=0$.`],
      ["Even part", t`$-2\int_{-1}^1x^2\,dx=-2\cdot\frac23=-\frac43$.`],
      ["Answer", t`$\int_{-1}^1\left(x^3-2x^2+4x\right)dx=-\frac43$`],
    ],
    check: { kind: "definite", f: "x**3 - 2*x**2 + 4*x", a: "-1", b: "1", value: "-4/3" },
  },
  {
    n: 448, d: "C", c: ["definite-integrals"],
    q: EVALUATE + t`
$$\int_0^4\frac{3t}{\sqrt{1+6t^2}}\,dt$$`,
    hints: [t`Let $u=1+6t^2$, so $du=12t\,dt$ and $3t\,dt=\frac14\,du$. Change the limits too.`],
    a: t`$\dfrac{\sqrt{97}-1}{2}\approx4.4244$`,
    steps: [
      ["Substitute", t`$u=1+6t^2$ and $du=12t\,dt$, so $3t\,dt=\frac14\,du$. When $t=0$, $u=1$; when $t=4$, $u=97$.`],
      ["Integrate", t`$\int_1^{97}\frac14u^{-1/2}\,du=\frac14\cdot2u^{1/2}\Big|_1^{97}=\frac12\left(\sqrt{97}-1\right)$`],
    ],
    check: { kind: "definite", f: "3*t/sqrt(1 + 6*t**2)", a: "0", b: "4", value: "(sqrt(97) - 1)/2", var: "t" },
  },
  {
    n: 449, d: "C", c: ["definite-integrals"],
    q: EVALUATE + t`
$$\int_{\pi/3}^{\pi/2}2\sec(2\theta)\tan(2\theta)\,d\theta$$`,
    hints: [t`$\dfrac{d}{d\theta}\sec(2\theta)=2\sec(2\theta)\tan(2\theta)$.`],
    a: t`$1$`,
    steps: [
      ["Antiderivative", t`$\frac{d}{d\theta}\sec(2\theta)=2\sec(2\theta)\tan(2\theta)$, so an antiderivative is $\sec(2\theta)$. On $\left[\frac\pi3,\frac\pi2\right]$, $\cos(2\theta)\neq0$, so the integrand is continuous.`],
      ["Evaluate", t`$\sec\pi-\sec\frac{2\pi}3=-1-(-2)=1$`],
    ],
    check: { kind: "definite", f: "2*sec(2*theta)*tan(2*theta)", a: "pi/3", b: "pi/2", value: "1", var: "theta" },
  },
  {
    n: 450, d: "C", c: ["definite-integrals"],
    q: EVALUATE + t`
$$\int_0^{\pi/4}e^{\cos^2x}\sin x\cos x\,dx$$`,
    hints: [t`Let $u=\cos^2x$. Then $du=-2\cos x\sin x\,dx$.`],
    a: t`$\dfrac{e-\sqrt e}{2}\approx0.5348$`,
    steps: [
      ["Substitute", t`$u=\cos^2x$ and $du=-2\sin x\cos x\,dx$, so $\sin x\cos x\,dx=-\frac12\,du$. When $x=0$, $u=1$; when $x=\frac\pi4$, $u=\frac12$.`],
      ["Integrate", t`$\int_1^{1/2}-\frac12e^u\,du=\frac12\int_{1/2}^{1}e^u\,du=\frac12\left(e-e^{1/2}\right)$`],
    ],
    check: { kind: "definite", f: "exp(cos(x)**2)*sin(x)*cos(x)", a: "0", b: "pi/4", value: "(E - sqrt(E))/2" },
  },

  // ---------- Antiderivatives ----------
  {
    n: 451, d: "F", c: ["antiderivatives"],
    q: ANTI + t`
$$\int\frac{1}{(x+4)^3}\,dx$$`,
    hints: [t`Let $u=x+4$, which turns it into $\int u^{-3}\,du$.`],
    a: t`$-\dfrac{1}{2(x+4)^2}+C$`,
    steps: [
      ["Substitute", t`$u=x+4$ and $du=dx$: $\int u^{-3}\,du=\dfrac{u^{-2}}{-2}+C$.`],
      ["Back to x", t`$-\dfrac{1}{2(x+4)^2}+C$`],
    ],
    check: { kind: "antiderivative", f: "1/(x + 4)**3", F: "-1/(2*(x + 4)**2)" },
  },
  {
    n: 452, d: "Ch", c: ["antiderivatives"],
    q: ANTI + t`
$$\int x\ln\left(x^2\right)dx$$`,
    hints: [
      t`Let $u=x^2$, so $x\,dx=\frac12\,du$ and the integral becomes $\frac12\int\ln u\,du$.`,
      t`An antiderivative of $\ln u$ is $u\ln u-u$ (check it by differentiating).`,
    ],
    a: t`$\dfrac12x^2\ln\left(x^2\right)-\dfrac12x^2+C$`,
    steps: [
      ["Substitute", t`$u=x^2$ and $du=2x\,dx$: $\int x\ln\left(x^2\right)dx=\frac12\int\ln u\,du$.`],
      ["An antiderivative of ln u", t`$\dfrac{d}{du}(u\ln u-u)=\ln u+1-1=\ln u$, so $\int\ln u\,du=u\ln u-u+C$.`],
      ["Back to x", t`$\frac12\left(x^2\ln\left(x^2\right)-x^2\right)+C=\frac12x^2\ln\left(x^2\right)-\frac12x^2+C$`],
      ["Check", t`$\dfrac{d}{dx}\left[\frac12x^2\ln\left(x^2\right)-\frac12x^2\right]=x\ln\left(x^2\right)+\frac12x^2\cdot\frac{2x}{x^2}-x=x\ln\left(x^2\right)$, the integrand.`],
    ],
    check: { kind: "antiderivative", f: "x*log(x**2)", F: "x**2*log(x**2)/2 - x**2/2" },
  },
  {
    n: 453, d: "C", c: ["antiderivatives"],
    q: ANTI + t`
$$\int\frac{4x^2}{\sqrt{1-x^6}}\,dx$$`,
    hints: [t`Notice $x^6=\left(x^3\right)^2$ and $\frac{d}{dx}x^3=3x^2$. Let $u=x^3$.`],
    a: t`$\dfrac43\arcsin\left(x^3\right)+C$`,
    steps: [
      ["Substitute", t`$u=x^3$ and $du=3x^2\,dx$, so $4x^2\,dx=\frac43\,du$ and $\sqrt{1-x^6}=\sqrt{1-u^2}$.`],
      ["Integrate", t`$\dfrac43\int\dfrac{du}{\sqrt{1-u^2}}=\dfrac43\arcsin u+C$`],
      ["Back to x", t`$\dfrac43\arcsin\left(x^3\right)+C$`],
    ],
    check: { kind: "antiderivative", f: "4*x**2/sqrt(1 - x**6)", F: "4*asin(x**3)/3" },
  },
  {
    n: 454, d: "C", c: ["antiderivatives"],
    q: ANTI + t`
$$\int\frac{e^{2x}}{1+e^{4x}}\,dx$$`,
    hints: [t`$e^{4x}=\left(e^{2x}\right)^2$. Let $u=e^{2x}$.`],
    a: t`$\dfrac12\arctan\left(e^{2x}\right)+C$`,
    steps: [
      ["Substitute", t`$u=e^{2x}$ and $du=2e^{2x}\,dx$, so $e^{2x}\,dx=\frac12\,du$ and $1+e^{4x}=1+u^2$.`],
      ["Integrate", t`$\dfrac12\int\dfrac{du}{1+u^2}=\dfrac12\arctan u+C$`],
      ["Back to x", t`$\dfrac12\arctan\left(e^{2x}\right)+C$`],
    ],
    check: { kind: "antiderivative", f: "exp(2*x)/(1 + exp(4*x))", F: "atan(exp(2*x))/2" },
  },

  // ---------- Derivatives of integrals ----------
  {
    n: 455, d: "F", c: ["ftc-derivatives"],
    q: DERIVATIVE + t`
$$\frac{d}{dt}\left\{\int_0^t\frac{\sin x}{\sqrt{1+x^2}}\,dx\right\}$$`,
    hints: [t`The upper limit is just $t$ and the integrand is continuous: use the Fundamental Theorem of Calculus, Part 1.`],
    a: t`$\dfrac{\sin t}{\sqrt{1+t^2}}$`,
    steps: [
      ["Check the form", t`The lower limit is a constant, the upper limit is $t$, and the integrand is continuous.`],
      ["Apply FTC Part 1", t`Replace $x$ with $t$ in the integrand: $\dfrac{\sin t}{\sqrt{1+t^2}}$.`],
    ],
    check: { kind: "derivative", expr: "Integral(sin(x)/sqrt(1 + x**2), (x, 0, t))", value: "sin(t)/sqrt(1 + t**2)", var: "t" },
  },
  {
    n: 456, d: "C", c: ["ftc-derivatives"],
    q: DERIVATIVE + t`
$$\frac{d}{dx}\left\{\int_1^{x^3}\sqrt{4-t^2}\,dt\right\}$$`,
    hints: [t`The upper limit is $x^3$, not $x$: use FTC Part 1 together with the chain rule.`],
    a: t`$3x^2\sqrt{4-x^6}$`,
    steps: [
      ["Chain-rule form", t`$\dfrac{d}{dx}\int_1^{g(x)}f(t)\,dt=f(g(x))\,g'(x)$, here with $g(x)=x^3$.`],
      ["Apply", t`$\sqrt{4-\left(x^3\right)^2}\cdot3x^2=3x^2\sqrt{4-x^6}$`],
    ],
    check: { kind: "derivative", expr: "Integral(sqrt(4 - t**2), (t, 1, x**3))", value: "3*x**2*sqrt(4 - x**6)" },
  },
  {
    n: 457, d: "C", c: ["ftc-derivatives"],
    q: DERIVATIVE + t`
$$\frac{d}{dx}\left\{\int_1^{\ln(x)}\left(4t+e^t\right)dt\right\}$$`,
    hints: [t`The upper limit is $\ln x$: multiply by $\frac{d}{dx}\ln x=\frac1x$, and simplify $e^{\ln x}=x$.`],
    a: t`$\dfrac{4\ln x}{x}+1$`,
    steps: [
      ["FTC with the chain rule", t`$\left(4\ln x+e^{\ln x}\right)\cdot\dfrac1x$`],
      ["Simplify", t`$e^{\ln x}=x$, so this is $\dfrac{4\ln x+x}{x}=\dfrac{4\ln x}{x}+1$ (for $x>0$).`],
    ],
    check: { kind: "derivative", expr: "Integral(4*t + exp(t), (t, 1, log(x)))", value: "4*log(x)/x + 1" },
  },
  {
    n: 458, d: "C", c: ["ftc-derivatives"],
    q: DERIVATIVE + t`
$$\frac{d}{dx}\left\{\int_0^{\cos(x)}e^{t^2}\,dt\right\}$$`,
    hints: [t`The upper limit is $\cos x$: multiply by $\frac{d}{dx}\cos x=-\sin x$.`],
    a: t`$-\sin x\,e^{\cos^2x}$`,
    steps: [
      ["FTC with the chain rule", t`$e^{(\cos x)^2}\cdot\dfrac{d}{dx}\cos x$`],
      ["Simplify", t`$-\sin x\,e^{\cos^2x}$`],
    ],
    check: { kind: "derivative", expr: "Integral(exp(t**2), (t, 0, cos(x)))", value: "-sin(x)*exp(cos(x)**2)" },
  },

  // ---------- Net change and average value (the RAM data) ----------
  {
    n: 459, d: "C", c: ["net-change"],
    q: RAM + t`

If the average cost per gigabyte of RAM in 2010 is \$12, find the average cost per gigabyte of RAM in 1980.`,
    hints: [t`The 5-year changes add up to the total change from 1980 to 2010 (the net change theorem).`],
    a: t`\$6,328,125 per gigabyte`,
    steps: [
      ["Total change", t`From 1980 to 2010 the cost changed by the sum of the 5-year changes: $-5{,}468{,}750-755{,}495-73{,}005-29{,}768-918-177=-6{,}328{,}113$ dollars.`],
      ["Net change", t`The 2010 cost is the 1980 cost plus the total change: $12=C_{1980}-6{,}328{,}113$.`],
      ["Solve", t`$C_{1980}=12+6{,}328{,}113=6{,}328{,}125$ dollars per gigabyte.`],
    ],
    check: { kind: "value", expr: "12 + 5468750 + 755495 + 73005 + 29768 + 918 + 177", value: "6328125" },
  },
  {
    n: 460, d: "Ch", c: ["net-change"],
    q: RAM + t`

The average cost per gigabyte of RAM can be approximated by the function $C(t)=8{,}500{,}000(0.65)^t$, where $t$ is measured in years since 1980, and $C$ is cost in US\$. Find the average cost per gigabyte of RAM for 1980 to 2010.`,
    hints: [
      t`Use the average value of $C$ over $[0,30]$: $\dfrac{1}{30}\int_0^{30}C(t)\,dt$.`,
      t`An antiderivative of $a^t$ is $\dfrac{a^t}{\ln a}$.`,
    ],
    a: t`About \$657,716 per gigabyte: $\dfrac{1}{30}\int_0^{30}8{,}500{,}000(0.65)^t\,dt=\dfrac{8{,}500{,}000}{30}\cdot\dfrac{(0.65)^{30}-1}{\ln0.65}\approx657{,}716$.`,
    steps: [
      ["Average value", t`1980 to 2010 is $t=0$ to $t=30$, so the average cost is $\dfrac{1}{30}\int_0^{30}8{,}500{,}000(0.65)^t\,dt$.`],
      ["Antiderivative", t`An antiderivative of $(0.65)^t$ is $\dfrac{(0.65)^t}{\ln0.65}$.`],
      ["Evaluate", t`$\dfrac{8{,}500{,}000}{30}\cdot\dfrac{(0.65)^{30}-(0.65)^0}{\ln0.65}\approx283{,}333\cdot2.3213\approx657{,}716$ dollars.`],
    ],
    check: { kind: "value", expr: "Integral(8500000*(13/20)**t, (t, 0, 30))/30", value: "8500000*((13/20)**30 - 1)/(30*log(13/20))" },
  },
  {
    n: 461, d: "Ch", c: ["net-change"],
    q: RAM + t`

Find the average cost of 1GB RAM for 2005 to 2010.

(Use the model from the previous exercise: $C(t)=8{,}500{,}000(0.65)^t$, with $t$ in years since 1980.)`,
    hints: [t`2005 to 2010 is $t=25$ to $t=30$. Average value: $\dfrac{1}{5}\int_{25}^{30}C(t)\,dt$.`],
    a: t`About \$73.36: $\dfrac15\int_{25}^{30}8{,}500{,}000(0.65)^t\,dt=1{,}700{,}000\cdot\dfrac{(0.65)^{30}-(0.65)^{25}}{\ln0.65}\approx73.36$.`,
    steps: [
      ["Average value", t`From $t=25$ to $t=30$: $\dfrac{1}{30-25}\int_{25}^{30}8{,}500{,}000(0.65)^t\,dt$.`],
      ["Antiderivative", t`$\dfrac{8{,}500{,}000}{5}\left[\dfrac{(0.65)^t}{\ln0.65}\right]_{25}^{30}=1{,}700{,}000\cdot\dfrac{(0.65)^{30}-(0.65)^{25}}{\ln0.65}$`],
      ["Evaluate", t`$(0.65)^{30}\approx2.441\times10^{-6}$ and $(0.65)^{25}\approx2.104\times10^{-5}$, so the average is about $73.36$ dollars per gigabyte.`],
    ],
    check: { kind: "value", expr: "Integral(8500000*(13/20)**t, (t, 25, 30))/5", value: "73.360511796" },
  },
  {
    n: 462, d: "C", c: ["net-change"],
    q: t`The velocity of a bullet from a rifle can be approximated by $v(t)=6400t^2-6505t+2686$, where $t$ is seconds after the shot and $v$ is the velocity measured in feet per second. This equation only models the velocity for the first half-second after the shot: $0\le t\le0.5$. What is the total distance the bullet travels in 0.5 sec.`,
    hints: [t`Total distance is $\int_0^{0.5}|v(t)|\,dt$. Is $v(t)$ ever negative on $[0,0.5]$? Check the discriminant of $v$.`],
    a: t`$\dfrac{19117}{24}\approx796.54$ feet`,
    steps: [
      ["Sign of v", t`The discriminant of $6400t^2-6505t+2686$ is $6505^2-4(6400)(2686)<0$, so $v$ has no real zeros. With a positive leading coefficient, $v(t)>0$ for all $t$, so the total distance is $\int_0^{0.5}v(t)\,dt$.`],
      ["Antiderivative", t`$\int\left(6400t^2-6505t+2686\right)dt=\dfrac{6400}{3}t^3-\dfrac{6505}{2}t^2+2686t$`],
      ["Evaluate", t`At $t=0.5$: $\dfrac{800}{3}-\dfrac{6505}{8}+1343=\dfrac{19117}{24}\approx796.54$ ft (and $0$ at $t=0$).`],
    ],
    check: [
      { kind: "value", expr: "6505**2 - 4*6400*2686", value: "-26446575" },
      { kind: "definite", f: "6400*t**2 - 6505*t + 2686", a: "0", b: "1/2", value: "19117/24", var: "t" },
    ],
  },
  {
    n: 463, d: "F", c: ["net-change"],
    q: t`What is the average velocity of the bullet for the first half-second.

(From the previous exercise: $v(t)=6400t^2-6505t+2686$ ft/sec for $0\le t\le0.5$.)`,
    hints: [t`Average velocity $=\dfrac{1}{0.5-0}\int_0^{0.5}v(t)\,dt$: the distance from the previous exercise divided by $0.5$ sec.`],
    a: t`$\dfrac{19117}{12}\approx1593.08$ ft/sec`,
    steps: [
      ["Average value", t`$\bar v=\dfrac{1}{0.5}\int_0^{0.5}v(t)\,dt$`],
      ["Use the previous result", t`$\int_0^{0.5}v(t)\,dt=\dfrac{19117}{24}$ ft, so $\bar v=2\cdot\dfrac{19117}{24}=\dfrac{19117}{12}\approx1593.08$ ft/sec.`],
    ],
    check: { kind: "value", expr: "Integral(6400*t**2 - 6505*t + 2686, (t, 0, 1/2))/(1/2)", value: "19117/12" },
  },
]);
