import { sectionProblems, t } from "../helpers";

// Final Exam, Chapter 2 Review Exercises (OpenStax Calculus Volume 1), 208–232.
// Statements follow the import specification (Downloads\OpenStax_Calculus_Question_Import_Specification.docx);
// hints, answers and worked solutions are original to this site.

const TF = t`True or False. Justify your answer with a proof or a counterexample.`;
const ALG = t`Evaluate the limit algebraically or explain why the limit does not exist.`;
const SQUEEZE = t`Use the Squeeze Theorem to prove the limit.`;
const FIND_C = t`Determine the value of $c$ such that the function remains continuous. Draw your resulting function to ensure it is continuous.`;
const EPSILON = t`Use the precise definition of limit to prove the limit.`;

export default sectionProblems("2", [
  // ---------- True or False ----------
  {
    n: 208, d: "F", c: ["limit-facts"],
    q: TF + t`

A function has to be continuous at $x=a$ if $\lim_{x\to a}f(x)$ exists.`,
    hints: [t`Continuity at $a$ needs three things: $f(a)$ is defined, $\lim_{x\to a}f(x)$ exists, and the two are equal. Which of these can fail even when the limit exists?`],
    a: t`False. A limit can exist where the function is undefined. For $f(x)=\dfrac{x^2-1}{x-1}$, $\lim_{x\to1}f(x)=2$, but $f(1)$ is undefined, so $f$ is not continuous at $x=1$.`,
    steps: [
      ["What continuity needs", t`$f$ is continuous at $a$ when $f(a)$ is defined, $\lim_{x\to a}f(x)$ exists, and $\lim_{x\to a}f(x)=f(a)$. The limit existing is only one of the three conditions.`],
      ["A counterexample", t`Take $f(x)=\dfrac{x^2-1}{x-1}$. For $x\neq1$, $f(x)=x+1$, so $\lim_{x\to1}f(x)=2$.`],
      ["Check continuity", t`$f(1)$ is undefined (division by zero), so $f$ is not continuous at $x=1$ even though the limit exists. The statement is false.`],
    ],
    check: { kind: "value", expr: "limit((x**2 - 1)/(x - 1), x, 1)", value: "2" },
  },
  {
    n: 209, d: "F", c: ["limit-facts"],
    q: TF + t`

You can use the quotient rule to evaluate $\lim_{x\to0}\dfrac{\sin x}{x}$.`,
    hints: [t`The quotient law $\lim\frac{f}{g}=\frac{\lim f}{\lim g}$ has a condition on the denominator. What is $\lim_{x\to0}x$?`],
    a: t`False. The quotient law needs the limit of the denominator to be nonzero, but $\lim_{x\to0}x=0$. (The limit is $1$, found with the Squeeze Theorem.)`,
    steps: [
      ["The quotient law's condition", t`$\lim_{x\to a}\dfrac{f(x)}{g(x)}=\dfrac{\lim_{x\to a}f(x)}{\lim_{x\to a}g(x)}$ only when $\lim_{x\to a}g(x)\neq0$.`],
      ["Check the denominator", t`Here the denominator is $x$ and $\lim_{x\to0}x=0$, so the law does not apply: it would give the undefined form $\frac00$.`],
      ["What the limit is", t`The limit does exist: the Squeeze Theorem gives $\lim_{x\to0}\frac{\sin x}{x}=1$. The statement is false because the quotient law can't be used, not because the limit fails to exist.`],
    ],
    check: { kind: "value", expr: "limit(sin(x)/x, x, 0)", value: "1" },
  },
  {
    n: 210, d: "F", c: ["limit-facts"],
    q: TF + t`

If there is a vertical asymptote at $x=a$ for the function $f(x)$, then $f$ is undefined at the point $x=a$.`,
    hints: [t`A vertical asymptote is about the limits as $x\to a$, not about the value $f(a)$. Could you define $f(a)$ separately?`],
    a: t`False. Let $f(x)=\dfrac1x$ for $x\neq0$ and $f(0)=0$. Then $\lim_{x\to0^+}f(x)=+\infty$, so $x=0$ is a vertical asymptote, yet $f(0)=0$ is defined.`,
    steps: [
      ["What a vertical asymptote means", t`$x=a$ is a vertical asymptote when $f(x)\to\pm\infty$ as $x\to a^-$ or as $x\to a^+$. It says nothing about the value $f(a)$.`],
      ["Build a counterexample", t`Define $f(x)=\dfrac1x$ for $x\neq0$ and $f(0)=0$.`],
      ["Check", t`$\lim_{x\to0^+}f(x)=+\infty$, so $x=0$ is a vertical asymptote, but $f(0)=0$ is defined. The statement is false.`],
    ],
    check: { kind: "manual", note: "Piecewise counterexample: the asymptote comes from the one-sided limits, the value is defined separately." },
  },
  {
    n: 211, d: "F", c: ["limit-facts"],
    q: TF + t`

If $\lim_{x\to a}f(x)$ does not exist, then $f$ is undefined at the point $x=a$.`,
    hints: [t`Think of a function with a jump. Is it defined at the jump?`],
    a: t`False. The step function with $f(x)=0$ for $x<0$ and $f(x)=1$ for $x\ge0$ has one-sided limits $0$ and $1$ at $0$, so $\lim_{x\to0}f(x)$ does not exist, but $f(0)=1$.`,
    steps: [
      ["Look for a jump", t`At a jump the left and right limits differ, so the limit does not exist, even though the function can still have a value there.`],
      ["A counterexample", t`$$f(x)=\begin{cases}0, & x<0\\ 1, & x\ge0\end{cases}$$`],
      ["Check", t`$\lim_{x\to0^-}f(x)=0$ and $\lim_{x\to0^+}f(x)=1$, so $\lim_{x\to0}f(x)$ does not exist, yet $f(0)=1$. The statement is false.`],
    ],
    check: { kind: "manual", note: "Step-function counterexample." },
  },

  // ---------- Limits from a graph ----------
  {
    n: 212, d: "F", c: ["limits-graph"],
    q: t`Using the graph, find each limit or explain why the limit does not exist.

(a) $\displaystyle\lim_{x\to-1}f(x)$

(b) $\displaystyle\lim_{x\to1}f(x)$

(c) $\displaystyle\lim_{x\to0^+}f(x)$

(d) $\displaystyle\lim_{x\to2}f(x)$`,
    image: {
      src: "/figures/final/2-212.png",
      width: 316,
      height: 429,
      alt: "Graph of a piecewise function f. For x less than −1, a decreasing curve comes down from (−2, 4) to an open circle at (−1, 1). From (−1, −2) a line segment rises toward (0, −1). From an open circle at (0, 0), an increasing curve that bends downward rises to an open circle at (1, 1). A closed dot sits at (1, −1). For x greater than 1, a horizontal line at height 1 starts at the open circle at (1, 1) and continues past x = 2.",
    },
    hints: [
      t`For each limit, follow the graph toward $x=a$ from the left, then from the right. Open circles and dots show values of $f$, not limits.`,
      t`At $x=1$ the dot at $(1,-1)$ is only the value $f(1)$; ask where the curve heads on each side.`,
    ],
    a: t`(a) Does not exist: the left-hand limit is $1$ and the right-hand limit is $-2$. (b) $1$. (c) $0$. (d) $1$.`,
    steps: [
      ["(a) At x = −1", t`From the left the curve comes down to the open circle at $(-1,1)$, so $\lim_{x\to-1^-}f(x)=1$. From the right the line starts at $(-1,-2)$, so $\lim_{x\to-1^+}f(x)=-2$. The one-sided limits differ, so the limit does not exist.`],
      ["(b) At x = 1", t`From the left the curve rises to the open circle at $(1,1)$; from the right the horizontal line starts at that same open circle. Both sides approach $1$, so $\lim_{x\to1}f(x)=1$. The dot at $(1,-1)$ is the value $f(1)$, which doesn't affect the limit.`],
      ["(c) As x → 0⁺", t`Just to the right of $0$ the curve starts at the open circle $(0,0)$, so $\lim_{x\to0^+}f(x)=0$.`],
      ["(d) At x = 2", t`Near $x=2$ the graph is the horizontal line at height $1$, so $\lim_{x\to2}f(x)=1$.`],
    ],
    check: { kind: "manual", note: "Read from the OpenStax graph (Chapter 2 review, exercise 212)." },
  },

  // ---------- Evaluating limits algebraically ----------
  {
    n: 213, d: "C", c: ["limits-algebra"],
    q: ALG + t`
$$\lim_{x\to2}\frac{2x^2-3x-2}{x-2}$$`,
    hints: [t`Substituting $x=2$ gives $\frac00$. Factor the numerator: it has a factor of $(x-2)$.`],
    a: t`$5$`,
    steps: [
      ["Try substitution", t`At $x=2$: $\dfrac{8-6-2}{0}=\dfrac00$, an indeterminate form.`],
      ["Factor and cancel", t`$2x^2-3x-2=(2x+1)(x-2)$, so for $x\neq2$ the expression equals $2x+1$.`],
      ["Take the limit", t`$\lim_{x\to2}(2x+1)=5$`],
    ],
    check: { kind: "value", expr: "limit((2*x**2 - 3*x - 2)/(x - 2), x, 2)", value: "5" },
  },
  {
    n: 214, d: "F", c: ["limits-algebra"],
    q: ALG + t`
$$\lim_{x\to0}\left(3x^2-2x+4\right)$$`,
    hints: [t`A polynomial is continuous everywhere, so you can substitute directly.`],
    a: t`$4$`,
    steps: [
      ["Polynomials are continuous", t`For a polynomial $p$, $\lim_{x\to a}p(x)=p(a)$.`],
      ["Substitute", t`$3(0)^2-2(0)+4=4$`],
    ],
    check: { kind: "value", expr: "limit(3*x**2 - 2*x + 4, x, 0)", value: "4" },
  },
  {
    n: 215, d: "F", c: ["limits-algebra"],
    q: ALG + t`
$$\lim_{x\to3}\frac{x^3-2x^2-1}{3x-2}$$`,
    hints: [t`Check the denominator at $x=3$ first. If it isn't $0$, you can substitute.`],
    a: t`$\dfrac87$`,
    steps: [
      ["Check the denominator", t`$3(3)-2=7\neq0$, so the quotient law applies.`],
      ["Substitute", t`$\dfrac{27-18-1}{7}=\dfrac87$`],
    ],
    check: { kind: "value", expr: "limit((x**3 - 2*x**2 - 1)/(3*x - 2), x, 3)", value: "8/7" },
  },
  {
    n: 216, d: "C", c: ["limits-algebra"],
    q: ALG + t`
$$\lim_{x\to\pi/2}\frac{\cot x}{\cos x}$$`,
    hints: [t`Rewrite $\cot x=\dfrac{\cos x}{\sin x}$ and simplify before you substitute.`],
    a: t`$1$`,
    steps: [
      ["Substitution gives 0/0", t`$\cot\frac\pi2=0$ and $\cos\frac\pi2=0$.`],
      ["Simplify", t`$\dfrac{\cot x}{\cos x}=\dfrac{\cos x}{\sin x}\cdot\dfrac{1}{\cos x}=\dfrac{1}{\sin x}$ for $\cos x\neq0$.`],
      ["Take the limit", t`$\lim_{x\to\pi/2}\dfrac{1}{\sin x}=\dfrac{1}{\sin(\pi/2)}=1$`],
    ],
    check: { kind: "value", expr: "limit(cot(x)/cos(x), x, pi/2)", value: "1" },
  },
  {
    n: 217, d: "C", c: ["limits-algebra"],
    q: ALG + t`
$$\lim_{x\to-5}\frac{x^2+25}{x+5}$$`,
    hints: [t`At $x=-5$ the numerator is $50$ but the denominator is $0$. Look at the sign of $x+5$ on each side of $-5$.`],
    a: t`The limit does not exist: $\lim_{x\to-5^-}\dfrac{x^2+25}{x+5}=-\infty$ and $\lim_{x\to-5^+}\dfrac{x^2+25}{x+5}=+\infty$.`,
    steps: [
      ["Substitute", t`The numerator approaches $25+25=50$ and the denominator approaches $0$. A nonzero number over something approaching $0$ grows without bound.`],
      ["Left side", t`For $x<-5$, $x+5<0$, so the quotient $\to-\infty$.`],
      ["Right side", t`For $x>-5$, $x+5>0$, so the quotient $\to+\infty$. The one-sided limits differ, so the limit does not exist; $x=-5$ is a vertical asymptote.`],
    ],
    check: { kind: "manual", note: "One-sided limits are -oo (left) and +oo (right)." },
  },
  {
    n: 218, d: "C", c: ["limits-algebra"],
    q: ALG + t`
$$\lim_{x\to2}\frac{3x^2-2x-8}{x^2-4}$$`,
    hints: [t`Both the numerator and the denominator are $0$ at $x=2$. Factor both.`],
    a: t`$\dfrac52$`,
    steps: [
      ["Factor", t`$3x^2-2x-8=(3x+4)(x-2)$ and $x^2-4=(x+2)(x-2)$.`],
      ["Cancel", t`For $x\neq2$ the expression equals $\dfrac{3x+4}{x+2}$.`],
      ["Substitute", t`$\dfrac{3(2)+4}{2+2}=\dfrac{10}{4}=\dfrac52$`],
    ],
    check: { kind: "value", expr: "limit((3*x**2 - 2*x - 8)/(x**2 - 4), x, 2)", value: "5/2" },
  },
  {
    n: 219, d: "C", c: ["limits-algebra"],
    q: ALG + t`
$$\lim_{x\to1}\frac{x^2-1}{x^3-1}$$`,
    hints: [t`Factor a difference of squares and a difference of cubes: $x^3-1=(x-1)\left(x^2+x+1\right)$.`],
    a: t`$\dfrac23$`,
    steps: [
      ["Factor", t`$x^2-1=(x-1)(x+1)$ and $x^3-1=(x-1)\left(x^2+x+1\right)$.`],
      ["Cancel", t`For $x\neq1$ the expression equals $\dfrac{x+1}{x^2+x+1}$.`],
      ["Substitute", t`$\dfrac{1+1}{1+1+1}=\dfrac23$`],
    ],
    check: { kind: "value", expr: "limit((x**2 - 1)/(x**3 - 1), x, 1)", value: "2/3" },
  },
  {
    n: 220, d: "C", c: ["limits-algebra"],
    q: ALG + t`
$$\lim_{x\to1}\frac{x^2-1}{\sqrt{x}-1}$$`,
    hints: [t`Write $x-1=\left(\sqrt x-1\right)\left(\sqrt x+1\right)$, or multiply by the conjugate $\sqrt x+1$.`],
    a: t`$4$`,
    steps: [
      ["Factor", t`$x^2-1=(x-1)(x+1)=\left(\sqrt x-1\right)\left(\sqrt x+1\right)(x+1)$.`],
      ["Cancel", t`For $x\neq1$ the expression equals $\left(\sqrt x+1\right)(x+1)$.`],
      ["Substitute", t`$(1+1)(1+1)=4$`],
    ],
    check: { kind: "value", expr: "limit((x**2 - 1)/(sqrt(x) - 1), x, 1)", value: "4" },
  },
  {
    n: 221, d: "C", c: ["limits-algebra"],
    q: ALG + t`
$$\lim_{x\to4}\frac{4-x}{\sqrt{x}-2}$$`,
    hints: [t`$4-x=-(x-4)=-\left(\sqrt x-2\right)\left(\sqrt x+2\right)$.`],
    a: t`$-4$`,
    steps: [
      ["Factor", t`$4-x=-\left(\sqrt x-2\right)\left(\sqrt x+2\right)$.`],
      ["Cancel", t`For $x\neq4$ the expression equals $-\left(\sqrt x+2\right)$.`],
      ["Substitute", t`$-\left(\sqrt4+2\right)=-4$`],
    ],
    check: { kind: "value", expr: "limit((4 - x)/(sqrt(x) - 2), x, 4)", value: "-4" },
  },
  {
    n: 222, d: "C", c: ["limits-algebra"],
    q: ALG + t`
$$\lim_{x\to4}\frac{1}{\sqrt{x}-2}$$`,
    hints: [t`The numerator is $1$ and the denominator approaches $0$. What sign does $\sqrt x-2$ have on each side of $4$?`],
    a: t`The limit does not exist: $\lim_{x\to4^-}\dfrac{1}{\sqrt x-2}=-\infty$ and $\lim_{x\to4^+}\dfrac{1}{\sqrt x-2}=+\infty$.`,
    steps: [
      ["Substitute", t`The denominator $\sqrt x-2\to0$ while the numerator stays $1$, so the quotient is unbounded.`],
      ["Left side", t`For $0\le x<4$, $\sqrt x<2$, so $\sqrt x-2<0$ and the quotient $\to-\infty$.`],
      ["Right side", t`For $x>4$, $\sqrt x-2>0$, so the quotient $\to+\infty$. The one-sided limits differ, so the limit does not exist.`],
    ],
    check: { kind: "manual", note: "One-sided limits are -oo (left) and +oo (right)." },
  },

  // ---------- Squeeze Theorem ----------
  {
    n: 223, d: "C", c: ["squeeze"],
    q: SQUEEZE + t`
$$\lim_{x\to0}x^2\cos(2\pi x)=0$$`,
    hints: [t`Start from $-1\le\cos(2\pi x)\le1$ and multiply through by $x^2\ge0$.`],
    a: t`Since $-x^2\le x^2\cos(2\pi x)\le x^2$ and $\lim_{x\to0}\left(-x^2\right)=\lim_{x\to0}x^2=0$, the Squeeze Theorem gives $\lim_{x\to0}x^2\cos(2\pi x)=0$.`,
    steps: [
      ["Bound the cosine", t`$-1\le\cos(2\pi x)\le1$ for every $x$.`],
      ["Multiply by x²", t`Multiplying by $x^2\ge0$ keeps the inequalities: $-x^2\le x^2\cos(2\pi x)\le x^2$.`],
      ["Squeeze", t`$\lim_{x\to0}\left(-x^2\right)=0$ and $\lim_{x\to0}x^2=0$, so by the Squeeze Theorem $\lim_{x\to0}x^2\cos(2\pi x)=0$.`],
    ],
    check: { kind: "value", expr: "limit(x**2*cos(2*pi*x), x, 0)", value: "0" },
  },
  {
    n: 224, d: "Ch", c: ["squeeze"],
    q: SQUEEZE + t`
$$\lim_{x\to0}x^3\sin\left(\frac{\pi}{x}\right)=0$$`,
    hints: [t`$x^3$ is negative for $x<0$, so bound the absolute value instead: $\left|x^3\sin\frac{\pi}{x}\right|\le|x|^3$.`],
    a: t`For $x\neq0$, $-|x|^3\le x^3\sin\dfrac{\pi}{x}\le|x|^3$, and both bounds approach $0$, so the Squeeze Theorem gives $\lim_{x\to0}x^3\sin\dfrac{\pi}{x}=0$.`,
    steps: [
      ["Bound the sine", t`$\left|\sin\frac{\pi}{x}\right|\le1$ for $x\neq0$.`],
      ["Bound the product", t`$\left|x^3\sin\frac{\pi}{x}\right|=|x|^3\left|\sin\frac{\pi}{x}\right|\le|x|^3$, so $-|x|^3\le x^3\sin\frac{\pi}{x}\le|x|^3$. (Multiplying $-1\le\sin\le1$ by $x^3$ directly would flip the inequalities for $x<0$; the absolute value avoids that.)`],
      ["Squeeze", t`$\lim_{x\to0}\left(-|x|^3\right)=\lim_{x\to0}|x|^3=0$, so $\lim_{x\to0}x^3\sin\frac{\pi}{x}=0$.`],
    ],
    check: { kind: "manual", note: "Squeeze proof with bounds -|x|^3 and |x|^3." },
  },

  // ---------- Continuity ----------
  {
    n: 225, d: "F", c: ["continuity"],
    q: t`Determine the domain such that the function $f(x)=\sqrt{x-2}+xe^x$ is continuous over its domain.`,
    hints: [t`$xe^x$ is continuous for every $x$. Where is $\sqrt{x-2}$ defined?`],
    a: t`$[2,\infty)$. The function is defined exactly there and is continuous on all of it (from the right at $x=2$).`,
    steps: [
      ["Each piece", t`$xe^x$ is a product of continuous functions, continuous on $(-\infty,\infty)$. $\sqrt{x-2}$ is defined and continuous where $x-2\ge0$.`],
      ["Domain", t`So $f$ is defined exactly for $x\ge2$: the domain is $[2,\infty)$.`],
      ["Continuity", t`On $(2,\infty)$ both pieces are continuous, so their sum is. At $x=2$, $\lim_{x\to2^+}f(x)=0+2e^2=f(2)$, so $f$ is continuous from the right. $f$ is continuous over its whole domain $[2,\infty)$.`],
    ],
    check: { kind: "manual", note: "Domain from sqrt(x - 2); x*e^x is continuous everywhere." },
  },
  {
    n: 226, d: "C", c: ["continuity"],
    q: FIND_C + t`
$$f(x)=\begin{cases}x^2+1, & x>c\\ 2x, & x\le c\end{cases}$$`,
    hints: [t`Both pieces are polynomials, so the only possible break is at $x=c$. Make the two pieces meet there: $c^2+1=2c$.`],
    a: t`$c=1$`,
    steps: [
      ["Where continuity can fail", t`Each piece is a polynomial, continuous on its own interval. At $x=c$ we need $\lim_{x\to c^+}f(x)=\lim_{x\to c^-}f(x)=f(c)$.`],
      ["Make the pieces meet", t`$c^2+1=2c$, so $c^2-2c+1=0$, which is $(c-1)^2=0$.`],
      ["Solve and check", t`$c=1$. Then $f(x)=2x$ for $x\le1$ and $f(x)=x^2+1$ for $x>1$; both give $2$ at $x=1$, so the graph has no break.`],
    ],
    check: { kind: "value", expr: "1**2 + 1", value: "2*1" },
  },
  {
    n: 227, d: "C", c: ["continuity"],
    q: FIND_C + t`
$$f(x)=\begin{cases}\sqrt{x+1}, & x>-1\\ x^2+c, & x\le-1\end{cases}$$`,
    hints: [t`Make the pieces meet at $x=-1$: $\sqrt{-1+1}=(-1)^2+c$.`],
    a: t`$c=-1$`,
    steps: [
      ["Right-hand limit", t`$\lim_{x\to-1^+}\sqrt{x+1}=\sqrt0=0$.`],
      ["Left-hand value", t`$\lim_{x\to-1^-}\left(x^2+c\right)=1+c=f(-1)$.`],
      ["Solve", t`$1+c=0$, so $c=-1$. Then $x^2-1$ (for $x\le-1$) and $\sqrt{x+1}$ (for $x>-1$) meet at the point $(-1,0)$.`],
    ],
    check: { kind: "value", expr: "sqrt(-1 + 1)", value: "(-1)**2 + (-1)" },
  },

  // ---------- The precise definition ----------
  {
    n: 228, d: "Ch", c: ["precise-definition"],
    q: EPSILON + t`
$$\lim_{x\to1}(8x+16)=24$$`,
    hints: [
      t`Simplify $|f(x)-L|=|(8x+16)-24|$ and write it in terms of $|x-1|$.`,
      t`Choose $\delta$ so that $8|x-1|<\varepsilon$ whenever $0<|x-1|<\delta$.`,
    ],
    a: t`Let $\varepsilon>0$ and choose $\delta=\dfrac{\varepsilon}{8}$. If $0<|x-1|<\delta$, then $|(8x+16)-24|=8|x-1|<8\cdot\dfrac{\varepsilon}{8}=\varepsilon$.`,
    steps: [
      ["What must be shown", t`For every $\varepsilon>0$ there is a $\delta>0$ such that $0<|x-1|<\delta$ implies $|(8x+16)-24|<\varepsilon$.`],
      ["Simplify the distance", t`$|(8x+16)-24|=|8x-8|=8|x-1|$.`],
      ["Choose δ", t`$8|x-1|<\varepsilon$ exactly when $|x-1|<\frac{\varepsilon}{8}$, so let $\delta=\frac{\varepsilon}{8}$.`],
      ["Check", t`If $0<|x-1|<\frac{\varepsilon}{8}$, then $|(8x+16)-24|=8|x-1|<\varepsilon$. So $\lim_{x\to1}(8x+16)=24$.`],
    ],
    check: { kind: "manual", note: "Epsilon-delta proof with delta = epsilon/8." },
  },
  {
    n: 229, d: "Ch", c: ["precise-definition"],
    q: EPSILON + t`
$$\lim_{x\to0}x^3=0$$`,
    hints: [t`$\left|x^3-0\right|=|x|^3$. How small must $|x|$ be for $|x|^3<\varepsilon$?`],
    a: t`Let $\varepsilon>0$ and choose $\delta=\sqrt[3]{\varepsilon}$. If $0<|x|<\delta$, then $\left|x^3-0\right|=|x|^3<\delta^3=\varepsilon$.`,
    steps: [
      ["What must be shown", t`For every $\varepsilon>0$ there is a $\delta>0$ such that $0<|x-0|<\delta$ implies $\left|x^3-0\right|<\varepsilon$.`],
      ["Rewrite", t`$\left|x^3-0\right|=|x|^3$, and $|x|^3<\varepsilon$ exactly when $|x|<\sqrt[3]{\varepsilon}$.`],
      ["Choose δ and check", t`Let $\delta=\sqrt[3]{\varepsilon}$. If $0<|x|<\delta$, then $|x|^3<\delta^3=\varepsilon$, so $\lim_{x\to0}x^3=0$.`],
    ],
    check: { kind: "manual", note: "Epsilon-delta proof with delta = cube root of epsilon." },
  },

  // ---------- Applications ----------
  {
    n: 230, d: "C", c: ["ivt"],
    q: t`A ball is thrown into the air and the vertical position is given by $x(t)=-4.9t^2+25t+5$. Use the Intermediate Value Theorem to show that the ball must land on the ground sometime between 5 sec and 6 sec after the throw.`,
    hints: [
      t`Compute $x(5)$ and $x(6)$. What do their signs tell you?`,
      t`The Intermediate Value Theorem also needs $x(t)$ to be continuous on $[5,6]$.`,
    ],
    a: t`$x(5)=7.5>0$ and $x(6)=-21.4<0$, and $x(t)$ is continuous, so by the Intermediate Value Theorem $x(c)=0$ for some $c$ between $5$ and $6$: the ball lands between 5 and 6 seconds after the throw.`,
    steps: [
      ["Continuity", t`$x(t)$ is a polynomial, so it is continuous on $[5,6]$.`],
      ["Evaluate the ends", t`$x(5)=-4.9(25)+125+5=7.5$ and $x(6)=-4.9(36)+150+5=-21.4$.`],
      ["Apply the theorem", t`$0$ lies between $x(6)=-21.4$ and $x(5)=7.5$, so there is a $c\in(5,6)$ with $x(c)=0$: the height reaches $0$ (the ground) between 5 and 6 seconds.`],
    ],
    check: [
      { kind: "value", expr: "-4.9*5**2 + 25*5 + 5", value: "7.5" },
      { kind: "value", expr: "-4.9*6**2 + 25*6 + 5", value: "-21.4" },
    ],
  },
  {
    n: 231, d: "F", c: ["velocity"],
    q: t`A particle moving along a line has a displacement according to the function $x(t)=t^2-2t+4$, where $x$ is measured in meters and $t$ is measured in seconds. Find the average velocity over the time period $t=[0,2]$.`,
    hints: [t`Average velocity $=\dfrac{x(2)-x(0)}{2-0}$.`],
    a: t`$0$ m/s`,
    steps: [
      ["Positions", t`$x(0)=4$ and $x(2)=4-4+4=4$ meters.`],
      ["Average velocity", t`$\dfrac{x(2)-x(0)}{2-0}=\dfrac{4-4}{2}=0$ m/s. The particle moves, but it ends where it started.`],
    ],
    check: { kind: "value", expr: "((2**2 - 2*2 + 4) - (0**2 - 2*0 + 4))/2", value: "0" },
  },
  {
    n: 232, d: "C", c: ["velocity"],
    q: t`From the previous exercise, estimate the instantaneous velocity at $t=2$ by checking the average velocity within $t=0.01$ sec.

(The previous exercise: $x(t)=t^2-2t+4$, with $x$ in meters and $t$ in seconds.)`,
    hints: [t`Compute the average velocity over $[2,\,2.01]$, and as a check over $[1.99,\,2]$.`],
    a: t`About $2$ m/s (the average velocities over $[2,2.01]$ and $[1.99,2]$ are $2.01$ and $1.99$ m/s).`,
    steps: [
      ["Positions", t`$x(2)=4$, $x(2.01)=4.0401-4.02+4=4.0201$, and $x(1.99)=3.9601-3.98+4=3.9801$.`],
      ["Average velocities", t`Over $[2,2.01]$: $\dfrac{4.0201-4}{0.01}=2.01$ m/s. Over $[1.99,2]$: $\dfrac{4-3.9801}{0.01}=1.99$ m/s.`],
      ["Estimate", t`Both are close to $2$, so the instantaneous velocity at $t=2$ is about $2$ m/s.`],
    ],
    check: [
      { kind: "value", expr: "((2.01**2 - 2*2.01 + 4) - 4)/0.01", value: "2.01" },
      { kind: "value", expr: "(4 - (1.99**2 - 2*1.99 + 4))/0.01", value: "1.99" },
    ],
  },
]);
