import { sectionProblems, t } from "../helpers";

const INDEF = t`Compute the indefinite integral.`;
const SUBS = t`Find the indefinite integral using an appropriate substitution.`;

export default sectionProblems("5.6", [
  // ---------- Foundation ----------
  {
    n: 320, d: "F", c: ["exp-basic"],
    q: INDEF + t`
$$\int e^{2x}\,dx$$`,
    hints: [t`$\int e^{kx}\,dx=\frac1ke^{kx}+C$. (Or substitute $u=2x$.)`],
    a: t`$\dfrac12e^{2x}+C$`,
    steps: [
      ["Substitute", t`$u=2x$, $dx=\frac12du$: $\frac12\int e^u\,du$`],
      ["Integrate", t`$\frac12e^u+C=\frac12e^{2x}+C$`],
    ],
    check: { kind: "antiderivative", f: "exp(2*x)", F: "exp(2*x)/2" },
  },
  {
    n: 321, d: "F", c: ["exp-basic"],
    q: INDEF + t`
$$\int e^{-3x}\,dx$$`,
    hints: [t`Use $\int e^{kx}\,dx=\frac1ke^{kx}+C$ with $k=-3$.`],
    a: t`$-\dfrac13e^{-3x}+C$`,
    steps: [
      ["Apply the rule", t`$\int e^{-3x}\,dx=\frac{1}{-3}e^{-3x}+C$`],
      ["Check", t`$\frac{d}{dx}\left(-\frac13e^{-3x}\right)=-\frac13\cdot(-3)e^{-3x}=e^{-3x}$`],
    ],
    check: { kind: "antiderivative", f: "exp(-3*x)", F: "-exp(-3*x)/3" },
  },
  {
    n: 322, d: "F", c: ["exp-basic"],
    q: INDEF + t`
$$\int 2^x\,dx$$`,
    hints: [t`$\frac{d}{dx}a^x=a^x\ln a$, so $\int a^x\,dx=\frac{a^x}{\ln a}+C$.`],
    a: t`$\dfrac{2^x}{\ln2}+C$`,
    steps: [
      ["Recall the derivative", t`$\frac{d}{dx}2^x=2^x\ln2$`],
      ["Divide out the constant", t`$\int2^x\,dx=\frac{2^x}{\ln2}+C$`],
    ],
    check: { kind: "antiderivative", f: "2**x", F: "2**x/log(2)" },
  },
  {
    n: 325, d: "F", c: ["log-basic"],
    q: INDEF + t`
$$\int\frac{2}{x}\,dx$$`,
    hints: [t`$\int\frac1x\,dx=\ln|x|+C$.`],
    a: t`$2\ln|x|+C$`,
    steps: [
      ["Factor the constant", t`$2\int\frac1x\,dx$`],
      ["Log rule", t`$2\ln|x|+C$`],
    ],
    check: { kind: "antiderivative", f: "2/x", F: "2*log(Abs(x))" },
  },
  {
    n: 338, d: "F", c: ["exp-usub"],
    q: SUBS + t`
$$\int e^{\sin x}\cos x\,dx$$`,
    hints: [t`Let $u=\sin x$; then $du=\cos x\,dx$.`],
    a: t`$e^{\sin x}+C$`,
    steps: [
      ["Substitute", t`$u=\sin x$: $\int e^u\,du$`],
      ["Integrate", t`$e^u+C=e^{\sin x}+C$`],
    ],
    check: { kind: "antiderivative", f: "exp(sin(x))*cos(x)", F: "exp(sin(x))" },
  },
  {
    n: 339, d: "F", c: ["exp-usub"],
    q: SUBS + t`
$$\int e^{\tan x}\sec^2x\,dx$$`,
    hints: [t`Let $u=\tan x$; then $du=\sec^2x\,dx$.`],
    a: t`$e^{\tan x}+C$`,
    steps: [
      ["Substitute", t`$u=\tan x$: $\int e^u\,du$`],
      ["Integrate", t`$e^{\tan x}+C$`],
    ],
    check: { kind: "antiderivative", f: "exp(tan(x))*sec(x)**2", F: "exp(tan(x))" },
  },
  {
    n: 340, d: "F", c: ["exp-basic", "log-basic"],
    q: SUBS + t`
$$\int e^{\ln x}\,\frac{dx}{x}$$`,
    hints: [t`Simplify first: $e^{\ln x}=x$ for $x>0$.`],
    a: t`$x+C$`,
    steps: [
      ["Simplify", t`$e^{\ln x}\cdot\frac1x=x\cdot\frac1x=1$`],
      ["Integrate", t`$\int1\,dx=x+C$`],
    ],
    check: { kind: "antiderivative", f: "exp(log(x))/x", F: "x" },
  },

  // ---------- Core ----------
  {
    n: 323, d: "C", c: ["exp-basic"],
    q: INDEF + t`
$$\int 3^{-x}\,dx$$`,
    hints: [t`$\frac{d}{dx}3^{-x}=-3^{-x}\ln3$ (chain rule).`],
    a: t`$-\dfrac{3^{-x}}{\ln3}+C$`,
    steps: [
      ["Differentiate a guess", t`$\frac{d}{dx}3^{-x}=3^{-x}\ln3\cdot(-1)$`],
      ["Adjust the constant", t`$\int3^{-x}\,dx=-\frac{3^{-x}}{\ln3}+C$`],
    ],
    check: { kind: "antiderivative", f: "3**(-x)", F: "-3**(-x)/log(3)" },
  },
  {
    n: 328, d: "C", c: ["log-usub"],
    q: SUBS + t`
$$\int\frac{\ln x}{x}\,dx$$`,
    hints: [t`Let $u=\ln x$; then $du=\frac1x\,dx$.`],
    a: t`$\dfrac{(\ln x)^2}{2}+C$`,
    steps: [
      ["Substitute", t`$u=\ln x$: $\int u\,du$`],
      ["Integrate", t`$\frac{u^2}{2}+C=\frac{(\ln x)^2}{2}+C$`],
    ],
    check: { kind: "antiderivative", f: "log(x)/x", F: "log(x)**2/2" },
  },
  {
    n: 330, d: "C", c: ["log-usub"],
    q: SUBS + t`
$$\int\frac{dx}{x\ln x}\qquad(x>1)$$`,
    hints: [t`Let $u=\ln x$. The integral becomes $\int\frac{du}{u}$.`],
    a: t`$\ln\left|\ln x\right|+C$`,
    steps: [
      ["Substitute", t`$u=\ln x$, $du=\frac{dx}{x}$: $\int\frac{du}{u}$`],
      ["Integrate", t`$\ln|u|+C=\ln|\ln x|+C$ (for $x>1$, simply $\ln(\ln x)+C$)`],
    ],
    check: { kind: "antiderivative", f: "1/(x*log(x))", F: "log(Abs(log(x)))" },
  },
  {
    n: 332, d: "C", c: ["trig-log"],
    q: SUBS + t`
$$\int\tan\theta\,d\theta$$`,
    hints: [t`Write $\tan\theta=\frac{\sin\theta}{\cos\theta}$ and let $u=\cos\theta$.`],
    a: t`$-\ln|\cos\theta|+C=\ln|\sec\theta|+C$`,
    steps: [
      ["Rewrite", t`$\int\frac{\sin\theta}{\cos\theta}\,d\theta$`],
      ["Substitute", t`$u=\cos\theta$, $du=-\sin\theta\,d\theta$: $-\int\frac{du}{u}$`],
      ["Integrate", t`$-\ln|u|+C=-\ln|\cos\theta|+C=\ln|\sec\theta|+C$`],
    ],
    check: { kind: "antiderivative", f: "tan(theta)", F: "-log(Abs(cos(theta)))", var: "theta" },
  },
  {
    n: 336, d: "C", c: ["exp-usub"],
    q: SUBS + t`
$$\int xe^{-x^2}\,dx$$`,
    hints: [t`Let $u=-x^2$; then $du=-2x\,dx$.`],
    a: t`$-\dfrac12e^{-x^2}+C$`,
    steps: [
      ["Substitute", t`$x\,dx=-\frac12du$: $-\frac12\int e^u\,du$`],
      ["Integrate", t`$-\frac12e^u+C=-\frac12e^{-x^2}+C$`],
    ],
    check: { kind: "antiderivative", f: "x*exp(-x**2)", F: "-exp(-x**2)/2" },
  },
  {
    n: 337, d: "C", c: ["exp-usub"],
    q: SUBS + t`
$$\int x^2e^{-x^3}\,dx$$`,
    hints: [t`Let $u=-x^3$; then $x^2\,dx=-\frac13du$.`],
    a: t`$-\dfrac13e^{-x^3}+C$`,
    steps: [
      ["Substitute", t`$-\frac13\int e^u\,du$`],
      ["Integrate", t`$-\frac13e^{-x^3}+C$`],
    ],
    check: { kind: "antiderivative", f: "x**2*exp(-x**3)", F: "-exp(-x**3)/3" },
  },
  {
    n: 348, d: "C", c: ["trig-log"],
    q: t`Use an appropriate substitution to express the integral in terms of a logarithm.
$$\int\tan(2x)\,dx$$`,
    hints: [t`Write $\tan(2x)=\frac{\sin2x}{\cos2x}$ and let $u=\cos(2x)$, so $du=-2\sin(2x)\,dx$.`],
    a: t`$-\dfrac12\ln\left|\cos(2x)\right|+C$`,
    steps: [
      ["Substitute", t`$\sin(2x)\,dx=-\frac12du$: $-\frac12\int\frac{du}{u}$`],
      ["Integrate", t`$-\frac12\ln|u|+C=-\frac12\ln|\cos(2x)|+C$`],
    ],
    check: { kind: "antiderivative", f: "tan(2*x)", F: "-log(Abs(cos(2*x)))/2" },
  },
  {
    n: 356, d: "C", c: ["trig-log", "explog-definite"],
    q: t`Evaluate the definite integral.
$$\int_0^{\pi/4}\tan x\,dx$$`,
    hints: [t`An antiderivative of $\tan x$ is $-\ln|\cos x|$.`],
    a: t`$\dfrac12\ln2$`,
    steps: [
      ["Antiderivative", t`$\left[-\ln|\cos x|\right]_0^{\pi/4}$`],
      ["Evaluate", t`$-\ln\frac{\sqrt2}{2}+\ln1=-\ln\frac{\sqrt2}{2}=\ln\sqrt2=\frac12\ln2\approx0.347$`],
    ],
    check: { kind: "definite", f: "tan(x)", a: "0", b: "pi/4", value: "log(2)/2" },
  },
  {
    n: 359, d: "C", c: ["trig-log", "explog-definite"],
    q: t`Evaluate the definite integral.
$$\int_{\pi/4}^{\pi/3}\cot x\,dx$$`,
    hints: [t`$\cot x=\frac{\cos x}{\sin x}$, so an antiderivative is $\ln|\sin x|$.`],
    a: t`$\dfrac12\ln\dfrac32$`,
    steps: [
      ["Antiderivative", t`$\left[\ln|\sin x|\right]_{\pi/4}^{\pi/3}$`],
      ["Evaluate", t`$\ln\frac{\sqrt3}{2}-\ln\frac{\sqrt2}{2}=\ln\frac{\sqrt3}{\sqrt2}=\frac12\ln\frac32\approx0.203$`],
    ],
    check: { kind: "definite", f: "cot(x)", a: "pi/4", b: "pi/3", value: "log(Rational(3,2))/2" },
  },
  {
    n: 374, d: "C", c: ["exp-basic", "explog-definite"],
    q: t`Find the area under the graph of $f(x)$ between $a$ and $b$ by integrating.
$$f(x)=2^{-x};\qquad a=1,\ b=2$$`,
    hints: [t`$\int2^{-x}\,dx=-\frac{2^{-x}}{\ln2}+C$.`],
    a: t`$\dfrac{1}{4\ln2}\approx0.361$`,
    steps: [
      ["Antiderivative", t`$\left[-\frac{2^{-x}}{\ln2}\right]_1^2$`],
      ["Evaluate", t`$-\frac{1/4}{\ln2}+\frac{1/2}{\ln2}=\frac{1/4}{\ln2}=\frac{1}{4\ln2}$`],
    ],
    check: { kind: "definite", f: "2**(-x)", a: "1", b: "2", value: "1/(4*log(2))" },
  },

  // ---------- Challenge ----------
  {
    n: 333, d: "Ch", c: ["log-usub"],
    q: SUBS + t`
$$\int\frac{\cos x-x\sin x}{x\cos x}\,dx$$`,
    hints: [t`Differentiate the denominator $x\cos x$ with the product rule. What do you notice?`],
    a: t`$\ln\left|x\cos x\right|+C$`,
    steps: [
      ["Spot the derivative", t`$\frac{d}{dx}(x\cos x)=\cos x-x\sin x$, exactly the numerator.`],
      ["Substitute", t`$u=x\cos x$: $\int\frac{du}{u}$`],
      ["Integrate", t`$\ln|u|+C=\ln|x\cos x|+C$`],
    ],
    check: { kind: "antiderivative", f: "(cos(x) - x*sin(x))/(x*cos(x))", F: "log(Abs(x*cos(x)))" },
  },
  {
    n: 349, d: "Ch", c: ["trig-log", "log-usub"],
    q: t`Use an appropriate substitution to express the integral in terms of a logarithm.
$$\int\frac{\sin(3x)-\cos(3x)}{\sin(3x)+\cos(3x)}\,dx$$`,
    hints: [t`Let $u=\sin(3x)+\cos(3x)$. Compute $du$ and compare it with the numerator.`],
    a: t`$-\dfrac13\ln\left|\sin(3x)+\cos(3x)\right|+C$`,
    steps: [
      ["Find du", t`$du=\left(3\cos3x-3\sin3x\right)dx=-3\left(\sin3x-\cos3x\right)dx$`],
      ["Substitute", t`The numerator times $dx$ is $-\frac13du$: $-\frac13\int\frac{du}{u}$`],
      ["Integrate", t`$-\frac13\ln|\sin3x+\cos3x|+C$`],
    ],
    check: { kind: "antiderivative", f: "(sin(3*x) - cos(3*x))/(sin(3*x) + cos(3*x))", F: "-log(Abs(sin(3*x) + cos(3*x)))/3" },
  },
  {
    n: 354, d: "Ch", c: ["log-usub", "exp-usub"],
    q: t`Use an appropriate substitution to express the integral in terms of a logarithm.
$$\int\frac{e^x-e^{-x}}{e^x+e^{-x}}\,dx$$`,
    hints: [t`What is the derivative of the denominator $e^x+e^{-x}$?`],
    a: t`$\ln\left(e^x+e^{-x}\right)+C$`,
    steps: [
      ["Spot the derivative", t`$\frac{d}{dx}\left(e^x+e^{-x}\right)=e^x-e^{-x}$, the numerator.`],
      ["Substitute", t`$u=e^x+e^{-x}$: $\int\frac{du}{u}=\ln|u|+C$`],
      ["Simplify", t`$u>0$ always, so the answer is $\ln\left(e^x+e^{-x}\right)+C$.`],
    ],
    check: { kind: "antiderivative", f: "(exp(x) - exp(-x))/(exp(x) + exp(-x))", F: "log(exp(x) + exp(-x))" },
  },
  {
    n: 355, d: "Ch", c: ["log-usub", "explog-definite"],
    q: t`Evaluate the definite integral.
$$\int_1^2\frac{1+2x+x^2}{3x+3x^2+x^3}\,dx$$`,
    hints: [
      t`Let $u=3x+3x^2+x^3$. Then $du=(3+6x+3x^2)\,dx=3(1+2x+x^2)\,dx$.`,
      t`Change the limits: $u(1)=7$ and $u(2)=26$.`,
    ],
    a: t`$\dfrac13\ln\dfrac{26}{7}\approx0.438$`,
    steps: [
      ["Substitute", t`$(1+2x+x^2)\,dx=\frac13du$, limits $7$ to $26$: $\frac13\int_7^{26}\frac{du}{u}$`],
      ["Integrate", t`$\frac13\left[\ln u\right]_7^{26}=\frac13\left(\ln26-\ln7\right)=\frac13\ln\frac{26}{7}$`],
    ],
    check: { kind: "definite", f: "(1 + 2*x + x**2)/(3*x + 3*x**2 + x**3)", a: "1", b: "2", value: "log(Rational(26,7))/3" },
  },
  {
    n: 364, d: "Ch", c: ["exp-usub"],
    q: t`Integrate using the indicated substitution.
$$\int e^{2x}\sqrt{1-e^{2x}}\,dx;\qquad u=e^{2x}$$`,
    hints: [t`$du=2e^{2x}\,dx$, so $e^{2x}\,dx=\frac12du$. The integral becomes $\frac12\int\sqrt{1-u}\,du$.`],
    a: t`$-\dfrac13\left(1-e^{2x}\right)^{3/2}+C$`,
    steps: [
      ["Substitute", t`$\frac12\int(1-u)^{1/2}\,du$`],
      ["Integrate (inner function 1 − u)", t`$\frac12\cdot\left(-\frac23\right)(1-u)^{3/2}=-\frac13(1-u)^{3/2}$`],
      ["Back-substitute", t`$-\frac13\left(1-e^{2x}\right)^{3/2}+C$`],
    ],
    check: { kind: "antiderivative", f: "exp(2*x)*sqrt(1 - exp(2*x))", F: "-(1 - exp(2*x))**(Rational(3,2))/3" },
  },
]);
