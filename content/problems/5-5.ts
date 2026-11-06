import { sectionProblems, t } from "../helpers";

const SUB = t`Find the antiderivative using the indicated substitution.`;
const CHANGE = t`Use a suitable change of variables to find the indefinite integral.`;
const DEF = t`Use a change of variables to evaluate the definite integral.`;

export default sectionProblems("5.5", [
  // ---------- Foundation ----------
  {
    n: 261, d: "F", c: ["usub-linear"],
    q: SUB + t`
$$\int(x+1)^4\,dx;\qquad u=x+1$$`,
    hints: [t`With $u=x+1$, $du=dx$. The integral becomes $\int u^4\,du$.`],
    a: t`$\dfrac{(x+1)^5}{5}+C$`,
    steps: [
      ["Substitute", t`$u=x+1$, $du=dx$: $\int u^4\,du$`],
      ["Integrate", t`$\frac{u^5}{5}+C$`],
      ["Back-substitute", t`$\frac{(x+1)^5}{5}+C$`],
    ],
    check: { kind: "antiderivative", f: "(x + 1)**4", F: "(x + 1)**5/5" },
  },
  {
    n: 263, d: "F", c: ["usub-linear"],
    q: SUB + t`
$$\int(2x-3)^{-7}\,dx;\qquad u=2x-3$$`,
    hints: [t`$du=2\,dx$, so $dx=\frac12du$.`],
    a: t`$-\dfrac{1}{12(2x-3)^6}+C$`,
    steps: [
      ["Substitute", t`$u=2x-3$, $dx=\frac12du$: $\frac12\int u^{-7}\,du$`],
      ["Integrate", t`$\frac12\cdot\frac{u^{-6}}{-6}=-\frac{1}{12}u^{-6}$`],
      ["Back-substitute", t`$-\frac{1}{12(2x-3)^6}+C$`],
    ],
    check: { kind: "antiderivative", f: "(2*x - 3)**-7", F: "-1/(12*(2*x - 3)**6)" },
  },
  {
    n: 265, d: "F", c: ["usub-indefinite"],
    q: SUB + t`
$$\int\frac{x}{\sqrt{x^2+1}}\,dx;\qquad u=x^2+1$$`,
    hints: [t`$du=2x\,dx$, so $x\,dx=\frac12du$.`],
    a: t`$\sqrt{x^2+1}+C$`,
    steps: [
      ["Substitute", t`$x\,dx=\frac12du$: $\frac12\int u^{-1/2}\,du$`],
      ["Integrate", t`$\frac12\cdot2u^{1/2}=u^{1/2}$`],
      ["Back-substitute", t`$\sqrt{x^2+1}+C$`],
    ],
    check: { kind: "antiderivative", f: "x/sqrt(x**2 + 1)", F: "sqrt(x**2 + 1)" },
  },
  {
    n: 267, d: "F", c: ["usub-indefinite"],
    q: SUB + t`
$$\int(x-1)\left(x^2-2x\right)^3dx;\qquad u=x^2-2x$$`,
    hints: [t`$du=(2x-2)\,dx=2(x-1)\,dx$, so $(x-1)\,dx=\frac12du$.`],
    a: t`$\dfrac{\left(x^2-2x\right)^4}{8}+C$`,
    steps: [
      ["Find du", t`$du=(2x-2)\,dx$, so $(x-1)\,dx=\frac12du$.`],
      ["Substitute and integrate", t`$\frac12\int u^3\,du=\frac12\cdot\frac{u^4}{4}=\frac{u^4}{8}$`],
      ["Back-substitute", t`$\frac{(x^2-2x)^4}{8}+C$`],
    ],
    check: { kind: "antiderivative", f: "(x - 1)*(x**2 - 2*x)**3", F: "(x**2 - 2*x)**4/8" },
  },
  {
    n: 274, d: "F", c: ["usub-linear"],
    q: CHANGE + t`
$$\int(7x-11)^4\,dx$$`,
    hints: [t`Let $u=7x-11$, so $du=7\,dx$.`],
    a: t`$\dfrac{(7x-11)^5}{35}+C$`,
    steps: [
      ["Substitute", t`$u=7x-11$, $dx=\frac17du$: $\frac17\int u^4\,du$`],
      ["Integrate", t`$\frac17\cdot\frac{u^5}{5}=\frac{u^5}{35}$`],
      ["Back-substitute", t`$\frac{(7x-11)^5}{35}+C$`],
    ],
    check: { kind: "antiderivative", f: "(7*x - 11)**4", F: "(7*x - 11)**5/35" },
  },
  {
    n: 276, d: "F", c: ["usub-trig"],
    q: CHANGE + t`
$$\int\sin^7\theta\cos\theta\,d\theta$$`,
    hints: [t`Let $u=\sin\theta$. Then $du=\cos\theta\,d\theta$ is already in the integral.`],
    a: t`$\dfrac{\sin^8\theta}{8}+C$`,
    steps: [
      ["Substitute", t`$u=\sin\theta$, $du=\cos\theta\,d\theta$: $\int u^7\,du$`],
      ["Integrate and back-substitute", t`$\frac{u^8}{8}+C=\frac{\sin^8\theta}{8}+C$`],
    ],
    check: { kind: "antiderivative", f: "sin(theta)**7*cos(theta)", F: "sin(theta)**8/8", var: "theta" },
  },

  // ---------- Core ----------
  {
    n: 266, d: "C", c: ["usub-indefinite"],
    q: SUB + t`
$$\int\frac{x}{\sqrt{1-x^2}}\,dx;\qquad u=1-x^2$$`,
    hints: [t`$du=-2x\,dx$, so $x\,dx=-\frac12du$. Watch the sign.`],
    a: t`$-\sqrt{1-x^2}+C$`,
    steps: [
      ["Substitute", t`$x\,dx=-\frac12du$: $-\frac12\int u^{-1/2}\,du$`],
      ["Integrate", t`$-\frac12\cdot2u^{1/2}=-u^{1/2}$`],
      ["Back-substitute", t`$-\sqrt{1-x^2}+C$`],
    ],
    check: { kind: "antiderivative", f: "x/sqrt(1 - x**2)", F: "-sqrt(1 - x**2)" },
  },
  {
    n: 275, d: "C", c: ["usub-trig"],
    q: CHANGE + t`
$$\int\cos^3\theta\sin\theta\,d\theta$$`,
    hints: [t`Let $u=\cos\theta$, so $du=-\sin\theta\,d\theta$.`],
    a: t`$-\dfrac{\cos^4\theta}{4}+C$`,
    steps: [
      ["Substitute", t`$\sin\theta\,d\theta=-du$: $-\int u^3\,du$`],
      ["Integrate", t`$-\frac{u^4}{4}+C$`],
      ["Back-substitute", t`$-\frac{\cos^4\theta}{4}+C$`],
    ],
    check: { kind: "antiderivative", f: "cos(theta)**3*sin(theta)", F: "-cos(theta)**4/4", var: "theta" },
  },
  {
    n: 277, d: "C", c: ["usub-trig"],
    q: CHANGE + t`
$$\int\cos^2(\pi t)\sin(\pi t)\,dt$$`,
    hints: [t`Let $u=\cos(\pi t)$. Then $du=-\pi\sin(\pi t)\,dt$.`],
    a: t`$-\dfrac{\cos^3(\pi t)}{3\pi}+C$`,
    steps: [
      ["Find du", t`$du=-\pi\sin(\pi t)\,dt$, so $\sin(\pi t)\,dt=-\frac{1}{\pi}du$.`],
      ["Substitute and integrate", t`$-\frac1\pi\int u^2\,du=-\frac{u^3}{3\pi}$`],
      ["Back-substitute", t`$-\frac{\cos^3(\pi t)}{3\pi}+C$`],
    ],
    check: { kind: "antiderivative", f: "cos(pi*t)**2*sin(pi*t)", F: "-cos(pi*t)**3/(3*pi)", var: "t" },
  },
  {
    n: 279, d: "C", c: ["usub-trig"],
    q: CHANGE + t`
$$\int t\sin\left(t^2\right)\cos\left(t^2\right)dt$$`,
    hints: [t`Let $u=\sin(t^2)$. Then $du=2t\cos(t^2)\,dt$.`],
    a: t`$\dfrac{\sin^2\left(t^2\right)}{4}+C$`,
    steps: [
      ["Find du", t`$du=\cos(t^2)\cdot2t\,dt$, so $t\cos(t^2)\,dt=\frac12du$.`],
      ["Substitute and integrate", t`$\frac12\int u\,du=\frac{u^2}{4}$`],
      ["Back-substitute", t`$\frac{\sin^2(t^2)}{4}+C$`],
    ],
    check: { kind: "antiderivative", f: "t*sin(t**2)*cos(t**2)", F: "sin(t**2)**2/4", var: "t" },
  },
  {
    n: 281, d: "C", c: ["usub-indefinite"],
    q: CHANGE + t`
$$\int\frac{x^2}{\left(x^3-3\right)^2}\,dx$$`,
    hints: [t`Let $u=x^3-3$; then $x^2\,dx=\frac13du$.`],
    a: t`$-\dfrac{1}{3\left(x^3-3\right)}+C$`,
    steps: [
      ["Substitute", t`$u=x^3-3$, $x^2\,dx=\frac13du$: $\frac13\int u^{-2}\,du$`],
      ["Integrate", t`$\frac13\cdot\frac{u^{-1}}{-1}=-\frac{1}{3u}$`],
      ["Back-substitute", t`$-\frac{1}{3(x^3-3)}+C$`],
    ],
    check: { kind: "antiderivative", f: "x**2/(x**3 - 3)**2", F: "-1/(3*(x**3 - 3))" },
  },
  {
    n: 292, d: "C", c: ["usub-definite"],
    q: DEF + t`
$$\int_0^1x\sqrt{1-x^2}\,dx$$`,
    hints: [
      t`Let $u=1-x^2$, so $x\,dx=-\frac12du$.`,
      t`Change the limits: $x=0\Rightarrow u=1$ and $x=1\Rightarrow u=0$.`,
    ],
    a: t`$\dfrac13$`,
    steps: [
      ["Substitute and change limits", t`$\int_0^1x\sqrt{1-x^2}\,dx=-\frac12\int_1^0u^{1/2}\,du=\frac12\int_0^1u^{1/2}\,du$`],
      ["Integrate", t`$\frac12\cdot\frac23\left[u^{3/2}\right]_0^1=\frac13$`],
    ],
    check: { kind: "definite", f: "x*sqrt(1 - x**2)", a: "0", b: "1", value: "1/3" },
  },
  {
    n: 293, d: "C", c: ["usub-definite"],
    q: DEF + t`
$$\int_0^1\frac{x}{\sqrt{1+x^2}}\,dx$$`,
    hints: [t`Let $u=1+x^2$. The limits become $u=1$ to $u=2$.`],
    a: t`$\sqrt2-1$`,
    steps: [
      ["Substitute", t`$x\,dx=\frac12du$: $\frac12\int_1^2u^{-1/2}\,du$`],
      ["Integrate", t`$\frac12\cdot2\left[u^{1/2}\right]_1^2=\sqrt2-1$`],
    ],
    check: { kind: "definite", f: "x/sqrt(1 + x**2)", a: "0", b: "1", value: "sqrt(2) - 1" },
  },
  {
    n: 295, d: "C", c: ["usub-definite"],
    q: DEF + t`
$$\int_0^1\frac{t^2}{\sqrt{1+t^3}}\,dt$$`,
    hints: [t`Let $u=1+t^3$; $t^2\,dt=\frac13du$, and the limits become $1$ to $2$.`],
    a: t`$\dfrac23\left(\sqrt2-1\right)$`,
    steps: [
      ["Substitute", t`$\frac13\int_1^2u^{-1/2}\,du$`],
      ["Integrate", t`$\frac13\cdot2\left[\sqrt u\right]_1^2=\frac23\left(\sqrt2-1\right)\approx0.276$`],
    ],
    check: { kind: "definite", f: "t**2/sqrt(1 + t**3)", a: "0", b: "1", value: "2*(sqrt(2) - 1)/3", var: "t" },
  },
  {
    n: 296, d: "C", c: ["usub-definite", "usub-trig"],
    q: DEF + t`
$$\int_0^{\pi/4}\sec^2\theta\tan\theta\,d\theta$$`,
    hints: [t`Let $u=\tan\theta$, so $du=\sec^2\theta\,d\theta$. The limits become $0$ to $1$.`],
    a: t`$\dfrac12$`,
    steps: [
      ["Substitute", t`$u=\tan\theta$: $\int_0^1u\,du$`],
      ["Integrate", t`$\left[\frac{u^2}{2}\right]_0^1=\frac12$`],
    ],
    check: { kind: "definite", f: "sec(theta)**2*tan(theta)", a: "0", b: "pi/4", value: "1/2", var: "theta" },
  },
  {
    n: 297, d: "C", c: ["usub-definite", "usub-trig"],
    q: DEF + t`
$$\int_0^{\pi/4}\frac{\sin\theta}{\cos^4\theta}\,d\theta$$`,
    hints: [
      t`Let $u=\cos\theta$, $du=-\sin\theta\,d\theta$.`,
      t`New limits: $\theta=0\Rightarrow u=1$; $\theta=\frac\pi4\Rightarrow u=\frac{\sqrt2}{2}$.`,
    ],
    a: t`$\dfrac{2\sqrt2-1}{3}$`,
    steps: [
      ["Substitute", t`$-\int_1^{\sqrt2/2}u^{-4}\,du=\left[\frac{u^{-3}}{3}\right]_1^{\sqrt2/2}$`],
      ["Evaluate", t`$\left(\frac{\sqrt2}{2}\right)^{-3}=\left(\sqrt2\right)^3=2\sqrt2$, so the value is $\frac{2\sqrt2-1}{3}\approx0.609$.`],
    ],
    check: { kind: "definite", f: "sin(theta)/cos(theta)**4", a: "0", b: "pi/4", value: "(2*sqrt(2) - 1)/3", var: "theta" },
  },

  // ---------- Challenge ----------
  {
    n: 256, d: "Ch", c: ["usub-backsolve"],
    q: t`Evaluate the integral using the substitution $u=x+1$. Then check that your answer agrees with $\frac{2}{15}(x+1)^{3/2}(3x-2)+C$. (Adapted from Exercise 256.)
$$\int x\sqrt{x+1}\,dx$$`,
    hints: [
      t`With $u=x+1$, the leftover $x$ must also be written in terms of $u$: $x=u-1$.`,
      t`Then $\int(u-1)\sqrt u\,du=\int\left(u^{3/2}-u^{1/2}\right)du$.`,
    ],
    a: t`$\dfrac25(x+1)^{5/2}-\dfrac23(x+1)^{3/2}+C=\dfrac{2}{15}(x+1)^{3/2}(3x-2)+C$`,
    steps: [
      ["Substitute everything", t`$u=x+1$, $du=dx$, $x=u-1$: $\int(u-1)u^{1/2}\,du$`],
      ["Expand and integrate", t`$\int\left(u^{3/2}-u^{1/2}\right)du=\frac25u^{5/2}-\frac23u^{3/2}$`],
      ["Back-substitute", t`$\frac25(x+1)^{5/2}-\frac23(x+1)^{3/2}+C$`],
      ["Match the given form", t`Factor out $\frac{2}{15}(x+1)^{3/2}$: $\frac{2}{15}(x+1)^{3/2}\left[3(x+1)-5\right]=\frac{2}{15}(x+1)^{3/2}(3x-2)$.`],
    ],
    check: [
      { kind: "antiderivative", f: "x*sqrt(x + 1)", F: "2*(x + 1)**(Rational(5,2))/5 - 2*(x + 1)**(Rational(3,2))/3" },
      { kind: "value", expr: "2*(x + 1)**(Rational(5,2))/5 - 2*(x + 1)**(Rational(3,2))/3", value: "2*(x + 1)**(Rational(3,2))*(3*x - 2)/15" },
    ],
  },
  {
    n: 271, d: "Ch", c: ["usub-backsolve"],
    q: CHANGE + t`
$$\int x(1-x)^{99}\,dx$$`,
    hints: [
      t`Let $u=1-x$. Then $du=-dx$ and $x=1-u$.`,
      t`$\int x(1-x)^{99}dx=-\int(1-u)u^{99}\,du$. Expand before integrating.`,
    ],
    a: t`$\dfrac{(1-x)^{101}}{101}-\dfrac{(1-x)^{100}}{100}+C$`,
    steps: [
      ["Substitute everything", t`$u=1-x$, $dx=-du$, $x=1-u$: $-\int(1-u)u^{99}\,du$`],
      ["Expand", t`$-\int\left(u^{99}-u^{100}\right)du$`],
      ["Integrate", t`$-\frac{u^{100}}{100}+\frac{u^{101}}{101}+C$`],
      ["Back-substitute", t`$\frac{(1-x)^{101}}{101}-\frac{(1-x)^{100}}{100}+C$`],
    ],
    check: { kind: "antiderivative", f: "x*(1 - x)**99", F: "(1 - x)**101/101 - (1 - x)**100/100" },
  },
  {
    n: 278, d: "Ch", c: ["usub-trig"],
    q: CHANGE + t` (Hint: $\sin^2x+\cos^2x=1$.)
$$\int\sin^2x\cos^3x\,dx$$`,
    hints: [
      t`Save one $\cos x$ for $du$ and rewrite the rest: $\cos^3x=\cos^2x\cos x=(1-\sin^2x)\cos x$.`,
      t`Then let $u=\sin x$.`,
    ],
    a: t`$\dfrac{\sin^3x}{3}-\dfrac{\sin^5x}{5}+C$`,
    steps: [
      ["Rewrite", t`$\sin^2x\cos^3x=\sin^2x\left(1-\sin^2x\right)\cos x$`],
      ["Substitute", t`$u=\sin x$, $du=\cos x\,dx$: $\int u^2\left(1-u^2\right)du=\int\left(u^2-u^4\right)du$`],
      ["Integrate and back-substitute", t`$\frac{u^3}{3}-\frac{u^5}{5}+C=\frac{\sin^3x}{3}-\frac{\sin^5x}{5}+C$`],
    ],
    check: { kind: "antiderivative", f: "sin(x)**2*cos(x)**3", F: "sin(x)**3/3 - sin(x)**5/5" },
  },
  {
    n: 305, d: "Ch", c: ["usub-definite"],
    q: t`Is the substitution $u=1-x^2$ in the definite integral $\displaystyle\int_0^2\frac{x}{1-x^2}\,dx$ okay? If not, why not?`,
    hints: [t`Look at the integrand on $[0,2]$. Is it continuous there? What happens at $x=1$?`],
    a: t`No. The integrand $\frac{x}{1-x^2}$ has a vertical asymptote at $x=1$, inside $[0,2]$ (that is where $u=0$). The integral is not a proper definite integral, so substitution (and the FTC) cannot be used on it.`,
    steps: [
      ["Find the problem point", t`$1-x^2=0$ at $x=1$, which lies in $[0,2]$.`],
      ["Consequence", t`$\frac{x}{1-x^2}$ is unbounded near $x=1$, so it is not continuous on $[0,2]$, and the substitution rule for definite integrals does not apply.`],
      ["What the substitution would hide", t`It would give $-\frac12\int_1^{-3}\frac{du}{u}$, which crosses $u=0$, where $\frac1u$ blows up.`],
    ],
    check: { kind: "manual", note: "Conceptual: discontinuity at x = 1 inside [0, 2]." },
  },
  {
    n: 306, d: "Ch", c: ["usub-definite", "usub-trig"],
    q: t`Use a change of variables to show that the definite integral is equal to zero.
$$\int_0^{\pi}\cos^2(2\theta)\sin(2\theta)\,d\theta$$`,
    hints: [t`Let $u=\cos(2\theta)$. What are the new limits when $\theta=0$ and $\theta=\pi$?`],
    a: t`With $u=\cos(2\theta)$, both limits become $u=1$, so the integral is $-\frac12\int_1^1u^2\,du=0$.`,
    steps: [
      ["Substitute", t`$u=\cos(2\theta)$, $du=-2\sin(2\theta)\,d\theta$`],
      ["New limits", t`$\theta=0\Rightarrow u=\cos0=1$; $\theta=\pi\Rightarrow u=\cos2\pi=1$`],
      ["Conclude", t`$-\frac12\int_1^1u^2\,du=0$, because the upper and lower limits are equal.`],
    ],
    check: { kind: "definite", f: "cos(2*theta)**2*sin(2*theta)", a: "0", b: "pi", value: "0", var: "theta" },
  },
]);
