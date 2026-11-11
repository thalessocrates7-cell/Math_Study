import { sectionProblems, t } from "../helpers";

// Final Exam, Chapter 3 Review Exercises (OpenStax Calculus Volume 1), 367–391.
// 386 and 387 were added first, from the owner's screenshots (2026-11-10). The other 23 were added on
// 2026-11-11 from the Chapter 3 appendix of the owner's Stygian brief (Downloads\MTH263_Stygian_Claude_Code_Brief_UPDATED.docx).
// The appendix shortens OpenStax's instructions and marks three items as unverified, so the instruction
// lines follow OpenStax's usual phrasing and those items are read the usual OpenStax way:
//   371 √(x+4), 378 √(3x²+2), 379 (x/4)·sin⁻¹(x), and 383 with 4^x (the appendix has "4x").
// Not yet compared with the OpenStax page: replace this note once the owner's screenshots confirm the wording.
// Hints, answers and worked solutions are original to this site.

const TF = t`True or False. Justify your answer with a proof or a counterexample.`;
const LIMIT_DEF = t`Use the limit definition of the derivative to exactly evaluate the derivative.`;
const FIND_D = t`Find the derivative of the following function.`;
const TANGENT = t`Find the equation of the tangent line to the following equation at the specified point.`;
const DRAW = t`Draw the derivative for the following graph.`;
/** The shared stem of 388 and 389 (kept the same in both). */
const WATER = t`The following questions concern the water level in Ocean City, New Jersey, in January, which can be approximated by $w(t)=1.9+2.9\cos\left(\frac{\pi}{6}t\right)$, where $t$ is measured in hours after midnight and the height is measured in feet.`;
/** The shared data for 390 and 391 (kept exactly as given). */
const KATRINA = t`The following questions use the wind speed of Hurricane Katrina in 2005, in miles per hour, at the hours shown in the table.

| Hour | Wind speed (mph) |
| 1 | 45 |
| 5 | 75 |
| 11 | 100 |
| 29 | 115 |
| 49 | 145 |
| 58 | 175 |
| 73 | 155 |
| 81 | 125 |
| 85 | 95 |
| 107 | 35 |`;

