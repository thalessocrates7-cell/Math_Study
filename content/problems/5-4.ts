import { sectionProblems, t } from "../helpers";

const BASIC = t`Use basic integration formulas to compute the integral.`;

export default sectionProblems("5.4", [
  // ---------- Foundation ----------
  {
    n: 207, d: "F", c: ["basic-formulas"],
    q: BASIC + t`
$$\int\left(\sqrt{x}-\frac{1}{\sqrt{x}}\right)dx$$`,
    hints: [t`Write both terms as powers: $x^{1/2}-x^{-1/2}$.`],
    a: t`$\dfrac23x^{3/2}-2\sqrt{x}+C$`,
    steps: [
      ["Rewrite", t`$\int\left(x^{1/2}-x^{-1/2}\right)dx$`],
      ["Power rule", t`$\frac{x^{3/2}}{3/2}-\frac{x^{1/2}}{1/2}=\frac23x^{3/2}-2x^{1/2}$`],
      ["Answer", t`$\frac23x^{3/2}-2\sqrt x+C$`],
    ],
    check: { kind: "antiderivative", f: "sqrt(x) - 1/sqrt(x)", F: "2*x**(Rational(3,2))/3 - 2*sqrt(x)" },
  },
  {
    n: 209, d: "F", c: ["basic-formulas"],
    q: BASIC + t`
$$\int\frac{dx}{2x}$$`,
    hints: [t`Pull out the constant $\frac12$. What is $\int\frac{1}{x}\,dx$?`],
    a: t`$\dfrac12\ln|x|+C$`,
    steps: [
      ["Factor the constant", t`$\int\frac{dx}{2x}=\frac12\int\frac{dx}{x}$`],
      ["Use the log rule", t`$\int\frac{dx}{x}=\ln|x|+C$, so the answer is $\frac12\ln|x|+C$.`],
    ],
    check: { kind: "antiderivative", f: "1/(2*x)", F: "log(Abs(x))/2" },
  },
  {
    n: 211, d: "F", c: ["basic-formulas"],
    q: BASIC + t`
$$\int_0^{\pi}\left(\sin x-\cos x\right)dx$$`,
    hints: [t`An antiderivative is $-\cos x-\sin x$.`],
    a: t`$2$`,
    steps: [
      ["Antiderivative", t`$F(x)=-\cos x-\sin x$`],
      ["Evaluate", t`$F(\pi)=-(-1)-0=1$ and $F(0)=-1-0=-1$`],
      ["Subtract", t`$1-(-1)=2$`],
    ],
    check: { kind: "definite", f: "sin(x) - cos(x)", a: "0", b: "pi", value: "2" },
  },
  {
    n: 213, d: "F", c: ["net-change"],
    q: t`Write an integral that gives the increase in the perimeter $P(s)$ of a square when its side length $s$ increases from 2 units to 4 units, and evaluate it.`,
    hints: [t`$P(s)=4s$, so $P'(s)=4$. By the net change theorem, the increase is $\int_2^4P'(s)\,ds$.`],
    a: t`$\displaystyle\int_2^4 4\,ds=8$ units.`,
    steps: [
      ["Rate of change", t`$P(s)=4s$, so $P'(s)=4$.`],
      ["Net change theorem", t`$P(4)-P(2)=\int_2^4 4\,ds=4(4-2)=8$ units.`],
    ],
    check: { kind: "definite", f: "4", a: "2", b: "4", value: "8", var: "s" },
  },
  {
    n: 223, d: "F", c: ["displacement-distance"],
    q: t`A particle moves along a line with velocity $v(t)=4-2t$ m/sec for $0\le t\le2$. Find the displacement at time $t$ and the total distance traveled up to $t=2$.`,
    hints: [t`Displacement is $\int_0^tv(\tau)\,d\tau$. Check whether $v$ changes sign on $[0,2]$ before finding distance.`],
    a: t`Displacement $4t-t^2$ m; total distance up to $t=2$ is $4$ m.`,
    steps: [
      ["Displacement", t`$\int_0^t(4-2\tau)\,d\tau=4t-t^2$`],
      ["Sign of v", t`$v(t)=4-2t\ge0$ on $[0,2]$, so the particle never moves backward.`],
      ["Total distance", t`Distance = displacement at $t=2$: $4(2)-2^2=4$ m.`],
    ],
    check: [
      { kind: "antiderivative", f: "4 - 2*t", F: "4*t - t**2", var: "t" },
      { kind: "definite", f: "Abs(4 - 2*t)", a: "0", b: "2", value: "4", var: "t" },
    ],
  },
  {
    n: "o2", d: "F", c: ["even-odd"],
    q: t`Use symmetry to evaluate the integral. (Original practice problem in the style of Section 5.4.)
$$\int_{-\pi}^{\pi}\left(\sin x+x^3\right)dx$$`,
    hints: [t`Are $\sin x$ and $x^3$ even or odd? What happens when you integrate an odd function over $[-a,a]$?`],
    a: t`$0$`,
    steps: [
      ["Check symmetry", t`$\sin(-x)=-\sin x$ and $(-x)^3=-x^3$, so the integrand is odd.`],
      ["Odd-function rule", t`For odd $f$, $\int_{-a}^{a}f(x)\,dx=0$. So the integral is $0$.`],
    ],
    check: { kind: "definite", f: "sin(x) + x**3", a: "-pi", b: "pi", value: "0" },
  },

  // ---------- Core ----------
  {
    n: 208, d: "C", c: ["basic-formulas"],
    q: BASIC + t`
$$\int\left(e^{2x}-\frac12e^{x/2}\right)dx$$`,
    hints: [t`$\int e^{kx}\,dx=\frac1ke^{kx}+C$.`],
    a: t`$\dfrac12e^{2x}-e^{x/2}+C$`,
    steps: [
      ["First term", t`$\int e^{2x}\,dx=\frac12e^{2x}$`],
      ["Second term", t`$\int\frac12e^{x/2}\,dx=\frac12\cdot2e^{x/2}=e^{x/2}$`],
      ["Combine", t`$\frac12e^{2x}-e^{x/2}+C$`],
    ],
    check: { kind: "antiderivative", f: "exp(2*x) - exp(x/2)/2", F: "exp(2*x)/2 - exp(x/2)" },
  },
  {
    n: 210, d: "C", c: ["basic-formulas"],
    q: BASIC + t`
$$\int\frac{x-1}{x^2}\,dx$$`,
    hints: [t`Split the fraction: $\frac{x}{x^2}-\frac{1}{x^2}=\frac1x-x^{-2}$.`],
    a: t`$\ln|x|+\dfrac1x+C$`,
    steps: [
      ["Split", t`$\int\left(\frac1x-x^{-2}\right)dx$`],
      ["Integrate", t`$\int\frac1x\,dx=\ln|x|$ and $\int x^{-2}\,dx=-x^{-1}$`],
      ["Combine (watch the signs)", t`$\ln|x|-(-x^{-1})=\ln|x|+\frac1x+C$`],
    ],
    check: { kind: "antiderivative", f: "(x - 1)/x**2", F: "log(Abs(x)) + 1/x" },
  },
  {
    n: 212, d: "C", c: ["basic-formulas"],
    q: BASIC + t`
$$\int_0^{\pi/2}\left(x-\sin x\right)dx$$`,
    hints: [t`An antiderivative is $\frac{x^2}{2}+\cos x$.`],
    a: t`$\dfrac{\pi^2}{8}-1$`,
    steps: [
      ["Antiderivative", t`$F(x)=\frac{x^2}{2}+\cos x$`],
      ["Evaluate", t`$F\left(\frac{\pi}{2}\right)=\frac{\pi^2}{8}+0$ and $F(0)=0+1$`],
      ["Subtract", t`$\frac{\pi^2}{8}-1\approx0.234$`],
    ],
    check: { kind: "definite", f: "x - sin(x)", a: "0", b: "pi/2", value: "pi**2/8 - 1" },
  },
  {
    n: 214, d: "C", c: ["net-change"],
    q: t`Write an integral that gives the change in the area $A(s)=s^2$ of a square when the side length doubles from $S$ units to $2S$ units, and evaluate it.`,
    hints: [t`By the net change theorem, $A(2S)-A(S)=\int_S^{2S}A'(s)\,ds$ with $A'(s)=2s$.`],
    a: t`$\displaystyle\int_S^{2S}2s\,ds=3S^2$ square units.`,
    steps: [
      ["Rate of change", t`$A'(s)=2s$`],
      ["Integrate", t`$\int_S^{2S}2s\,ds=\left[s^2\right]_S^{2S}=4S^2-S^2=3S^2$`],
    ],
    check: { kind: "value", expr: "integrate(2*s, (s, s0, 2*s0))", value: "3*s0**2" },
  },
  {
    n: 224, d: "C", c: ["displacement-distance"],
    q: t`A particle moves along a line with velocity $v(t)=t^2-3t-18$ m/sec for $0\le t\le6$. Find the displacement at time $t$ and the total distance traveled up to $t=6$.`,
    hints: [
      t`Factor $v(t)=(t-6)(t+3)$. What is its sign on $[0,6]$?`,
      t`Total distance is $\int_0^6|v(t)|\,dt$.`,
    ],
    a: t`Displacement $\dfrac{t^3}{3}-\dfrac{3t^2}{2}-18t$ m (so $-90$ m at $t=6$); total distance $90$ m.`,
    steps: [
      ["Displacement", t`$\int_0^t(\tau^2-3\tau-18)\,d\tau=\frac{t^3}{3}-\frac{3t^2}{2}-18t$`],
      ["At t = 6", t`$72-54-108=-90$ m (the particle ends 90 m behind where it started).`],
      ["Sign of v", t`$v(t)=(t-6)(t+3)\le0$ on $[0,6]$: it only moves backward.`],
      ["Total distance", t`$\int_0^6|v|\,dt=-\int_0^6v\,dt=90$ m.`],
    ],
    check: [
      { kind: "antiderivative", f: "t**2 - 3*t - 18", F: "t**3/3 - 3*t**2/2 - 18*t", var: "t" },
      { kind: "definite", f: "Abs(t**2 - 3*t - 18)", a: "0", b: "6", value: "90", var: "t" },
    ],
  },
  {
    n: 227, d: "C", c: ["motion-ivp"],
    q: t`A ball is thrown upward from a height of 1.5 m with an initial speed of 40 m/sec. The acceleration due to gravity is $-9.8$ m/sec². Ignoring air resistance, find the velocity $v(t)$ and the height $h(t)$ of the ball $t$ seconds after it is thrown (before it lands).`,
    hints: [
      t`Integrate $a(t)=-9.8$ to get $v(t)$ and use $v(0)=40$.`,
      t`Integrate $v(t)$ to get $h(t)$ and use $h(0)=1.5$.`,
    ],
    a: t`$v(t)=40-9.8t$ m/sec and $h(t)=1.5+40t-4.9t^2$ m.`,
    steps: [
      ["Velocity", t`$v(t)=\int-9.8\,dt=-9.8t+C_1$; $v(0)=40$ gives $v(t)=40-9.8t$.`],
      ["Height", t`$h(t)=\int(40-9.8t)\,dt=40t-4.9t^2+C_2$; $h(0)=1.5$ gives $h(t)=1.5+40t-4.9t^2$.`],
    ],
    check: [
      { kind: "ivp", df: "-9.8", F: "40 - 9.8*t", x0: "0", y0: "40", var: "t" },
      { kind: "ivp", df: "40 - 9.8*t", F: "1.5 + 40*t - 4.9*t**2", x0: "0", y0: "1.5", var: "t" },
    ],
  },
  {
    n: 229, d: "C", c: ["net-change"],
    q: t`The area $A(t)$ of a circular shape is growing at a constant rate. The area increases from $4\pi$ square units to $9\pi$ square units between $t=2$ and $t=3$. Find the net change in the radius during that time.`,
    hints: [t`The net change in the radius is $r(3)-r(2)$. Use $A=\pi r^2$ to find each radius.`],
    a: t`The radius increases by $1$ unit (from 2 to 3).`,
    steps: [
      ["Radius at t = 2", t`$\pi r^2=4\pi$ gives $r=2$.`],
      ["Radius at t = 3", t`$\pi r^2=9\pi$ gives $r=3$.`],
      ["Net change", t`$r(3)-r(2)=3-2=1$ unit. (Net change only depends on the endpoints.)`],
    ],
    check: { kind: "value", expr: "sqrt(9*pi/pi) - sqrt(4*pi/pi)", value: "1" },
  },
  {
    n: 241, d: "C", c: ["net-change"],
    q: t`Sandra burns $300-50t$ calories per hour while walking on her treadmill. Her caloric intake from drinking Gatorade is $100t$ calories per hour. What is her net decrease in calories after walking for 3 hours?`,
    hints: [t`The net rate of decrease is (burned) $-$ (taken in) $=300-50t-100t$ cal/hr. Integrate it over $[0,3]$.`],
    a: t`$225$ calories.`,
    steps: [
      ["Net rate", t`$(300-50t)-100t=300-150t$ cal/hr`],
      ["Net change theorem", t`$\int_0^3(300-150t)\,dt=\left[300t-75t^2\right]_0^3=900-675=225$`],
    ],
    check: { kind: "definite", f: "300 - 150*t", a: "0", b: "3", value: "225", var: "t" },
  },
  {
    n: "o1", d: "C", c: ["even-odd"],
    q: t`Use the even and odd parts of the integrand to evaluate the integral. (Original practice problem in the style of Section 5.4.)
$$\int_{-2}^{2}\left(x^4-3x^2+5x\right)dx$$`,
    hints: [t`$x^4-3x^2$ is even and $5x$ is odd. For even $f$, $\int_{-a}^{a}f\,dx=2\int_0^af\,dx$; for odd $f$ it is $0$.`],
    a: t`$-\dfrac{16}{5}$`,
    steps: [
      ["Odd part", t`$\int_{-2}^{2}5x\,dx=0$`],
      ["Even part", t`$2\int_0^2\left(x^4-3x^2\right)dx=2\left[\frac{x^5}{5}-x^3\right]_0^2=2\left(\frac{32}{5}-8\right)$`],
      ["Simplify", t`$2\left(-\frac85\right)=-\frac{16}{5}$`],
    ],
    check: { kind: "definite", f: "x**4 - 3*x**2 + 5*x", a: "-2", b: "2", value: "-16/5" },
  },
  {
    n: "o3", d: "C", c: ["even-odd"],
    q: t`Evaluate the integral without finding an antiderivative. (Original practice problem in the style of Section 5.4.)
$$\int_{-3}^{3}\frac{x^5}{1+x^4}\,dx$$`,
    hints: [t`Replace $x$ with $-x$. What happens to the integrand?`],
    a: t`$0$`,
    steps: [
      ["Check symmetry", t`$\frac{(-x)^5}{1+(-x)^4}=\frac{-x^5}{1+x^4}$, so the integrand is odd.`],
      ["Symmetric interval", t`The interval $[-3,3]$ is symmetric about 0, so the integral of an odd function is $0$.`],
    ],
    check: { kind: "definite", f: "x**5/(1 + x**4)", a: "-3", b: "3", value: "0" },
  },

  // ---------- Challenge ----------
  {
    n: 225, d: "Ch", c: ["displacement-distance"],
    q: t`A particle moves along a line with velocity $v(t)=|2t-6|$ m/sec for $0\le t\le6$. Find the displacement at time $t$ and the total distance traveled up to $t=6$.`,
    hints: [
      t`Remove the absolute value: $v(t)=6-2t$ for $t\le3$ and $v(t)=2t-6$ for $t\ge3$.`,
      t`For $t\ge3$, displacement $=\int_0^3(6-2\tau)\,d\tau+\int_3^t(2\tau-6)\,d\tau$.`,
    ],
    a: t`Displacement: $6t-t^2$ for $0\le t\le3$ and $t^2-6t+18$ for $3\le t\le6$. Total distance up to $t=6$: $18$ m (here $v\ge0$, so distance equals displacement).`,
    steps: [
      ["First piece", t`For $0\le t\le3$: $\int_0^t(6-2\tau)\,d\tau=6t-t^2$, reaching $9$ at $t=3$.`],
      ["Second piece", t`For $3\le t\le6$: $9+\int_3^t(2\tau-6)\,d\tau=9+\left(t^2-6t\right)-(9-18)=t^2-6t+18$.`],
      ["Total distance", t`$v\ge0$ always, so distance $=$ displacement at $t=6$: $36-36+18=18$ m.`],
    ],
    check: [
      { kind: "definite", f: "Abs(2*t - 6)", a: "0", b: "6", value: "18", var: "t" },
      { kind: "value", expr: "integrate(Abs(2*t - 6), (t, 0, 2))", value: "6*2 - 2**2" },
      { kind: "value", expr: "integrate(Abs(2*t - 6), (t, 0, 5))", value: "5**2 - 6*5 + 18" },
    ],
  },
  {
    n: 226, d: "Ch", c: ["motion-ivp", "displacement-distance"],
    q: t`A particle moves along a line with acceleration $a(t)=t-3$ m/sec² for $0\le t\le6$. Find the velocity and displacement at time $t$, and the total distance traveled up to $t=6$, if $v(0)=3$ and $d(0)=0$.`,
    hints: [
      t`Integrate twice, using $v(0)=3$ and $d(0)=0$.`,
      t`$v(t)$ changes sign where $\frac{t^2}{2}-3t+3=0$, at $t=3\pm\sqrt3$. Add the distances on each piece.`,
    ],
    a: t`$v(t)=\dfrac{t^2}{2}-3t+3$, $d(t)=\dfrac{t^3}{6}-\dfrac{3t^2}{2}+3t$, and the total distance is $4\sqrt3\approx6.93$ m.`,
    steps: [
      ["Velocity", t`$v(t)=\frac{t^2}{2}-3t+C$ with $v(0)=3$: $v(t)=\frac{t^2}{2}-3t+3$.`],
      ["Displacement", t`$d(t)=\frac{t^3}{6}-\frac{3t^2}{2}+3t$ (using $d(0)=0$).`],
      ["Where v changes sign", t`$t^2-6t+6=0$ gives $t=3\pm\sqrt3\approx1.27,\ 4.73$.`],
      ["Positions there", t`$d(3-\sqrt3)=\sqrt3$, $d(3+\sqrt3)=-\sqrt3$, $d(6)=0$.`],
      ["Total distance", t`$\sqrt3+2\sqrt3+\sqrt3=4\sqrt3\approx6.93$ m.`],
    ],
    check: [
      { kind: "ivp", df: "t - 3", F: "t**2/2 - 3*t + 3", x0: "0", y0: "3", var: "t" },
      { kind: "ivp", df: "t**2/2 - 3*t + 3", F: "t**3/6 - 3*t**2/2 + 3*t", x0: "0", y0: "0", var: "t" },
      { kind: "definite", f: "Abs(t**2/2 - 3*t + 3)", a: "0", b: "6", value: "4*sqrt(3)", var: "t" },
    ],
  },
  {
    n: 230, d: "Ch", c: ["net-change"],
    q: t`A spherical balloon is being inflated at a constant rate. Its volume changes from $36\pi$ in³ to $288\pi$ in³ between $t=30$ and $t=60$ seconds. Find the net change in the radius of the balloon during that time.`,
    hints: [t`Use $V=\frac43\pi r^3$ to find the radius at each time. Net change only depends on the two endpoints.`],
    a: t`The radius increases by $3$ in. (from 3 in. to 6 in.).`,
    steps: [
      ["Radius at t = 30", t`$\frac43\pi r^3=36\pi$ gives $r^3=27$, so $r=3$.`],
      ["Radius at t = 60", t`$\frac43\pi r^3=288\pi$ gives $r^3=216$, so $r=6$.`],
      ["Net change", t`$6-3=3$ in.`],
    ],
    check: { kind: "value", expr: "(288*3/4)**(Rational(1,3)) - (36*3/4)**(Rational(1,3))", value: "3" },
  },
  {
    n: 239, d: "Ch", c: ["motion-ivp"],
    q: t`The maximum braking deceleration of a car is about 7 m/sec² on dry concrete and 2.5 m/sec² on wet asphalt. Find the total distance the car travels after the brakes are applied, until it stops, if the initial velocity is 30 m/sec (67 mph) or 25 m/sec (56 mph), on each surface.`,
    hints: [
      t`With deceleration $a$: $v(t)=v_0-at$ and $s(t)=v_0t-\frac{a}{2}t^2$.`,
      t`The car stops at $t=\frac{v_0}{a}$, so the stopping distance is $\frac{v_0^2}{2a}$.`,
    ],
    a: t`Dry concrete: $\frac{450}{7}\approx64.3$ m from 30 m/sec and $\frac{625}{14}\approx44.6$ m from 25 m/sec. Wet asphalt: $180$ m and $125$ m.`,
    steps: [
      ["General stopping distance", t`$v(t)=0$ at $t=\frac{v_0}{a}$, so $s=v_0\cdot\frac{v_0}{a}-\frac a2\left(\frac{v_0}{a}\right)^2=\frac{v_0^2}{2a}$.`],
      ["Dry concrete (a = 7)", t`$\frac{30^2}{14}=\frac{450}{7}\approx64.3$ m and $\frac{25^2}{14}\approx44.6$ m`],
      ["Wet asphalt (a = 2.5)", t`$\frac{30^2}{5}=180$ m and $\frac{25^2}{5}=125$ m`],
    ],
    check: [
      { kind: "value", expr: "30**2/(2*7)", value: "450/7" },
      { kind: "value", expr: "25**2/(2*7)", value: "625/14" },
      { kind: "value", expr: "30**2/(2*Rational(5,2))", value: "180" },
      { kind: "value", expr: "25**2/(2*Rational(5,2))", value: "125" },
      { kind: "value", expr: "a*(a/7) - (7/2)*(a/7)**2", value: "a**2/14" },
    ],
  },
]);
