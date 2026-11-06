import { sectionProblems, t } from "../helpers";

const EVAL = t`Evaluate the integral in terms of an inverse trigonometric function.`;
const INDEF = t`Find the indefinite integral, using an appropriate substitution.`;
const ANTI = t`Compute the antiderivative using an appropriate substitution.`;

export default sectionProblems("5.7", [
  // ---------- Foundation ----------
  {
    n: 391, d: "F", c: ["arcsin-form", "inverse-trig-definite"],
    q: EVAL + t`
$$\int_0^{\sqrt3/2}\frac{dx}{\sqrt{1-x^2}}$$`,
    hints: [t`$\int\frac{dx}{\sqrt{1-x^2}}=\sin^{-1}x+C$.`],
    a: t`$\dfrac{\pi}{3}$`,
    steps: [
      ["Antiderivative", t`$\left[\sin^{-1}x\right]_0^{\sqrt3/2}$`],
      ["Evaluate", t`$\sin^{-1}\frac{\sqrt3}{2}-\sin^{-1}0=\frac{\pi}{3}-0=\frac{\pi}{3}$`],
    ],
    check: { kind: "definite", f: "1/sqrt(1 - x**2)", a: "0", b: "sqrt(3)/2", value: "pi/3" },
  },
  {
    n: 392, d: "F", c: ["arcsin-form", "inverse-trig-definite"],
    q: EVAL + t`
$$\int_{-1/2}^{1/2}\frac{dx}{\sqrt{1-x^2}}$$`,
    hints: [t`$\sin^{-1}\left(-\frac12\right)=-\frac{\pi}{6}$.`],
    a: t`$\dfrac{\pi}{3}$`,
    steps: [
      ["Antiderivative", t`$\left[\sin^{-1}x\right]_{-1/2}^{1/2}$`],
      ["Evaluate", t`$\frac{\pi}{6}-\left(-\frac{\pi}{6}\right)=\frac{\pi}{3}$`],
    ],
    check: { kind: "definite", f: "1/sqrt(1 - x**2)", a: "-1/2", b: "1/2", value: "pi/3" },
  },
  {
    n: 393, d: "F", c: ["arctan-form", "inverse-trig-definite"],
    q: EVAL + t`
$$\int_{\sqrt3}^{1}\frac{dx}{1+x^2}$$`,
    hints: [t`$\int\frac{dx}{1+x^2}=\tan^{-1}x+C$. Notice the upper limit is smaller than the lower limit.`],
    a: t`$-\dfrac{\pi}{12}$`,
    steps: [
      ["Antiderivative", t`$\left[\tan^{-1}x\right]_{\sqrt3}^{1}$`],
      ["Evaluate", t`$\tan^{-1}1-\tan^{-1}\sqrt3=\frac{\pi}{4}-\frac{\pi}{3}=-\frac{\pi}{12}$ (negative because the limits run backward)`],
    ],
    check: { kind: "definite", f: "1/(1 + x**2)", a: "sqrt(3)", b: "1", value: "-pi/12" },
  },
  {
    n: 394, d: "F", c: ["arctan-form", "inverse-trig-definite"],
    q: EVAL + t`
$$\int_{1/\sqrt3}^{\sqrt3}\frac{dx}{1+x^2}$$`,
    hints: [t`$\tan\frac{\pi}{6}=\frac{1}{\sqrt3}$ and $\tan\frac{\pi}{3}=\sqrt3$.`],
    a: t`$\dfrac{\pi}{6}$`,
    steps: [
      ["Antiderivative", t`$\left[\tan^{-1}x\right]_{1/\sqrt3}^{\sqrt3}$`],
      ["Evaluate", t`$\frac{\pi}{3}-\frac{\pi}{6}=\frac{\pi}{6}$`],
    ],
    check: { kind: "definite", f: "1/(1 + x**2)", a: "1/sqrt(3)", b: "sqrt(3)", value: "pi/6" },
  },
  {
    n: 397, d: "F", c: ["arcsin-form"],
    q: INDEF + t`
$$\int\frac{dx}{\sqrt{9-x^2}}$$`,
    hints: [t`Use $\int\frac{du}{\sqrt{a^2-u^2}}=\sin^{-1}\frac{u}{a}+C$ with $a=3$.`],
    a: t`$\sin^{-1}\dfrac{x}{3}+C$`,
    steps: [
      ["Match the form", t`$9-x^2=3^2-x^2$, so $a=3$ and $u=x$.`],
      ["Apply the formula", t`$\sin^{-1}\frac{x}{3}+C$`],
    ],
    check: { kind: "antiderivative", f: "1/sqrt(9 - x**2)", F: "asin(x/3)" },
  },
  {
    n: 399, d: "F", c: ["arctan-form"],
    q: INDEF + t`
$$\int\frac{dx}{9+x^2}$$`,
    hints: [t`Use $\int\frac{du}{a^2+u^2}=\frac1a\tan^{-1}\frac ua+C$ with $a=3$.`],
    a: t`$\dfrac13\tan^{-1}\dfrac{x}{3}+C$`,
    steps: [
      ["Match the form", t`$9+x^2=3^2+x^2$, so $a=3$.`],
      ["Apply the formula", t`$\frac13\tan^{-1}\frac x3+C$`],
    ],
    check: { kind: "antiderivative", f: "1/(9 + x**2)", F: "atan(x/3)/3" },
  },

  // ---------- Core ----------
  {
    n: 395, d: "C", c: ["arcsec-form", "inverse-trig-definite"],
    q: EVAL + t`
$$\int_{2/\sqrt3}^{\sqrt2}\frac{dx}{|x|\sqrt{x^2-1}}$$`,
    hints: [t`$\int\frac{dx}{|x|\sqrt{x^2-1}}=\sec^{-1}x+C$. Which angles have secant $\sqrt2$ and $\frac{2}{\sqrt3}$?`],
    a: t`$\dfrac{\pi}{12}$`,
    steps: [
      ["Antiderivative", t`$\left[\sec^{-1}x\right]_{2/\sqrt3}^{\sqrt2}$`],
      ["Inverse secant values", t`$\sec\frac{\pi}{4}=\sqrt2$ and $\sec\frac{\pi}{6}=\frac{2}{\sqrt3}$`],
      ["Subtract", t`$\frac{\pi}{4}-\frac{\pi}{6}=\frac{\pi}{12}$`],
    ],
    check: { kind: "definite", f: "1/(Abs(x)*sqrt(x**2 - 1))", a: "2/sqrt(3)", b: "sqrt(2)", value: "pi/12" },
  },
  {
    n: 398, d: "C", c: ["arcsin-form", "inverse-trig-usub"],
    q: INDEF + t`
$$\int\frac{dx}{\sqrt{1-16x^2}}$$`,
    hints: [t`$16x^2=(4x)^2$. Let $u=4x$, so $dx=\frac14du$.`],
    a: t`$\dfrac14\sin^{-1}(4x)+C$`,
    steps: [
      ["Substitute", t`$u=4x$: $\frac14\int\frac{du}{\sqrt{1-u^2}}$`],
      ["Integrate", t`$\frac14\sin^{-1}u+C=\frac14\sin^{-1}(4x)+C$`],
    ],
    check: { kind: "antiderivative", f: "1/sqrt(1 - 16*x**2)", F: "asin(4*x)/4" },
  },
  {
    n: 400, d: "C", c: ["arctan-form", "inverse-trig-usub"],
    q: INDEF + t`
$$\int\frac{dx}{25+16x^2}$$`,
    hints: [t`Write $16x^2=(4x)^2$ and let $u=4x$. Then use $\int\frac{du}{a^2+u^2}$ with $a=5$.`],
    a: t`$\dfrac{1}{20}\tan^{-1}\dfrac{4x}{5}+C$`,
    steps: [
      ["Substitute", t`$u=4x$, $dx=\frac14du$: $\frac14\int\frac{du}{5^2+u^2}$`],
      ["Apply the formula", t`$\frac14\cdot\frac15\tan^{-1}\frac u5=\frac{1}{20}\tan^{-1}\frac{4x}{5}+C$`],
    ],
    check: { kind: "antiderivative", f: "1/(25 + 16*x**2)", F: "atan(4*x/5)/20" },
  },
  {
    n: 401, d: "C", c: ["arcsec-form"],
    q: INDEF + t`
$$\int\frac{dx}{|x|\sqrt{x^2-9}}$$`,
    hints: [t`Use $\int\frac{du}{|u|\sqrt{u^2-a^2}}=\frac1a\sec^{-1}\frac{u}{a}+C$ with $a=3$.`],
    a: t`$\dfrac13\sec^{-1}\dfrac{x}{3}+C$`,
    steps: [
      ["Match the form", t`$x^2-9=x^2-3^2$, so $a=3$.`],
      ["Apply the formula", t`$\frac13\sec^{-1}\frac x3+C$ (valid for $|x|>3$)`],
    ],
    check: { kind: "antiderivative", f: "1/(Abs(x)*sqrt(x**2 - 9))", F: "asec(x/3)/3" },
  },
  {
    n: 405, d: "C", c: ["inverse-trig-concepts"],
    q: t`Explain what is wrong with the following integral.
$$\int_1^2\frac{dt}{\sqrt{1-t^2}}$$`,
    hints: [t`For which values of $t$ is $\sqrt{1-t^2}$ a real number? What is the domain of $\sin^{-1}t$?`],
    a: t`For $t>1$, $1-t^2<0$, so the integrand is not a real number on $(1,2]$, and at $t=1$ it is undefined. $\sin^{-1}2$ is also undefined. The integral does not make sense.`,
    steps: [
      ["Check the integrand", t`$1-t^2<0$ for $1<t\le2$, so $\sqrt{1-t^2}$ is not real there; at $t=1$ the denominator is 0.`],
      ["Check the antiderivative", t`$\sin^{-1}t$ is only defined for $-1\le t\le1$, so $\sin^{-1}2$ does not exist.`],
    ],
    check: { kind: "manual", note: "Conceptual: integrand undefined on (1, 2]." },
  },
  {
    n: 411, d: "C", c: ["inverse-trig-usub"],
    q: ANTI + t`
$$\int\frac{\sin^{-1}t}{\sqrt{1-t^2}}\,dt$$`,
    hints: [t`Let $u=\sin^{-1}t$. Then $du=\frac{dt}{\sqrt{1-t^2}}$.`],
    a: t`$\dfrac12\left(\sin^{-1}t\right)^2+C$`,
    steps: [
      ["Substitute", t`$u=\sin^{-1}t$: $\int u\,du$`],
      ["Integrate", t`$\frac{u^2}{2}+C=\frac12\left(\sin^{-1}t\right)^2+C$`],
    ],
    check: { kind: "antiderivative", f: "asin(t)/sqrt(1 - t**2)", F: "asin(t)**2/2", var: "t" },
  },
  {
    n: 413, d: "C", c: ["inverse-trig-usub"],
    q: ANTI + t`
$$\int\frac{\tan^{-1}(2t)}{1+4t^2}\,dt$$`,
    hints: [t`Let $u=\tan^{-1}(2t)$. Then $du=\frac{2}{1+4t^2}\,dt$.`],
    a: t`$\dfrac14\left(\tan^{-1}(2t)\right)^2+C$`,
    steps: [
      ["Find du", t`$du=\frac{1}{1+(2t)^2}\cdot2\,dt$, so $\frac{dt}{1+4t^2}=\frac12du$.`],
      ["Substitute and integrate", t`$\frac12\int u\,du=\frac{u^2}{4}$`],
      ["Back-substitute", t`$\frac14\left(\tan^{-1}(2t)\right)^2+C$`],
    ],
    check: { kind: "antiderivative", f: "atan(2*t)/(1 + 4*t**2)", F: "atan(2*t)**2/4", var: "t" },
  },
  {
    n: 423, d: "C", c: ["arcsin-form", "inverse-trig-usub"],
    q: t`Compute the integral using an appropriate substitution.
$$\int\frac{e^t}{\sqrt{1-e^{2t}}}\,dt$$`,
    hints: [t`$e^{2t}=\left(e^t\right)^2$. Let $u=e^t$.`],
    a: t`$\sin^{-1}\left(e^t\right)+C$`,
    steps: [
      ["Substitute", t`$u=e^t$, $du=e^t\,dt$: $\int\frac{du}{\sqrt{1-u^2}}$`],
      ["Integrate", t`$\sin^{-1}u+C=\sin^{-1}\left(e^t\right)+C$`],
    ],
    check: { kind: "antiderivative", f: "exp(t)/sqrt(1 - exp(2*t))", F: "asin(exp(t))", var: "t" },
  },
  {
    n: 424, d: "C", c: ["arctan-form", "inverse-trig-usub"],
    q: t`Compute the integral using an appropriate substitution.
$$\int\frac{e^t}{1+e^{2t}}\,dt$$`,
    hints: [t`Let $u=e^t$, so $e^{2t}=u^2$.`],
    a: t`$\tan^{-1}\left(e^t\right)+C$`,
    steps: [
      ["Substitute", t`$u=e^t$, $du=e^t\,dt$: $\int\frac{du}{1+u^2}$`],
      ["Integrate", t`$\tan^{-1}\left(e^t\right)+C$`],
    ],
    check: { kind: "antiderivative", f: "exp(t)/(1 + exp(2*t))", F: "atan(exp(t))", var: "t" },
  },
  {
    n: 426, d: "C", c: ["arctan-form", "inverse-trig-usub"],
    q: t`Compute the integral using an appropriate substitution.
$$\int\frac{dt}{t\left(1+\ln^2t\right)}$$`,
    hints: [t`Let $u=\ln t$. Then $du=\frac{dt}{t}$.`],
    a: t`$\tan^{-1}(\ln t)+C$`,
    steps: [
      ["Substitute", t`$u=\ln t$: $\int\frac{du}{1+u^2}$`],
      ["Integrate", t`$\tan^{-1}u+C=\tan^{-1}(\ln t)+C$`],
    ],
    check: { kind: "antiderivative", f: "1/(t*(1 + log(t)**2))", F: "atan(log(t))", var: "t" },
  },
  {
    n: 433, d: "C", c: ["arctan-form", "inverse-trig-definite"],
    q: t`For $A>0$, compute $I(A)=\displaystyle\int_{-A}^{A}\frac{dt}{1+t^2}$ and evaluate $\displaystyle\lim_{A\to\infty}I(A)$, the area under the graph of $\frac{1}{1+t^2}$ on $(-\infty,\infty)$.`,
    hints: [t`$\tan^{-1}(-A)=-\tan^{-1}A$. As $A\to\infty$, $\tan^{-1}A\to\frac{\pi}{2}$.`],
    a: t`$I(A)=2\tan^{-1}A$, and $\lim_{A\to\infty}I(A)=\pi$.`,
    steps: [
      ["Evaluate", t`$I(A)=\tan^{-1}A-\tan^{-1}(-A)=2\tan^{-1}A$`],
      ["Take the limit", t`$\tan^{-1}A\to\frac{\pi}{2}$, so $I(A)\to2\cdot\frac{\pi}{2}=\pi$.`],
    ],
    check: [
      { kind: "value", expr: "integrate(1/(1 + t**2), (t, -A, A))", value: "2*atan(A)" },
      { kind: "value", expr: "limit(2*atan(A), A, oo)", value: "pi" },
    ],
  },

  // ---------- Challenge ----------
  {
    n: 402, d: "Ch", c: ["arcsec-form", "inverse-trig-usub"],
    q: INDEF + t`
$$\int\frac{dx}{|x|\sqrt{4x^2-16}}$$`,
    hints: [
      t`Factor inside the root: $4x^2-16=4\left(x^2-4\right)$, so $\sqrt{4x^2-16}=2\sqrt{x^2-4}$.`,
      t`Then use the arcsecant form with $a=2$.`,
    ],
    a: t`$\dfrac14\sec^{-1}\dfrac{x}{2}+C$`,
    steps: [
      ["Simplify the root", t`$\int\frac{dx}{|x|\cdot2\sqrt{x^2-4}}=\frac12\int\frac{dx}{|x|\sqrt{x^2-2^2}}$`],
      ["Arcsecant form", t`$\frac12\cdot\frac12\sec^{-1}\frac x2+C=\frac14\sec^{-1}\frac x2+C$`],
    ],
    check: { kind: "antiderivative", f: "1/(Abs(x)*sqrt(4*x**2 - 16))", F: "asec(x/2)/4" },
  },
  {
    n: 403, d: "Ch", c: ["inverse-trig-concepts"],
    q: t`Explain the relationship $-\cos^{-1}t+C=\displaystyle\int\frac{dt}{\sqrt{1-t^2}}=\sin^{-1}t+C$. Is it true, in general, that $\cos^{-1}t=-\sin^{-1}t$?`,
    hints: [t`Two antiderivatives of the same function differ by a constant. What is $\sin^{-1}t+\cos^{-1}t$?`],
    a: t`Both $\sin^{-1}t$ and $-\cos^{-1}t$ have derivative $\frac{1}{\sqrt{1-t^2}}$, so they differ by a constant: $\sin^{-1}t+\cos^{-1}t=\frac{\pi}{2}$. So no, $\cos^{-1}t\ne-\sin^{-1}t$; instead $\cos^{-1}t=\frac{\pi}{2}-\sin^{-1}t$. The two $C$'s are different constants.`,
    steps: [
      ["Same derivative", t`$\frac{d}{dt}\sin^{-1}t=\frac{1}{\sqrt{1-t^2}}$ and $\frac{d}{dt}\left(-\cos^{-1}t\right)=\frac{1}{\sqrt{1-t^2}}$.`],
      ["Antiderivatives differ by a constant", t`So $\sin^{-1}t-\left(-\cos^{-1}t\right)$ is constant. At $t=0$ it equals $0+\frac{\pi}{2}$.`],
      ["Conclusion", t`$\sin^{-1}t+\cos^{-1}t=\frac{\pi}{2}$, so $\cos^{-1}t=-\sin^{-1}t$ is false (for example at $t=0$: $\frac{\pi}{2}\neq0$).`],
    ],
    check: { kind: "value", expr: "asin(x) + acos(x)", value: "pi/2" },
  },
  {
    n: 429, d: "Ch", c: ["inverse-trig-definite", "inverse-trig-usub"],
    q: t`Compute the definite integral.
$$\int_0^{1/2}\frac{\tan\left(\sin^{-1}t\right)}{\sqrt{1-t^2}}\,dt$$`,
    hints: [
      t`Let $u=\sin^{-1}t$, so $du=\frac{dt}{\sqrt{1-t^2}}$. New limits: $0$ and $\frac{\pi}{6}$.`,
      t`$\int\tan u\,du=-\ln|\cos u|+C$.`,
    ],
    a: t`$\ln\dfrac{2}{\sqrt3}=\dfrac12\ln\dfrac43\approx0.144$`,
    steps: [
      ["Substitute", t`$u=\sin^{-1}t$: $\int_0^{\pi/6}\tan u\,du$`],
      ["Integrate", t`$\left[-\ln|\cos u|\right]_0^{\pi/6}=-\ln\frac{\sqrt3}{2}+\ln1$`],
      ["Simplify", t`$\ln\frac{2}{\sqrt3}=\frac12\ln\frac43$`],
    ],
    check: { kind: "definite", f: "tan(asin(t))/sqrt(1 - t**2)", a: "0", b: "1/2", value: "log(2/sqrt(3))", var: "t" },
  },
  {
    n: 431, d: "Ch", c: ["inverse-trig-definite", "inverse-trig-usub"],
    q: t`Compute the definite integral.
$$\int_0^{1/2}\frac{\sin\left(\tan^{-1}t\right)}{1+t^2}\,dt$$`,
    hints: [
      t`Let $u=\tan^{-1}t$, so $du=\frac{dt}{1+t^2}$. The new upper limit is $\tan^{-1}\frac12$.`,
      t`To find $\cos\left(\tan^{-1}\frac12\right)$, draw a right triangle with opposite side 1 and adjacent side 2.`,
    ],
    a: t`$1-\dfrac{2}{\sqrt5}\approx0.106$`,
    steps: [
      ["Substitute", t`$\int_0^{\tan^{-1}(1/2)}\sin u\,du=\left[-\cos u\right]_0^{\tan^{-1}(1/2)}$`],
      ["Right triangle", t`With opposite 1 and adjacent 2, the hypotenuse is $\sqrt5$, so $\cos\left(\tan^{-1}\frac12\right)=\frac{2}{\sqrt5}$.`],
      ["Evaluate", t`$-\frac{2}{\sqrt5}+\cos0=1-\frac{2}{\sqrt5}$`],
    ],
    check: { kind: "definite", f: "sin(atan(t))/(1 + t**2)", a: "0", b: "1/2", value: "1 - 2/sqrt(5)", var: "t" },
  },
  {
    n: "o1", d: "Ch", c: ["arctan-form", "inverse-trig-usub"],
    q: t`Complete the square, then find the integral. (Original practice problem in the style of Section 5.7.)
$$\int\frac{dx}{x^2+2x+5}$$`,
    hints: [
      t`$x^2+2x+5=(x+1)^2+4$.`,
      t`Let $u=x+1$ and use $\int\frac{du}{a^2+u^2}=\frac1a\tan^{-1}\frac ua+C$ with $a=2$.`,
    ],
    a: t`$\dfrac12\tan^{-1}\dfrac{x+1}{2}+C$`,
    steps: [
      ["Complete the square", t`$x^2+2x+5=(x^2+2x+1)+4=(x+1)^2+2^2$`],
      ["Substitute", t`$u=x+1$, $du=dx$: $\int\frac{du}{u^2+2^2}$`],
      ["Arctangent form", t`$\frac12\tan^{-1}\frac{u}{2}+C=\frac12\tan^{-1}\frac{x+1}{2}+C$`],
    ],
    check: { kind: "antiderivative", f: "1/(x**2 + 2*x + 5)", F: "atan((x + 1)/2)/2" },
  },
]);
