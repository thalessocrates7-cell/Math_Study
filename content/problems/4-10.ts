import { sectionProblems, t } from "../helpers";

export default sectionProblems("4.10", [
  // ---------- Foundation ----------
  {
    n: 466, d: "F", c: ["verify-antiderivative"],
    q: t`Show that $F(x)$ is an antiderivative of $f(x)$.
$$F(x)=x^2+4x+1,\qquad f(x)=2x+4$$`,
    hints: [t`$F$ is an antiderivative of $f$ exactly when $F'(x)=f(x)$. Differentiate $F$ and compare.`],
    a: t`$F'(x)=2x+4=f(x)$, so $F$ is an antiderivative of $f$.`,
    steps: [
      ["Differentiate F term by term", t`$$F'(x)=\frac{d}{dx}\left(x^2\right)+\frac{d}{dx}(4x)+\frac{d}{dx}(1)=2x+4+0$$`],
      ["Compare with f", t`$F'(x)=2x+4$, which is exactly $f(x)$, so $F$ is an antiderivative of $f$.`],
    ],
    check: { kind: "antiderivative", f: "2*x + 4", F: "x**2 + 4*x + 1" },
  },
  {
    n: 470, d: "F", c: ["power-rule", "rewrite-first"],
    q: t`Find the general antiderivative of the function.
$$f(x)=\frac{1}{x^2}+x$$`,
    hints: [t`Rewrite $\frac{1}{x^2}$ as $x^{-2}$, then use the power rule $\int x^n\,dx=\frac{x^{n+1}}{n+1}+C$ (for $n\neq-1$).`],
    a: t`$F(x)=-\dfrac{1}{x}+\dfrac{x^2}{2}+C$`,
    steps: [
      ["Rewrite with exponents", t`$$f(x)=x^{-2}+x$$`],
      ["Power rule on each term", t`$$\int x^{-2}\,dx=\frac{x^{-1}}{-1}=-\frac{1}{x},\qquad \int x\,dx=\frac{x^2}{2}$$`],
      ["Add the constant", t`$F(x)=-\frac{1}{x}+\frac{x^2}{2}+C$. Check: $F'(x)=x^{-2}+x=f(x)$.`],
    ],
    check: { kind: "antiderivative", f: "1/x**2 + x", F: "-1/x + x**2/2" },
  },
  {
    n: 474, d: "F", c: ["power-rule"],
    q: t`Find the general antiderivative $F(x)$ of the function.
$$f(x)=5x^4+4x^5$$`,
    hints: [t`Use the power rule on each term: raise the exponent by 1, then divide by the new exponent.`],
    a: t`$F(x)=x^5+\dfrac{2}{3}x^6+C$`,
    steps: [
      ["First term", t`$$\int 5x^4\,dx=5\cdot\frac{x^5}{5}=x^5$$`],
      ["Second term", t`$$\int 4x^5\,dx=4\cdot\frac{x^6}{6}=\frac{2}{3}x^6$$`],
      ["Combine", t`$F(x)=x^5+\frac{2}{3}x^6+C$`],
    ],
    check: { kind: "antiderivative", f: "5*x**4 + 4*x**5", F: "x**5 + 2*x**6/3" },
  },
  {
    n: 476, d: "F", c: ["power-rule", "rewrite-first"],
    q: t`Find the general antiderivative $F(x)$ of the function.
$$f(x)=\frac{1}{\sqrt{x}}$$`,
    hints: [t`Write $\frac{1}{\sqrt{x}}$ as a single power of $x$.`],
    a: t`$F(x)=2\sqrt{x}+C$`,
    steps: [
      ["Rewrite as a power", t`$$\frac{1}{\sqrt{x}}=x^{-1/2}$$`],
      ["Power rule", t`$$\int x^{-1/2}\,dx=\frac{x^{1/2}}{1/2}+C=2x^{1/2}+C$$`],
      ["Answer", t`$F(x)=2\sqrt{x}+C$. Check: $\frac{d}{dx}\left(2x^{1/2}\right)=x^{-1/2}$.`],
    ],
    check: { kind: "antiderivative", f: "1/sqrt(x)", F: "2*sqrt(x)" },
  },
  {
    n: 481, d: "F", c: ["trig-antiderivatives"],
    q: t`Find the general antiderivative $F(x)$ of the function.
$$f(x)=\sec^2(x)+1$$`,
    hints: [t`Which basic function has derivative $\sec^2 x$?`],
    a: t`$F(x)=\tan x+x+C$`,
    steps: [
      ["Recognize the trig derivative", t`$\frac{d}{dx}\tan x=\sec^2 x$, so $\int\sec^2 x\,dx=\tan x$.`],
      ["Integrate the constant", t`$\int 1\,dx=x$`],
      ["Combine", t`$F(x)=\tan x+x+C$`],
    ],
    check: { kind: "antiderivative", f: "sec(x)**2 + 1", F: "tan(x) + x" },
  },
  {
    n: 491, d: "F", c: ["trig-antiderivatives"],
    q: t`Evaluate the integral.
$$\int \sin x\,dx$$`,
    hints: [t`The derivative of $\cos x$ is $-\sin x$. What should you differentiate to get $+\sin x$?`],
    a: t`$\displaystyle\int\sin x\,dx=-\cos x+C$`,
    steps: [
      ["Look for a function whose derivative is sin x", t`$\frac{d}{dx}(-\cos x)=-(-\sin x)=\sin x$`],
      ["Write the antiderivative", t`$$\int\sin x\,dx=-\cos x+C$$`],
    ],
    check: { kind: "antiderivative", f: "sin(x)", F: "-cos(x)" },
  },
  {
    n: 492, d: "F", c: ["power-rule"],
    q: t`Evaluate the integral.
$$\int\left(4x+\sqrt{x}\right)dx$$`,
    hints: [t`Integrate each term separately. Write $\sqrt{x}=x^{1/2}$.`],
    a: t`$2x^2+\dfrac{2}{3}x^{3/2}+C$`,
    steps: [
      ["Split the integral", t`$$\int 4x\,dx+\int x^{1/2}\,dx$$`],
      ["Power rule on each", t`$$\int 4x\,dx=2x^2,\qquad \int x^{1/2}\,dx=\frac{x^{3/2}}{3/2}=\frac{2}{3}x^{3/2}$$`],
      ["Combine", t`$2x^2+\frac{2}{3}x^{3/2}+C$`],
    ],
    check: { kind: "antiderivative", f: "4*x + sqrt(x)", F: "2*x**2 + 2*x**(Rational(3,2))/3" },
  },

  // ---------- Core ----------
  {
    n: 467, d: "C", c: ["verify-antiderivative"],
    q: t`Show that $F(x)$ is an antiderivative of $f(x)$.
$$F(x)=x^2e^x,\qquad f(x)=e^x\left(x^2+2x\right)$$`,
    hints: [t`Differentiate $F$ with the product rule: $(uv)'=u'v+uv'$.`],
    a: t`$F'(x)=2xe^x+x^2e^x=e^x(x^2+2x)=f(x)$, so $F$ is an antiderivative of $f$.`,
    steps: [
      ["Product rule", t`$$F'(x)=\left(x^2\right)'e^x+x^2\left(e^x\right)'=2xe^x+x^2e^x$$`],
      ["Factor and compare", t`$F'(x)=e^x\left(x^2+2x\right)$, which is $f(x)$.`],
    ],
    check: { kind: "antiderivative", f: "exp(x)*(x**2 + 2*x)", F: "x**2*exp(x)" },
  },
  {
    n: 471, d: "C", c: ["exp-antiderivatives", "trig-antiderivatives", "power-rule"],
    q: t`Find the general form of the antiderivative of the function.
$$f(x)=e^x-3x^2+\sin x$$`,
    hints: [t`Do one term at a time: $\int e^x\,dx$, $\int 3x^2\,dx$, $\int\sin x\,dx$. Watch the sign on the sine term.`],
    a: t`$F(x)=e^x-x^3-\cos x+C$`,
    steps: [
      ["Exponential term", t`$\int e^x\,dx=e^x$`],
      ["Power term", t`$\int 3x^2\,dx=3\cdot\frac{x^3}{3}=x^3$, and it is subtracted.`],
      ["Sine term", t`$\int\sin x\,dx=-\cos x$`],
      ["Combine", t`$F(x)=e^x-x^3-\cos x+C$`],
    ],
    check: { kind: "antiderivative", f: "exp(x) - 3*x**2 + sin(x)", F: "exp(x) - x**3 - cos(x)" },
  },
  {
    n: 487, d: "C", c: ["trig-antiderivatives"],
    q: t`Find the general antiderivative $F(x)$ of the function.
$$f(x)=4\csc x\cot x-\sec x\tan x$$`,
    hints: [
      t`Recall $\frac{d}{dx}\csc x=-\csc x\cot x$ and $\frac{d}{dx}\sec x=\sec x\tan x$.`,
      t`So $\int\csc x\cot x\,dx=-\csc x$. Keep track of the signs.`,
    ],
    a: t`$F(x)=-4\csc x-\sec x+C$`,
    steps: [
      ["First term", t`Since $\frac{d}{dx}(-\csc x)=\csc x\cot x$: $\int 4\csc x\cot x\,dx=-4\csc x$.`],
      ["Second term", t`Since $\frac{d}{dx}\sec x=\sec x\tan x$: $\int\sec x\tan x\,dx=\sec x$, and it is subtracted.`],
      ["Combine", t`$F(x)=-4\csc x-\sec x+C$`],
    ],
    check: { kind: "antiderivative", f: "4*csc(x)*cot(x) - sec(x)*tan(x)", F: "-4*csc(x) - sec(x)" },
  },
  {
    n: 493, d: "C", c: ["rewrite-first", "power-rule"],
    q: t`Evaluate the integral.
$$\int\frac{3x^2+2}{x^2}\,dx$$`,
    hints: [t`There is no quotient rule for integrals. Divide each term of the numerator by $x^2$ first.`],
    a: t`$3x-\dfrac{2}{x}+C$`,
    steps: [
      ["Simplify the integrand", t`$$\frac{3x^2+2}{x^2}=3+2x^{-2}$$`],
      ["Integrate each term", t`$$\int 3\,dx=3x,\qquad \int 2x^{-2}\,dx=2\cdot\frac{x^{-1}}{-1}=-\frac{2}{x}$$`],
      ["Combine", t`$3x-\frac{2}{x}+C$`],
    ],
    check: { kind: "antiderivative", f: "(3*x**2 + 2)/x**2", F: "3*x - 2/x" },
  },
  {
    n: 497, d: "C", c: ["rewrite-first", "power-rule"],
    q: t`Evaluate the integral.
$$\int\frac{14x^3+2x+1}{x^3}\,dx$$`,
    hints: [t`Split the fraction into three terms, each a power of $x$.`],
    a: t`$14x-\dfrac{2}{x}-\dfrac{1}{2x^2}+C$`,
    steps: [
      ["Split the fraction", t`$$\frac{14x^3+2x+1}{x^3}=14+2x^{-2}+x^{-3}$$`],
      ["Integrate each power", t`$$\int 14\,dx=14x,\quad \int 2x^{-2}\,dx=-2x^{-1},\quad \int x^{-3}\,dx=\frac{x^{-2}}{-2}$$`],
      ["Combine", t`$14x-\frac{2}{x}-\frac{1}{2x^2}+C$`],
    ],
    check: { kind: "antiderivative", f: "(14*x**3 + 2*x + 1)/x**3", F: "14*x - 2/x - 1/(2*x**2)" },
  },
  {
    n: 498, d: "C", c: ["exp-antiderivatives"],
    q: t`Evaluate the integral.
$$\int\left(e^x+e^{-x}\right)dx$$`,
    hints: [t`By the chain rule, $\frac{d}{dx}e^{-x}=-e^{-x}$. So the antiderivative of $e^{-x}$ needs a minus sign.`],
    a: t`$e^x-e^{-x}+C$`,
    steps: [
      ["First term", t`$\int e^x\,dx=e^x$`],
      ["Second term", t`$\int e^{-x}\,dx=-e^{-x}$, because $\frac{d}{dx}\left(-e^{-x}\right)=e^{-x}$.`],
      ["Combine", t`$e^x-e^{-x}+C$`],
    ],
    check: { kind: "antiderivative", f: "exp(x) + exp(-x)", F: "exp(x) - exp(-x)" },
  },
  {
    n: 499, d: "C", c: ["initial-value", "power-rule"],
    q: t`Solve the initial-value problem.
$$f'(x)=x^{-3},\qquad f(1)=1$$`,
    hints: [
      t`Find the general antiderivative first (keep the $+C$).`,
      t`Then substitute $x=1$ and use $f(1)=1$ to solve for $C$.`,
    ],
    a: t`$f(x)=-\dfrac{1}{2x^2}+\dfrac{3}{2}$`,
    steps: [
      ["General antiderivative", t`$$f(x)=\int x^{-3}\,dx=\frac{x^{-2}}{-2}+C=-\frac{1}{2x^2}+C$$`],
      ["Use the initial condition", t`$f(1)=-\frac{1}{2}+C=1$, so $C=\frac{3}{2}$.`],
      ["Answer", t`$f(x)=-\frac{1}{2x^2}+\frac{3}{2}$`],
    ],
    check: { kind: "ivp", df: "x**-3", F: "-1/(2*x**2) + Rational(3,2)", x0: "1", y0: "1" },
  },
  {
    n: 500, d: "C", c: ["initial-value", "power-rule"],
    q: t`Solve the initial-value problem.
$$f'(x)=\sqrt{x}+x^2,\qquad f(0)=2$$`,
    hints: [t`Antidifferentiate term by term ($\sqrt{x}=x^{1/2}$), then use $f(0)=2$ to find $C$.`],
    a: t`$f(x)=\dfrac{2}{3}x^{3/2}+\dfrac{x^3}{3}+2$`,
    steps: [
      ["General antiderivative", t`$$f(x)=\frac{2}{3}x^{3/2}+\frac{x^3}{3}+C$$`],
      ["Use the initial condition", t`$f(0)=0+0+C=2$, so $C=2$.`],
      ["Answer", t`$f(x)=\frac{2}{3}x^{3/2}+\frac{x^3}{3}+2$`],
    ],
    check: { kind: "ivp", df: "sqrt(x) + x**2", F: "2*x**(Rational(3,2))/3 + x**3/3 + 2", x0: "0", y0: "2" },
  },
  {
    n: 501, d: "C", c: ["initial-value", "trig-antiderivatives"],
    q: t`Solve the initial-value problem.
$$f'(x)=\cos x+\sec^2(x),\qquad f\!\left(\frac{\pi}{4}\right)=2+\frac{\sqrt{2}}{2}$$`,
    hints: [
      t`$\int\cos x\,dx=\sin x$ and $\int\sec^2x\,dx=\tan x$.`,
      t`At $x=\frac{\pi}{4}$: $\sin\frac{\pi}{4}=\frac{\sqrt2}{2}$ and $\tan\frac{\pi}{4}=1$.`,
    ],
    a: t`$f(x)=\sin x+\tan x+1$`,
    steps: [
      ["General antiderivative", t`$$f(x)=\sin x+\tan x+C$$`],
      ["Use the initial condition", t`$f\left(\frac{\pi}{4}\right)=\frac{\sqrt2}{2}+1+C=2+\frac{\sqrt2}{2}$, so $C=1$.`],
      ["Answer", t`$f(x)=\sin x+\tan x+1$`],
    ],
    check: { kind: "ivp", df: "cos(x) + sec(x)**2", F: "sin(x) + tan(x) + 1", x0: "pi/4", y0: "2 + sqrt(2)/2" },
  },
  {
    n: 513, d: "C", c: ["motion"],
    q: t`A car company wants its newest model to be able to stop in 8 sec when traveling at 75 mph. Assuming constant deceleration, find the deceleration that does this. (Use 1 mi = 5280 ft.)`,
    hints: [
      t`Convert 75 mph to ft/sec.`,
      t`With constant deceleration $a$, integrating gives $v(t)=v_0-at$. The car stops when $v(t)=0$.`,
    ],
    a: t`$a=13.75$ ft/sec²`,
    steps: [
      ["Convert the speed", t`$$75\ \text{mph}=\frac{75\cdot5280\ \text{ft}}{3600\ \text{sec}}=110\ \text{ft/sec}$$`],
      ["Velocity from the acceleration", t`Integrating $v'(t)=-a$ with $v(0)=110$ gives $v(t)=110-at$.`],
      ["Stop at t = 8", t`$v(8)=110-8a=0$, so $a=\frac{110}{8}=13.75$ ft/sec².`],
    ],
    check: { kind: "value", expr: "75*5280/3600/8", value: "55/4" },
  },

  // ---------- Challenge ----------
  {
    n: 489, d: "Ch", c: ["exp-antiderivatives", "trig-antiderivatives"],
    q: t`Find the general antiderivative $F(x)$ of the function.
$$f(x)=\frac{1}{2}e^{-4x}+\sin x$$`,
    hints: [t`Guess $e^{-4x}$ and differentiate: you get $-4e^{-4x}$. Adjust the constant in front so the derivative comes out to $\frac12 e^{-4x}$.`],
    a: t`$F(x)=-\dfrac{1}{8}e^{-4x}-\cos x+C$`,
    steps: [
      ["Exponential term", t`$\frac{d}{dx}e^{-4x}=-4e^{-4x}$, so $\int e^{-4x}\,dx=-\frac{1}{4}e^{-4x}$ and $\int\frac12e^{-4x}\,dx=-\frac18e^{-4x}$.`],
      ["Sine term", t`$\int\sin x\,dx=-\cos x$`],
      ["Combine and check", t`$F(x)=-\frac18e^{-4x}-\cos x+C$. Check: $F'(x)=\frac12e^{-4x}+\sin x$.`],
    ],
    check: { kind: "antiderivative", f: "exp(-4*x)/2 + sin(x)", F: "-exp(-4*x)/8 - cos(x)" },
  },
  {
    n: 504, d: "Ch", c: ["initial-value", "power-rule"],
    q: t`Find two possible functions $f$ with the given second derivative.
$$f''(x)=x^2+2$$`,
    hints: [t`Antidifferentiate twice. Each antiderivative brings its own constant, so the answer has two constants.`],
    a: t`Any $f(x)=\dfrac{x^4}{12}+x^2+C_1x+C_2$. For example, $f(x)=\dfrac{x^4}{12}+x^2$ and $f(x)=\dfrac{x^4}{12}+x^2+x+1$.`,
    steps: [
      ["First antiderivative", t`$$f'(x)=\frac{x^3}{3}+2x+C_1$$`],
      ["Second antiderivative", t`$$f(x)=\frac{x^4}{12}+x^2+C_1x+C_2$$`],
      ["Pick constants", t`$C_1=C_2=0$ gives $\frac{x^4}{12}+x^2$; $C_1=C_2=1$ gives $\frac{x^4}{12}+x^2+x+1$. Both have $f''(x)=x^2+2$.`],
    ],
    check: [
      { kind: "value", expr: "diff(x**4/12 + x**2, x, 2)", value: "x**2 + 2" },
      { kind: "value", expr: "diff(x**4/12 + x**2 + x + 1, x, 2)", value: "x**2 + 2" },
    ],
  },
  {
    n: 509, d: "Ch", c: ["motion"],
    q: t`A car is being driven at 40 mph when the brakes are applied. It decelerates at a constant rate of 10 ft/sec². How long does it take to stop, and how far does it travel while stopping? (Exercises 509 and 510 combined.)`,
    hints: [
      t`Convert 40 mph to ft/sec ($1$ mi $=5280$ ft, $1$ hr $=3600$ sec).`,
      t`Integrate $a(t)=-10$ to get $v(t)$, and integrate $v(t)$ to get the distance $s(t)$. The car stops when $v(t)=0$.`,
    ],
    a: t`It stops after $t=\dfrac{88}{15}\approx5.87$ sec and travels $\dfrac{7744}{45}\approx172$ ft.`,
    steps: [
      ["Convert the speed", t`$40$ mph $=\frac{40\cdot5280}{3600}=\frac{176}{3}\approx58.67$ ft/sec.`],
      ["Velocity", t`$v(t)=\int(-10)\,dt=-10t+C$ with $v(0)=\frac{176}{3}$, so $v(t)=\frac{176}{3}-10t$.`],
      ["Stopping time", t`$v(t)=0$ when $t=\frac{176}{30}=\frac{88}{15}\approx5.87$ sec.`],
      ["Distance", t`$s(t)=\frac{176}{3}t-5t^2$ with $s(0)=0$, so $$s\!\left(\tfrac{88}{15}\right)=\frac{176}{3}\cdot\frac{88}{15}-5\left(\frac{88}{15}\right)^2=\frac{7744}{45}\approx172.1\ \text{ft}$$`],
    ],
    check: [
      { kind: "value", expr: "(40*5280/3600)/10", value: "88/15" },
      { kind: "value", expr: "(176/3)*(88/15) - 5*(88/15)**2", value: "7744/45" },
    ],
  },
  {
    n: 514, d: "Ch", c: ["motion"],
    q: t`A car company wants its newest model to be able to stop in less than 450 ft when traveling at 60 mph. Assuming constant deceleration, what deceleration does this take?`,
    hints: [
      t`60 mph is 88 ft/sec. Write $v(t)=88-at$ and $s(t)=88t-\frac{a}{2}t^2$.`,
      t`Find when the car stops, then the stopping distance in terms of $a$. Set it less than 450.`,
    ],
    a: t`A deceleration greater than $\dfrac{3872}{450}\approx8.6$ ft/sec².`,
    steps: [
      ["Velocity and position", t`$v(t)=88-at$ and $s(t)=88t-\frac{a}{2}t^2$.`],
      ["Stopping time", t`$v(t)=0$ at $t=\frac{88}{a}$.`],
      ["Stopping distance", t`$$s\!\left(\tfrac{88}{a}\right)=\frac{88^2}{a}-\frac{88^2}{2a}=\frac{88^2}{2a}=\frac{3872}{a}$$`],
      ["Solve the inequality", t`$\frac{3872}{a}<450$ gives $a>\frac{3872}{450}\approx8.60$ ft/sec².`],
    ],
    check: [
      { kind: "value", expr: "88*(88/a) - (a/2)*(88/a)**2", value: "3872/a" },
      { kind: "value", expr: "60*5280/3600", value: "88" },
    ],
  },
  {
    n: 522, d: "Ch", c: ["antiderivative-properties"],
    q: t`True or false? If $f(x)$ is an antiderivative of $v(x)$, then $f(2x)$ is an antiderivative of $v(2x)$. Prove it, or give a counterexample.`,
    hints: [t`Differentiate $f(2x)$ with the chain rule. Does the result equal $v(2x)$?`],
    a: t`False. $\frac{d}{dx}f(2x)=2v(2x)$, not $v(2x)$. Counterexample: $v(x)=2x$ and $f(x)=x^2$. Then $f(2x)=4x^2$ has derivative $8x$, but $v(2x)=4x$.`,
    steps: [
      ["Chain rule", t`$$\frac{d}{dx}f(2x)=f'(2x)\cdot2=2v(2x)$$`],
      ["Compare", t`$2v(2x)=v(2x)$ only when $v(2x)=0$, so the statement fails in general.`],
      ["Counterexample", t`$f(x)=x^2$ is an antiderivative of $v(x)=2x$. But $\frac{d}{dx}(2x)^2=8x\neq4x=v(2x)$.`],
      ["What is true", t`$\frac12f(2x)$ is an antiderivative of $v(2x)$.`],
    ],
    check: [
      { kind: "value", expr: "diff((2*x)**2, x)", value: "8*x" },
      { kind: "value", expr: "diff((2*x)**2/2, x)", value: "2*(2*x)" },
    ],
  },
]);