export default sectionProblems("3", [
  // ---------- True or False ----------
  {
    n: 367, d: "F", c: ["differentiability"],
    q: TF + t`

Every function has a derivative.`,
    hints: [
      t`A derivative at a point needs a single, well-defined tangent slope there. Can you think of a graph with a sharp corner?`,
      t`Try $f(x)=|x|$ at $x=0$ and compare the slopes from the left and from the right.`,
    ],
    a: t`False. $f(x)=|x|$ has no derivative at $x=0$: the difference quotient $\dfrac{|h|}{h}$ is $-1$ for $h<0$ and $1$ for $h>0$, so its limit does not exist.`,
    steps: [
      ["What a derivative needs", t`$f'(a)$ exists only when $\lim_{h\to0}\dfrac{f(a+h)-f(a)}{h}$ exists. At a sharp corner the slopes from the two sides differ.`],
      ["A counterexample", t`Take $f(x)=|x|$ and $a=0$. Then $\dfrac{f(0+h)-f(0)}{h}=\dfrac{|h|}{h}$.`],
      ["Compare both sides", t`For $h>0$ it equals $1$, and for $h<0$ it equals $-1$. The two one-sided limits differ, so $f'(0)$ does not exist and the statement is false.`],
    ],
    check: [
      { kind: "value", expr: "limit(Abs(x)/x, x, 0, '+')", value: "1" },
      { kind: "value", expr: "limit(Abs(x)/x, x, 0, '-')", value: "-1" },
    ],
  },
  {
    n: 368, d: "F", c: ["differentiability"],
    q: TF + t`

A continuous function has a continuous derivative.`,
    hints: [
      t`For the statement to hold, $f'$ would have to exist at every point. Is there a continuous function with a corner?`,
    ],
    a: t`False. $f(x)=|x|$ is continuous, but it has no derivative at $x=0$, and $f'$ jumps from $-1$ to $1$ across $0$. Even a function that is differentiable everywhere can have a discontinuous derivative, for example $f(x)=x^2\sin\frac1x$ with $f(0)=0$.`,
    steps: [
      ["What would have to be true", t`The statement says $f'$ exists at every point and is continuous.`],
      ["A counterexample", t`$f(x)=|x|$ is continuous everywhere, with $f'(x)=-1$ for $x<0$ and $f'(x)=1$ for $x>0$. At $x=0$ the derivative does not exist.`],
      ["Why that breaks the claim", t`$f'$ is not defined at $0$ and jumps from $-1$ to $1$ across it, so $f$ does not have a continuous derivative.`],
      ["A stronger example", t`$f(x)=x^2\sin\frac1x$ with $f(0)=0$ is differentiable at every point: $f'(0)=0$ and $f'(x)=2x\sin\frac1x-\cos\frac1x$ for $x\neq0$. But $\cos\frac1x$ keeps oscillating near $0$, so $f'$ is not continuous at $0$.`],
    ],
    check: [
      { kind: "derivative", expr: "Abs(x)", value: "x/Abs(x)" },
      { kind: "derivative", expr: "x**2*sin(1/x)", value: "2*x*sin(1/x) - cos(1/x)" },
      { kind: "value", expr: "limit(x*sin(1/x), x, 0)", value: "0" },
    ],
  },
  {
    n: 369, d: "F", c: ["differentiability"],
    q: TF + t`

A continuous function has a derivative.`,
    hints: [
      t`Continuous means the graph has no breaks. Differentiable asks for more: a tangent line with a definite slope at every point.`,
      t`Look at $f(x)=|x|$ near $x=0$.`,
    ],
    a: t`False. $f(x)=|x|$ is continuous at $x=0$ but has no derivative there (it has a corner).`,
    steps: [
      ["Continuous is not the same as differentiable", t`Continuity at $a$ means $\lim_{x\to a}f(x)=f(a)$. Differentiability needs the extra limit $\lim_{h\to0}\dfrac{f(a+h)-f(a)}{h}$ to exist.`],
      ["A counterexample is continuous", t`$f(x)=|x|$ is continuous at $0$, since $\lim_{x\to0}|x|=0=f(0)$.`],
      ["…but not differentiable", t`$\dfrac{|h|}{h}$ is $1$ for $h>0$ and $-1$ for $h<0$, so $f'(0)$ does not exist. The statement is false.`],
    ],
    check: [
      { kind: "value", expr: "limit(Abs(x), x, 0)", value: "0" },
      { kind: "value", expr: "limit(Abs(x)/x, x, 0, '+')", value: "1" },
      { kind: "value", expr: "limit(Abs(x)/x, x, 0, '-')", value: "-1" },
    ],
  },
  {
    n: 370, d: "F", c: ["differentiability"],
    q: TF + t`

If a function is differentiable, it is continuous.`,
    hints: [
      t`Start from the difference quotient and multiply it by $h$. What happens to $f(a+h)-f(a)$ as $h\to0$?`,
    ],
    a: t`True. If $f'(a)$ exists, then $f(a+h)-f(a)=\dfrac{f(a+h)-f(a)}{h}\cdot h\to f'(a)\cdot0=0$, so $\lim_{h\to0}f(a+h)=f(a)$ and $f$ is continuous at $a$.`,
    steps: [
      ["What we know", t`$f$ is differentiable at $a$, so $f'(a)=\lim_{h\to0}\dfrac{f(a+h)-f(a)}{h}$ exists.`],
      ["Rewrite the change in f", t`For $h\neq0$, $f(a+h)-f(a)=\dfrac{f(a+h)-f(a)}{h}\cdot h$.`],
      ["Take the limit", t`$\lim_{h\to0}\big[f(a+h)-f(a)\big]=f'(a)\cdot0=0$, so $\lim_{h\to0}f(a+h)=f(a)$.`],
      ["Conclusion", t`That is exactly continuity at $a$. So every differentiable function is continuous (but, as $|x|$ shows, not the other way around).`],
    ],
    check: { kind: "manual", note: "Standard proof: differentiable at a implies continuous at a (the difference quotient times h tends to f'(a)·0)." },
  },

  // ---------- Limit definition ----------
  {
    n: 371, d: "C", c: ["limit-definition"],
    q: LIMIT_DEF + t`
$$f(x)=\sqrt{x+4}$$`,
    hints: [
      t`Write $f'(x)=\lim_{h\to0}\dfrac{f(x+h)-f(x)}{h}$ with $f(x+h)=\sqrt{x+h+4}$. Substituting $h=0$ gives $\frac00$.`,
      t`Multiply the top and the bottom by the conjugate $\sqrt{x+h+4}+\sqrt{x+4}$ to remove the roots from the numerator.`,
    ],
    a: t`$f'(x)=\dfrac{1}{2\sqrt{x+4}}$`,
    steps: [
      ["Set up the limit", t`$f'(x)=\lim_{h\to0}\dfrac{\sqrt{x+h+4}-\sqrt{x+4}}{h}$, which is $\frac00$ at $h=0$.`],
      ["Multiply by the conjugate", t`$\dfrac{\sqrt{x+h+4}-\sqrt{x+4}}{h}\cdot\dfrac{\sqrt{x+h+4}+\sqrt{x+4}}{\sqrt{x+h+4}+\sqrt{x+4}}=\dfrac{(x+h+4)-(x+4)}{h\left(\sqrt{x+h+4}+\sqrt{x+4}\right)}$`],
      ["Cancel h", t`The numerator is $h$, so the fraction is $\dfrac{1}{\sqrt{x+h+4}+\sqrt{x+4}}$.`],
      ["Take the limit", t`As $h\to0$ this tends to $\dfrac{1}{2\sqrt{x+4}}$, for $x>-4$.`],
    ],
    check: [
      { kind: "value", expr: "limit((sqrt(x+h+4)-sqrt(x+4))/h, h, 0)", value: "1/(2*sqrt(x+4))" },
      { kind: "derivative", expr: "sqrt(x+4)", value: "1/(2*sqrt(x+4))" },
    ],
  },
  {
    n: 372, d: "C", c: ["limit-definition"],
    q: LIMIT_DEF + t`
$$f(x)=\frac{3}{x}$$`,
    hints: [
      t`Write $f(x+h)-f(x)=\dfrac{3}{x+h}-\dfrac{3}{x}$ and combine the two fractions over the common denominator $x(x+h)$.`,
      t`The numerator should simplify to $-3h$, which cancels the $h$ in the denominator of the difference quotient.`,
    ],
    a: t`$f'(x)=-\dfrac{3}{x^2}$`,
    steps: [
      ["Set up the limit", t`$f'(x)=\lim_{h\to0}\dfrac{\frac{3}{x+h}-\frac{3}{x}}{h}$.`],
      ["Combine the fractions", t`$\dfrac{3}{x+h}-\dfrac{3}{x}=\dfrac{3x-3(x+h)}{x(x+h)}=\dfrac{-3h}{x(x+h)}$.`],
      ["Cancel h", t`$\dfrac1h\cdot\dfrac{-3h}{x(x+h)}=\dfrac{-3}{x(x+h)}$.`],
      ["Take the limit", t`As $h\to0$, $\dfrac{-3}{x(x+h)}\to-\dfrac{3}{x^2}$, so $f'(x)=-\dfrac{3}{x^2}$ for $x\neq0$.`],
    ],
    check: [
      { kind: "value", expr: "limit((3/(x+h)-3/x)/h, h, 0)", value: "-3/x**2" },
      { kind: "derivative", expr: "3/x", value: "-3/x**2" },
    ],
  },

  // ---------- Differentiation rules ----------
  {
    n: 373, d: "F", c: ["derivative-rules"],
    q: FIND_D + t`
$$f(x)=3x^3-\frac{4}{x^2}$$`,
    hints: [t`Rewrite $\dfrac{4}{x^2}$ as $4x^{-2}$, then use the power rule on each term.`],
    a: t`$f'(x)=9x^2+\dfrac{8}{x^3}$`,
    steps: [
      ["Rewrite with exponents", t`$f(x)=3x^3-4x^{-2}$`],
      ["Differentiate each term", t`$f'(x)=3\cdot3x^2-4\cdot(-2)x^{-3}=9x^2+8x^{-3}$`],
      ["Write the answer", t`$f'(x)=9x^2+\dfrac{8}{x^3}$`],
    ],
    check: { kind: "derivative", expr: "3*x**3 - 4/x**2", value: "9*x**2 + 8/x**3" },
  },
  {
    n: 374, d: "C", c: ["chain-rule", "derivative-rules"],
    q: FIND_D + t`
$$f(x)=\left(4-x^2\right)^3$$`,
    hints: [t`The outside function is $u^3$ and the inside function is $u=4-x^2$. Use the chain rule: the derivative of the outside, evaluated at the inside, times the derivative of the inside.`],
    a: t`$f'(x)=-6x\left(4-x^2\right)^2$`,
    steps: [
      ["Identify the layers", t`Outside: $u^3$ with $u=4-x^2$. Inside: $u'=-2x$.`],
      ["Apply the chain rule", t`$f'(x)=3\left(4-x^2\right)^2\cdot(-2x)$`],
      ["Simplify", t`$f'(x)=-6x\left(4-x^2\right)^2$`],
    ],
    check: { kind: "derivative", expr: "(4 - x**2)**3", value: "-6*x*(4 - x**2)**2" },
  },
  {
    n: 375, d: "C", c: ["chain-rule", "exp-log-derivatives", "trig-derivatives"],
    q: FIND_D + t`
$$f(x)=e^{\sin x}$$`,
    hints: [t`The outside function is $e^u$, whose derivative is itself, and the inside function is $u=\sin x$.`],
    a: t`$f'(x)=\cos x\,e^{\sin x}$`,
    steps: [
      ["Identify the layers", t`Outside: $e^u$ with $u=\sin x$. Inside: $u'=\cos x$.`],
      ["Apply the chain rule", t`$f'(x)=e^{\sin x}\cdot\cos x$`],
      ["Write the answer", t`$f'(x)=\cos x\,e^{\sin x}$`],
    ],
    check: { kind: "derivative", expr: "exp(sin(x))", value: "cos(x)*exp(sin(x))" },
  },
  {
    n: 376, d: "F", c: ["chain-rule", "exp-log-derivatives"],
    q: FIND_D + t`
$$f(x)=\ln(x+2)$$`,
    hints: [t`$\dfrac{d}{dx}\ln u=\dfrac{u'}{u}$. The inside function is $u=x+2$, with derivative $1$.`],
    a: t`$f'(x)=\dfrac{1}{x+2}$`,
    steps: [
      ["The rule for ln", t`$\dfrac{d}{dx}\ln u=\dfrac{u'}{u}$`],
      ["Apply it", t`With $u=x+2$ and $u'=1$: $f'(x)=\dfrac{1}{x+2}$, for $x>-2$.`],
    ],
    check: { kind: "derivative", expr: "log(x+2)", value: "1/(x+2)" },
  },
  {
    n: 377, d: "C", c: ["derivative-rules", "trig-derivatives"],
    q: FIND_D + t`
$$f(x)=x^2\cos x+x\tan x$$`,
    hints: [
      t`Each term is a product. Use the product rule, $(uv)'=u'v+uv'$, on each of them.`,
      t`$\dfrac{d}{dx}\cos x=-\sin x$ and $\dfrac{d}{dx}\tan x=\sec^2x$.`,
    ],
    a: t`$f'(x)=2x\cos x-x^2\sin x+\tan x+x\sec^2x$`,
    steps: [
      ["First term", t`$\dfrac{d}{dx}\left(x^2\cos x\right)=2x\cos x+x^2(-\sin x)=2x\cos x-x^2\sin x$`],
      ["Second term", t`$\dfrac{d}{dx}(x\tan x)=1\cdot\tan x+x\sec^2x=\tan x+x\sec^2x$`],
      ["Add them", t`$f'(x)=2x\cos x-x^2\sin x+\tan x+x\sec^2x$`],
    ],
    check: { kind: "derivative", expr: "x**2*cos(x) + x*tan(x)", value: "2*x*cos(x) - x**2*sin(x) + tan(x) + x*sec(x)**2" },
  },
  {
    n: 378, d: "C", c: ["chain-rule"],
    q: FIND_D + t`
$$f(x)=\sqrt{3x^2+2}$$`,
    hints: [t`Write the function as $\left(3x^2+2\right)^{1/2}$ and use the chain rule.`],
    a: t`$f'(x)=\dfrac{3x}{\sqrt{3x^2+2}}$`,
    steps: [
      ["Rewrite", t`$f(x)=\left(3x^2+2\right)^{1/2}$`],
      ["Apply the chain rule", t`$f'(x)=\dfrac12\left(3x^2+2\right)^{-1/2}\cdot6x$`],
      ["Simplify", t`$f'(x)=\dfrac{6x}{2\sqrt{3x^2+2}}=\dfrac{3x}{\sqrt{3x^2+2}}$`],
    ],
    check: { kind: "derivative", expr: "sqrt(3*x**2+2)", value: "3*x/sqrt(3*x**2+2)" },
  },
  {
    n: 379, d: "Ch", c: ["derivative-rules", "trig-derivatives"],
    q: FIND_D + t`
$$f(x)=\frac{x}{4}\sin^{-1}(x)$$`,
    hints: [
      t`Use the product rule with $u=\dfrac{x}{4}$ and $v=\sin^{-1}x$.`,
      t`$\dfrac{d}{dx}\sin^{-1}x=\dfrac{1}{\sqrt{1-x^2}}$.`,
    ],
    a: t`$f'(x)=\dfrac14\sin^{-1}x+\dfrac{x}{4\sqrt{1-x^2}}$`,
    steps: [
      ["Product rule", t`$f'(x)=\dfrac14\sin^{-1}x+\dfrac{x}{4}\cdot\dfrac{d}{dx}\sin^{-1}x$`],
      ["The inverse sine derivative", t`$\dfrac{d}{dx}\sin^{-1}x=\dfrac{1}{\sqrt{1-x^2}}$, for $-1<x<1$.`],
      ["Put it together", t`$f'(x)=\dfrac14\sin^{-1}x+\dfrac{x}{4\sqrt{1-x^2}}$`],
    ],
    check: { kind: "derivative", expr: "x/4*asin(x)", value: "asin(x)/4 + x/(4*sqrt(1-x**2))" },
  },
  {
    n: 380, d: "Ch", c: ["implicit-differentiation", "derivative-rules"],
    q: t`Find $\dfrac{dy}{dx}$ by implicit differentiation.
$$x^2y=(y+2)+xy\sin x$$`,
    hints: [
      t`Differentiate both sides with respect to $x$, treating $y$ as a function of $x$. Every term with $y$ gets a factor $y'$, and $x^2y$ and $xy\sin x$ need the product rule.`,
      t`Gather every term containing $y'$ on one side, factor out $y'$, and divide.`,
    ],
    a: t`$\dfrac{dy}{dx}=\dfrac{y\sin x+xy\cos x-2xy}{x^2-x\sin x-1}$`,
    steps: [
      ["Differentiate both sides", t`$\dfrac{d}{dx}\left[x^2y\right]=2xy+x^2y'$, and $\dfrac{d}{dx}\left[(y+2)+xy\sin x\right]=y'+y\sin x+xy'\sin x+xy\cos x$.`],
      ["Set them equal", t`$2xy+x^2y'=y'+y\sin x+xy'\sin x+xy\cos x$`],
      ["Gather the y′ terms", t`$x^2y'-y'-xy'\sin x=y\sin x+xy\cos x-2xy$`],
      ["Factor and divide", t`$y'\left(x^2-1-x\sin x\right)=y\sin x+xy\cos x-2xy$, so $\dfrac{dy}{dx}=\dfrac{y\sin x+xy\cos x-2xy}{x^2-x\sin x-1}$.`],
    ],
    check: {
      kind: "value",
      expr: "-diff(x**2*y-(y+2)-x*y*sin(x), x)/diff(x**2*y-(y+2)-x*y*sin(x), y)",
      value: "(y*sin(x)+x*y*cos(x)-2*x*y)/(x**2-x*sin(x)-1)",
    },
  },

  // ---------- Derivatives of various orders ----------
  {
    n: 381, d: "C", c: ["derivative-rules", "exp-log-derivatives", "trig-derivatives"],
    q: t`Find the first derivative of
$$y=x\ln(x)\cos x$$`,
    hints: [t`There are three factors. The product rule for three factors is $(uvw)'=u'vw+uv'w+uvw'$.`],
    a: t`$y'=\ln x\cos x+\cos x-x\ln x\sin x$`,
    steps: [
      ["Name the factors", t`Let $u=x$, $v=\ln x$ and $w=\cos x$, so $u'=1$, $v'=\dfrac1x$ and $w'=-\sin x$.`],
      ["Apply the product rule", t`$y'=u'vw+uv'w+uvw'=\ln x\cos x+x\cdot\dfrac1x\cos x+x\ln x(-\sin x)$`],
      ["Simplify", t`$y'=\ln x\cos x+\cos x-x\ln x\sin x$`],
    ],
    check: { kind: "derivative", expr: "x*log(x)*cos(x)", value: "log(x)*cos(x) + cos(x) - x*log(x)*sin(x)" },
  },
  {
    n: 382, d: "F", c: ["higher-derivatives"],
    q: t`Find the third derivative of
$$y=(3x+2)^2$$`,
    hints: [t`Differentiate three times in a row. You can use the chain rule, or expand $(3x+2)^2$ first.`],
    a: t`$y'''=0$`,
    steps: [
      ["First derivative", t`$y'=2(3x+2)\cdot3=6(3x+2)=18x+12$`],
      ["Second derivative", t`$y''=18$`],
      ["Third derivative", t`The derivative of a constant is $0$, so $y'''=0$.`],
    ],
    check: [
      { kind: "value", expr: "diff((3*x+2)**2, x, 2)", value: "18" },
      { kind: "value", expr: "diff((3*x+2)**2, x, 3)", value: "0" },
    ],
  },
  {
    n: 383, d: "Ch", c: ["higher-derivatives", "exp-log-derivatives", "trig-derivatives"],
    q: t`Find the second derivative of
$$y=4^x+x^2\sin x$$`,
    hints: [
      t`Differentiate twice. The derivative of $4^x$ is $4^x\ln4$, and $x^2\sin x$ needs the product rule each time.`,
    ],
    a: t`$y''=(\ln4)^2\,4^x+2\sin x+4x\cos x-x^2\sin x$`,
    steps: [
      ["First derivative", t`$y'=4^x\ln4+2x\sin x+x^2\cos x$`],
      ["Differentiate again", t`$\dfrac{d}{dx}\left(4^x\ln4\right)=4^x(\ln4)^2$, $\ \dfrac{d}{dx}(2x\sin x)=2\sin x+2x\cos x$, $\ \dfrac{d}{dx}\left(x^2\cos x\right)=2x\cos x-x^2\sin x$`],
      ["Add the pieces", t`$y''=(\ln4)^2\,4^x+2\sin x+4x\cos x-x^2\sin x$`],
    ],
    check: [
      { kind: "derivative", expr: "4**x + x**2*sin(x)", value: "log(4)*4**x + 2*x*sin(x) + x**2*cos(x)" },
      { kind: "derivative", expr: "log(4)*4**x + 2*x*sin(x) + x**2*cos(x)", value: "log(4)**2*4**x + 2*sin(x) + 4*x*cos(x) - x**2*sin(x)" },
    ],
  },

  // ---------- Tangent lines ----------
  {
    n: 384, d: "C", c: ["tangent-lines", "trig-derivatives"],
    q: TANGENT + t`
$$y=\cos^{-1}(x)+x\quad\text{at }x=0$$`,
    hints: [
      t`A tangent line needs a point and a slope: the point is $(0,y(0))$ and the slope is $y'(0)$.`,
      t`$\dfrac{d}{dx}\cos^{-1}x=-\dfrac{1}{\sqrt{1-x^2}}$.`,
    ],
    a: t`$y=\dfrac{\pi}{2}$ (a horizontal line)`,
    steps: [
      ["The point", t`$y(0)=\cos^{-1}(0)+0=\dfrac\pi2$, so the point is $\left(0,\dfrac\pi2\right)$.`],
      ["The slope", t`$y'=-\dfrac{1}{\sqrt{1-x^2}}+1$, so $y'(0)=-1+1=0$.`],
      ["The tangent line", t`With slope $0$ through $\left(0,\dfrac\pi2\right)$, the tangent line is $y=\dfrac\pi2$.`],
    ],
    check: [
      { kind: "derivative", expr: "acos(x) + x", value: "1 - 1/sqrt(1-x**2)" },
      { kind: "value", expr: "acos(0)", value: "pi/2" },
      { kind: "value", expr: "1 - 1/sqrt(1-0**2)", value: "0" },
    ],
  },
  {
    n: 385, d: "C", c: ["tangent-lines", "exp-log-derivatives"],
    q: TANGENT + t`
$$y=x+e^x-\frac{1}{x}\quad\text{at }x=1$$`,
    hints: [
      t`Find the point $(1,y(1))$ and the slope $y'(1)$, then write the line as $y-y(1)=y'(1)(x-1)$.`,
      t`Rewrite $\dfrac1x$ as $x^{-1}$ before differentiating.`,
    ],
    a: t`$y=(e+2)x-2$`,
    steps: [
      ["The point", t`$y(1)=1+e-1=e$, so the point is $(1,e)$.`],
      ["The slope", t`$y'=1+e^x+\dfrac{1}{x^2}$, so $y'(1)=1+e+1=e+2$.`],
      ["The tangent line", t`$y-e=(e+2)(x-1)$, so $y=(e+2)x-2$.`],
    ],
    check: [
      { kind: "derivative", expr: "x + exp(x) - 1/x", value: "1 + exp(x) + 1/x**2" },
      { kind: "value", expr: "1 + exp(1) - 1/1", value: "exp(1)" },
      { kind: "value", expr: "1 + exp(1) + 1/1**2", value: "exp(1) + 2" },
      { kind: "value", expr: "(exp(1) + 2)*1 - 2", value: "exp(1)" },
    ],
  },

  // ---------- Derivative graphs (386 and 387 added from the owner's screenshots) ----------
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

  // ---------- Ocean City water level ----------
  {
    n: 388, d: "Ch", c: ["rates-of-change", "chain-rule", "trig-derivatives"],
    q: WATER + t`

Find and graph the derivative. Interpret what the derivative expresses.`,
    hints: [
      t`Use the chain rule: the derivative of $\cos u$ is $-\sin u\cdot u'$, with $u=\dfrac{\pi}{6}t$ and $u'=\dfrac\pi6$. The constant $1.9$ drops out.`,
      t`The derivative is the rate of change of the water level, in feet per hour: positive while the water is rising and negative while it is falling.`,
    ],
    a: t`$w'(t)=-\dfrac{29\pi}{60}\sin\left(\dfrac\pi6t\right)\approx-1.52\sin\left(\dfrac\pi6t\right)$ feet per hour. It is the rate at which the water level changes: negative (falling) for $0<t<6$, positive (rising) for $6<t<12$, with the pattern repeating every $12$ hours. Its graph is an upside-down sine wave with amplitude about $1.52$ and period $12$ hours.`,
    steps: [
      ["Differentiate", t`$w'(t)=2.9\cdot\left(-\sin\left(\dfrac\pi6t\right)\right)\cdot\dfrac\pi6=-\dfrac{29\pi}{60}\sin\left(\dfrac\pi6t\right)$. The coefficient $\dfrac{29\pi}{60}$ is about $1.52$.`],
      ["Describe the graph", t`It is a sine wave turned upside down, with amplitude $\dfrac{29\pi}{60}\approx1.52$ and period $\dfrac{2\pi}{\pi/6}=12$ hours. It is $0$ at $t=0,6,12,\dots$, lowest ($-1.52$) at $t=3$, and highest ($+1.52$) at $t=9$.`],
      ["Signs of w′", t`$w'<0$ for $0<t<6$ (the water level is falling) and $w'>0$ for $6<t<12$ (rising); then the pattern repeats.`],
      ["What it expresses", t`$w'(t)$ is the rate of change of the water level, in feet per hour. It is $0$ at high tide ($t=0$, $w=4.8$ ft) and at low tide ($t=6$, $w=-1.0$ ft), where the level stops changing for a moment.`],
    ],
    check: [
      { kind: "derivative", expr: "Rational(19,10) + Rational(29,10)*cos(pi*t/6)", value: "-29*pi/60*sin(pi*t/6)", var: "t" },
      { kind: "value", expr: "Rational(19,10) + Rational(29,10)*cos(0)", value: "24/5" },
      { kind: "value", expr: "Rational(19,10) + Rational(29,10)*cos(pi)", value: "-1" },
    ],
  },
  {
    n: 389, d: "C", c: ["rates-of-change", "chain-rule", "trig-derivatives"],
    q: WATER + t`

Find $w'(3)$ and explain what this means. How is this value related to the shape of the graph?`,
    hints: [
      t`Differentiate $w$ first: $w'(t)=-\dfrac{29\pi}{60}\sin\left(\dfrac\pi6t\right)$. Then evaluate at $t=3$, where $\sin\dfrac\pi2=1$.`,
      t`Units: feet (height) per hour (time). Is the sign positive or negative: is the water rising or falling at $t=3$?`,
    ],
    a: t`$w'(3)=-\dfrac{29\pi}{60}\approx-1.52$ feet per hour. At $t=3$ (3 a.m.) the water level is falling by about $1.52$ ft each hour. It is the slope of the tangent line to the graph of $w$ at $t=3$, the steepest downward slope of the whole cycle, where the graph crosses its middle level $1.9$ ft.`,
    steps: [
      ["Evaluate the derivative", t`$w'(3)=-\dfrac{29\pi}{60}\sin\left(\dfrac\pi6\cdot3\right)=-\dfrac{29\pi}{60}\sin\dfrac\pi2=-\dfrac{29\pi}{60}\approx-1.52$.`],
      ["Units and meaning", t`$t$ is in hours and $w$ is in feet, so $w'(3)$ is in feet per hour. The value is negative, so at $3$ a.m. the water level is falling by about $1.52$ ft each hour.`],
      ["Connect it to the graph", t`$w'(3)$ is the slope of the tangent line to the graph of $w$ at $t=3$. There $w(3)=1.9+2.9\cos\dfrac\pi2=1.9$ ft, the middle level, and the slope is as steep downward as it ever gets: the level is dropping fastest.`],
    ],
    check: [
      { kind: "derivative", expr: "Rational(19,10) + Rational(29,10)*cos(pi*t/6)", value: "-29*pi/60*sin(pi*t/6)", var: "t" },
      { kind: "value", expr: "-29*pi/60*sin(pi/6*3)", value: "-29*pi/60" },
      { kind: "value", expr: "Rational(19,10) + Rational(29,10)*cos(pi/2)", value: "19/10" },
    ],
  },

  // ---------- Hurricane Katrina wind speeds ----------
  {
    n: 390, d: "C", c: ["rates-of-change"],
    q: KATRINA + t`

Estimate the derivative of the wind speed at hour $39$. What is the physical meaning?`,
    hints: [
      t`Hour $39$ is halfway between the table entries at hours $29$ and $49$. Use the slope between those two points.`,
      t`Slope $=\dfrac{\text{change in wind speed}}{\text{change in time}}$. Give the units: mph per hour.`,
    ],
    a: t`$\dfrac{145-115}{49-29}=1.5$ mph per hour. Around hour $39$ the wind speed is increasing by about $1.5$ mph each hour.`,
    steps: [
      ["Use the data on each side", t`Hour $39$ lies halfway between hour $29$ ($115$ mph) and hour $49$ ($145$ mph).`],
      ["Difference quotient", t`$\dfrac{145-115}{49-29}=\dfrac{30}{20}=1.5$`],
      ["Units and meaning", t`The units are miles per hour per hour (mph/h). The derivative is the rate of change of the wind speed: near hour $39$ the wind is speeding up by about $1.5$ mph each hour.`],
    ],
    check: { kind: "value", expr: "(145 - 115)/(49 - 29)", value: "3/2" },
  },
  {
    n: 391, d: "C", c: ["rates-of-change"],
    q: KATRINA + t`

Estimate the derivative of the wind speed at hour $83$. What is the physical meaning?`,
    hints: [
      t`Hour $83$ is halfway between the table entries at hours $81$ and $85$. Use the slope between those two points.`,
      t`Slope $=\dfrac{\text{change in wind speed}}{\text{change in time}}$. Give the units: mph per hour.`,
    ],
    a: t`$\dfrac{95-125}{85-81}=-7.5$ mph per hour. Around hour $83$ the wind speed is decreasing by about $7.5$ mph each hour.`,
    steps: [
      ["Use the data on each side", t`Hour $83$ lies halfway between hour $81$ ($125$ mph) and hour $85$ ($95$ mph).`],
      ["Difference quotient", t`$\dfrac{95-125}{85-81}=\dfrac{-30}{4}=-7.5$`],
      ["Units and meaning", t`The units are miles per hour per hour (mph/h). The negative sign means the wind speed is dropping: near hour $83$ the wind is slowing by about $7.5$ mph each hour.`],
    ],
    check: { kind: "value", expr: "(95 - 125)/(85 - 81)", value: "-15/2" },
  },
]);
