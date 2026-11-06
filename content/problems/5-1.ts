import { sectionProblems, t } from "../helpers";

export default sectionProblems("5.1", [
  // ---------- Foundation ----------
  {
    n: 2, d: "F", c: ["sigma-notation", "sum-properties"],
    q: t`Use the rules for sums of powers of integers to compute the sum.
$$\sum_{i=5}^{10} i$$`,
    hints: [t`Use $\sum_{i=1}^{n} i=\frac{n(n+1)}{2}$. Sum from 1 to 10, then subtract the terms from 1 to 4.`],
    a: t`$45$`,
    steps: [
      ["Sum from 1 to 10", t`$$\sum_{i=1}^{10} i=\frac{10\cdot11}{2}=55$$`],
      ["Remove the terms 1 through 4", t`$$\sum_{i=1}^{4} i=\frac{4\cdot5}{2}=10$$`],
      ["Subtract", t`$55-10=45$. (Check: $5+6+7+8+9+10=45$.)`],
    ],
    check: { kind: "value", expr: "Sum(i, (i, 5, 10))", value: "45" },
  },
  {
    n: 3, d: "F", c: ["sigma-notation", "sum-properties"],
    q: t`Use the rules for sums of powers of integers to compute the sum.
$$\sum_{i=5}^{10} i^2$$`,
    hints: [t`Use $\sum_{i=1}^{n} i^2=\frac{n(n+1)(2n+1)}{6}$ for $n=10$ and $n=4$, then subtract.`],
    a: t`$355$`,
    steps: [
      ["Sum of squares to 10", t`$$\sum_{i=1}^{10} i^2=\frac{10\cdot11\cdot21}{6}=385$$`],
      ["Sum of squares to 4", t`$$\sum_{i=1}^{4} i^2=\frac{4\cdot5\cdot9}{6}=30$$`],
      ["Subtract", t`$385-30=355$`],
    ],
    check: { kind: "value", expr: "Sum(i**2, (i, 5, 10))", value: "355" },
  },
  {
    n: 4, d: "F", c: ["sum-properties"],
    q: t`Suppose $\sum_{i=1}^{100} a_i=15$ and $\sum_{i=1}^{100} b_i=-12$. Compute the sum.
$$\sum_{i=1}^{100}\left(a_i+b_i\right)$$`,
    hints: [t`A sum of a sum splits: $\sum(a_i+b_i)=\sum a_i+\sum b_i$.`],
    a: t`$3$`,
    steps: [
      ["Split the sum", t`$$\sum_{i=1}^{100}(a_i+b_i)=\sum_{i=1}^{100}a_i+\sum_{i=1}^{100}b_i$$`],
      ["Substitute", t`$15+(-12)=3$`],
    ],
    check: { kind: "value", expr: "15 + (-12)", value: "3" },
  },
  {
    n: 6, d: "F", c: ["sum-properties"],
    q: t`Suppose $\sum_{i=1}^{100} a_i=15$ and $\sum_{i=1}^{100} b_i=-12$. Compute the sum.
$$\sum_{i=1}^{100}\left(3a_i-4b_i\right)$$`,
    hints: [t`Constants factor out of a sum: $\sum c\,a_i=c\sum a_i$.`],
    a: t`$93$`,
    steps: [
      ["Split and factor", t`$$\sum_{i=1}^{100}(3a_i-4b_i)=3\sum a_i-4\sum b_i$$`],
      ["Substitute", t`$3(15)-4(-12)=45+48=93$`],
    ],
    check: { kind: "value", expr: "3*15 - 4*(-12)", value: "93" },
  },
  {
    n: 35, d: "F", c: ["sum-applications", "sigma-notation"],
    q: t`Let $r_j$ be the total rainfall in Portland on the $j$th day of the year 2009. Interpret the sum.
$$\sum_{j=1}^{31} r_j$$`,
    hints: [t`Which days are $j=1$ through $j=31$?`],
    a: t`It is the total rainfall in Portland in January 2009 (the first 31 days of the year).`,
    steps: [
      ["Read the index", t`$j$ runs over days $1$ to $31$ of 2009, which are January 1 through January 31.`],
      ["Read the terms", t`Each $r_j$ is one day's rainfall, so adding them gives January's total rainfall.`],
    ],
    check: { kind: "manual", note: "Interpretation: days 1-31 of 2009 are January." },
  },
  {
    n: 39, d: "F", c: ["sum-applications"],
    q: t`The table gives the approximate increase in sea level, in inches, over the 20 years starting in each given year. Estimate the net change in mean sea level from 1870 to 2010.
| Starting year | 20-year change (in.) |
| 1870 | 0.3 |
| 1890 | 1.5 |
| 1910 | 0.2 |
| 1930 | 2.8 |
| 1950 | 0.7 |
| 1970 | 1.1 |
| 1990 | 1.5 |`,
    hints: [t`The seven 20-year periods cover 1870 to 2010 exactly. The net change is the sum of the changes.`],
    a: t`About $8.1$ inches.`,
    steps: [
      ["Check the periods", t`$1870+7\cdot20=2010$, so the table covers the whole span with no gaps.`],
      ["Add the changes", t`$$0.3+1.5+0.2+2.8+0.7+1.1+1.5=8.1\ \text{in.}$$`],
    ],
    check: { kind: "value", expr: "0.3 + 1.5 + 0.2 + 2.8 + 0.7 + 1.1 + 1.5", value: "8.1" },
  },
  {
    n: 40, d: "F", c: ["sum-applications"],
    q: t`The table gives the approximate increase, in dollars, in the average price of a gallon of gas over each decade starting in the given year. The average price in 2010 was \$2.60. What was the average price in 1950?
| Starting year | 10-year change (\$) |
| 1950 | 0.03 |
| 1960 | 0.05 |
| 1970 | 0.86 |
| 1980 | −0.03 |
| 1990 | 0.29 |
| 2000 | 1.12 |`,
    hints: [t`Price in 2010 = price in 1950 + (sum of the six decade changes). Solve for the 1950 price.`],
    a: t`About \$0.28 per gallon.`,
    steps: [
      ["Total change 1950 to 2010", t`$$0.03+0.05+0.86-0.03+0.29+1.12=2.32$$`],
      ["Work backward", t`$2.60-2.32=0.28$, so the price in 1950 was about \$0.28.`],
    ],
    check: { kind: "value", expr: "2.60 - (0.03 + 0.05 + 0.86 - 0.03 + 0.29 + 1.12)", value: "0.28" },
  },
  {
    n: 50, d: "F", c: ["endpoint-sums", "over-under"],
    q: t`For $y=3x+2$ on $[3,5]$, compute the endpoint sums $L_1$ and $R_1$ (one rectangle each). Then find the exact area under the graph using geometry, and compare. (Adapted from Exercise 50.)`,
    hints: [
      t`With one rectangle, the width is $5-3=2$. $L_1$ uses the height $f(3)$ and $R_1$ uses $f(5)$.`,
      t`The region under a line is a trapezoid: area $=\text{width}\times\frac{\text{left height}+\text{right height}}{2}$.`,
    ],
    a: t`$L_1=22$, $R_1=34$, and the exact area is $28$. $L_1$ underestimates and $R_1$ overestimates because $f$ is increasing. Their average equals the exact area here.`,
    steps: [
      ["Heights", t`$f(3)=11$ and $f(5)=17$.`],
      ["Endpoint sums", t`$L_1=2\cdot11=22$ and $R_1=2\cdot17=34$.`],
      ["Exact area (trapezoid)", t`$$2\cdot\frac{11+17}{2}=28$$`],
      ["Compare", t`$f$ is increasing, so $L_1<28<R_1$. For a linear function, $\frac{L_1+R_1}{2}=28$ exactly.`],
    ],
    check: [
      { kind: "value", expr: "2*(3*3 + 2)", value: "22" },
      { kind: "value", expr: "2*(3*5 + 2)", value: "34" },
      { kind: "definite", f: "3*x + 2", a: "3", b: "5", value: "28" },
    ],
  },

  // ---------- Core ----------
  {
    n: 8, d: "C", c: ["sum-properties"],
    q: t`Use summation properties and formulas to rewrite and evaluate the sum.
$$\sum_{k=1}^{20}100\left(k^2-5k+1\right)$$`,
    hints: [
      t`Factor out 100 and split into three sums: $\sum k^2$, $\sum k$ and $\sum 1$.`,
      t`$\sum_{k=1}^{n}1=n$, $\sum_{k=1}^{n}k=\frac{n(n+1)}{2}$, $\sum_{k=1}^{n}k^2=\frac{n(n+1)(2n+1)}{6}$.`,
    ],
    a: t`$184{,}000$`,
    steps: [
      ["Split the sum", t`$$100\left(\sum_{k=1}^{20}k^2-5\sum_{k=1}^{20}k+\sum_{k=1}^{20}1\right)$$`],
      ["Use the formulas", t`$\sum k^2=\frac{20\cdot21\cdot41}{6}=2870$, $\sum k=\frac{20\cdot21}{2}=210$, $\sum1=20$.`],
      ["Combine", t`$100(2870-5\cdot210+20)=100(1840)=184{,}000$`],
    ],
    check: { kind: "value", expr: "Sum(100*(i**2 - 5*i + 1), (i, 1, 20))", value: "184000" },
  },
  {
    n: 9, d: "C", c: ["sum-properties"],
    q: t`Use summation properties and formulas to rewrite and evaluate the sum.
$$\sum_{j=1}^{50}\left(j^2-2j\right)$$`,
    hints: [t`Split into $\sum j^2-2\sum j$ and use the formulas with $n=50$.`],
    a: t`$40{,}375$`,
    steps: [
      ["Split", t`$$\sum_{j=1}^{50}j^2-2\sum_{j=1}^{50}j$$`],
      ["Formulas", t`$\sum j^2=\frac{50\cdot51\cdot101}{6}=42{,}925$ and $\sum j=\frac{50\cdot51}{2}=1275$.`],
      ["Combine", t`$42{,}925-2(1275)=40{,}375$`],
    ],
    check: { kind: "value", expr: "Sum(j**2 - 2*j, (j, 1, 50))", value: "40375" },
  },
  {
    n: 12, d: "C", c: ["endpoint-sums"],
    q: t`Compute the left-endpoint sum $L_4$ for the function on the given interval.
$$f(x)=\frac{1}{x-1}\ \text{ on } [2,3]$$`,
    hints: [
      t`$\Delta x=\frac{3-2}{4}=\frac14$. The left endpoints are $2,\ 2.25,\ 2.5,\ 2.75$.`,
      t`$L_4=\Delta x\,[f(2)+f(2.25)+f(2.5)+f(2.75)]$.`,
    ],
    a: t`$L_4=\dfrac{319}{420}\approx0.76$`,
    steps: [
      ["Width and endpoints", t`$\Delta x=\frac14$; left endpoints $2,\ \frac94,\ \frac52,\ \frac{11}{4}$.`],
      ["Heights", t`$f(2)=1,\ f\left(\frac94\right)=\frac45,\ f\left(\frac52\right)=\frac23,\ f\left(\frac{11}4\right)=\frac47$`],
      ["Add and multiply by the width", t`$$L_4=\frac14\left(1+\frac45+\frac23+\frac47\right)=\frac14\cdot\frac{319}{105}=\frac{319}{420}\approx0.7595$$`],
    ],
    check: { kind: "value", expr: "Sum(1/(2 + (i - 1)/4 - 1), (i, 1, 4))/4", value: "319/420" },
  },
  {
    n: 13, d: "C", c: ["endpoint-sums"],
    q: t`Compute the right-endpoint sum $R_4$ for the function on the given interval.
$$g(x)=\cos(\pi x)\ \text{ on } [0,1]$$`,
    hints: [t`$\Delta x=\frac14$, and the right endpoints are $\frac14,\ \frac12,\ \frac34,\ 1$.`],
    a: t`$R_4=-\dfrac14$`,
    steps: [
      ["Heights at the right endpoints", t`$\cos\frac{\pi}{4}=\frac{\sqrt2}{2},\ \cos\frac{\pi}{2}=0,\ \cos\frac{3\pi}{4}=-\frac{\sqrt2}{2},\ \cos\pi=-1$`],
      ["Add", t`The $\pm\frac{\sqrt2}{2}$ terms cancel, leaving $-1$.`],
      ["Multiply by the width", t`$R_4=\frac14(-1)=-\frac14$. A negative sum means more of the rectangles' area is below the axis.`],
    ],
    check: { kind: "value", expr: "Sum(cos(pi*i/4), (i, 1, 4))/4", value: "-1/4" },
  },
  {
    n: 18, d: "C", c: ["endpoint-sums"],
    q: t`Compute the right-endpoint sum $R_8$ for the function on the given interval.
$$f(x)=x^2-2x+1\ \text{ on } [0,2]$$`,
    hints: [
      t`Notice $x^2-2x+1=(x-1)^2$.`,
      t`$\Delta x=\frac{2}{8}=\frac14$; the right endpoints are $\frac14,\frac24,\dots,\frac84$.`,
    ],
    a: t`$R_8=\dfrac{11}{16}=0.6875$`,
    steps: [
      ["Simplify f", t`$f(x)=(x-1)^2$ and $\Delta x=\frac14$.`],
      ["Heights", t`At $x=\frac14,\frac12,\frac34,1,\frac54,\frac32,\frac74,2$: $\ \frac{9}{16},\frac{4}{16},\frac1{16},0,\frac1{16},\frac4{16},\frac9{16},\frac{16}{16}$`],
      ["Add and multiply", t`Sum $=\frac{44}{16}=2.75$, so $R_8=\frac14(2.75)=\frac{11}{16}=0.6875$.`],
    ],
    check: { kind: "value", expr: "Sum((i/4 - 1)**2, (i, 1, 8))/4", value: "11/16" },
  },
  {
    n: 20, d: "C", c: ["endpoint-sums", "over-under"],
    q: t`Compute the left and right Riemann sums $L_4$ and $R_4$ for the function on $[-2,2]$. Compute their average and compare it with the area under the graph.
$$f(x)=2-|x|$$`,
    figure: {
      xMin: -2.5, xMax: 2.5, yMin: -0.5, yMax: 2.5,
      curves: [{ points: [[-2, 0], [0, 2], [2, 0]] }],
      xTicks: [-2, -1, 0, 1, 2], yTicks: [1, 2],
      alt: "Graph of f(x) = 2 minus the absolute value of x on [−2, 2]: a tent shape rising in a straight line from (−2, 0) to (0, 2), then falling to (2, 0).",
    },
    hints: [
      t`$\Delta x=1$. Left endpoints: $-2,-1,0,1$. Right endpoints: $-1,0,1,2$.`,
      t`The region under the graph is a triangle with base 4 and height 2.`,
    ],
    a: t`$L_4=4$, $R_4=4$, average $=4$, which equals the area of the triangle, $\frac12\cdot4\cdot2=4$.`,
    steps: [
      ["Left sum", t`$L_4=1\cdot[f(-2)+f(-1)+f(0)+f(1)]=0+1+2+1=4$`],
      ["Right sum", t`$R_4=1\cdot[f(-1)+f(0)+f(1)+f(2)]=1+2+1+0=4$`],
      ["Compare with the area", t`Average $=4$. The triangle has area $\frac12(4)(2)=4$, so they agree. (Over- and underestimates cancel by symmetry.)`],
    ],
    check: [
      { kind: "value", expr: "Sum(2 - Abs(-2 + (i - 1)), (i, 1, 4))", value: "4" },
      { kind: "value", expr: "Sum(2 - Abs(-2 + i), (i, 1, 4))", value: "4" },
      { kind: "definite", f: "2 - Abs(x)", a: "-2", b: "2", value: "4" },
    ],
  },
  {
    n: 24, d: "C", c: ["sigma-notation", "endpoint-sums"],
    q: t`Express the left-endpoint sum $L_{30}$ for $f(x)=x^2$ on $[1,2]$ in sigma notation. Do not evaluate it.`,
    hints: [
      t`$\Delta x=\frac{2-1}{30}=\frac{1}{30}$.`,
      t`The $i$th left endpoint is $x_{i-1}=1+(i-1)\Delta x$ for $i=1,\dots,30$.`,
    ],
    a: t`$$L_{30}=\sum_{i=1}^{30}\frac{1}{30}\left(1+\frac{i-1}{30}\right)^2$$ (equivalently $\sum_{i=0}^{29}\frac{1}{30}\left(1+\frac{i}{30}\right)^2$).`,
    steps: [
      ["Width", t`$\Delta x=\frac{1}{30}$`],
      ["Left endpoints", t`$x_{i-1}=1+\frac{i-1}{30}$, so the heights are $\left(1+\frac{i-1}{30}\right)^2$.`],
      ["Write the sum", t`$$L_{30}=\sum_{i=1}^{30}\frac{1}{30}\left(1+\frac{i-1}{30}\right)^2$$`],
    ],
    check: { kind: "value", expr: "Sum((1 + (i - 1)/30)**2/30, (i, 1, 30))", value: "Sum((1 + j/30)**2/30, (j, 0, 29))" },
  },
  {
    n: 37, d: "C", c: ["sum-applications", "sum-properties"],
    q: t`To get in shape, Joe gets new running shoes. He runs 1 mi each day in week 1 and adds $\frac{1}{10}$ mi to his daily run each week. What is the total mileage on Joe's shoes after 25 weeks?`,
    hints: [
      t`In week $k$ he runs $1+\frac{k-1}{10}$ mi per day, for 7 days.`,
      t`Total $=\sum_{k=1}^{25}7\left(1+\frac{k-1}{10}\right)$.`,
    ],
    a: t`$385$ miles.`,
    steps: [
      ["Set up the sum", t`$$\sum_{k=1}^{25}7\left(1+\frac{k-1}{10}\right)=7\left(25+\frac{1}{10}\sum_{k=1}^{25}(k-1)\right)$$`],
      ["Evaluate the inner sum", t`$\sum_{k=1}^{25}(k-1)=0+1+\cdots+24=\frac{24\cdot25}{2}=300$`],
      ["Finish", t`$7\left(25+\frac{300}{10}\right)=7(55)=385$ miles.`],
    ],
    check: { kind: "value", expr: "Sum(7*(1 + (i - 1)/10), (i, 1, 25))", value: "385" },
  },
  {
    n: 43, d: "C", c: ["riemann-from-graph", "endpoint-sums"],
    q: t`Estimate the area under the curve on $[0,8]$ by computing the left Riemann sum $L_8$. The graph passes through the marked points.`,
    figure: {
      xMin: -0.5, xMax: 8.5, yMin: -0.5, yMax: 6,
      curves: [{ points: [[0, 3], [1, 2], [2, 1], [3, 2], [4, 3], [5, 4], [6, 5], [7, 4], [8, 3]] }],
      dots: [[0, 3], [1, 2], [2, 1], [3, 2], [4, 3], [5, 4], [6, 5], [7, 4], [8, 3]],
      xTicks: [0, 1, 2, 3, 4, 5, 6, 7, 8], yTicks: [1, 2, 3, 4, 5],
      alt: "A curve through the points (0, 3), (1, 2), (2, 1), (3, 2), (4, 3), (5, 4), (6, 5), (7, 4) and (8, 3).",
    },
    hints: [t`$\Delta x=1$. Use the heights at the left endpoints $x=0,1,\dots,7$.`],
    a: t`$L_8=24$`,
    steps: [
      ["Read the heights", t`$f(0),\dots,f(7)=3,2,1,2,3,4,5,4$`],
      ["Add and multiply by the width", t`$L_8=1\cdot(3+2+1+2+3+4+5+4)=24$`],
    ],
    check: { kind: "value", expr: "3 + 2 + 1 + 2 + 3 + 4 + 5 + 4", value: "24" },
  },

  // ---------- Challenge ----------
  {
    n: 10, d: "Ch", c: ["sum-properties"],
    q: t`Use summation properties and formulas to rewrite and evaluate the sum.
$$\sum_{j=11}^{20}\left(j^2-10j\right)$$`,
    hints: [
      t`The formulas start at 1. Write $\sum_{j=11}^{20}=\sum_{j=1}^{20}-\sum_{j=1}^{10}$.`,
    ],
    a: t`$935$`,
    steps: [
      ["Squares from 11 to 20", t`$\sum_{j=1}^{20}j^2-\sum_{j=1}^{10}j^2=2870-385=2485$`],
      ["Integers from 11 to 20", t`$\sum_{j=1}^{20}j-\sum_{j=1}^{10}j=210-55=155$`],
      ["Combine", t`$2485-10(155)=2485-1550=935$`],
    ],
    check: { kind: "value", expr: "Sum(j**2 - 10*j, (j, 11, 20))", value: "935" },
  },
  {
    n: 22, d: "Ch", c: ["endpoint-sums", "over-under"],
    q: t`Compute the left and right Riemann sums $L_4$ and $R_4$ for the function on $[-2,2]$ and compare their values with the area under the graph.
$$f(x)=\sqrt{4-x^2}$$`,
    hints: [
      t`$\Delta x=1$. Left endpoints: $-2,-1,0,1$; right endpoints: $-1,0,1,2$.`,
      t`The graph is the upper half of the circle $x^2+y^2=4$, so the exact area is half of $\pi\cdot2^2$.`,
    ],
    a: t`$L_4=R_4=2+2\sqrt3\approx5.46$. Both underestimate the exact area $2\pi\approx6.28$.`,
    steps: [
      ["Heights", t`$f(-2)=0,\ f(-1)=\sqrt3,\ f(0)=2,\ f(1)=\sqrt3,\ f(2)=0$`],
      ["Left sum", t`$L_4=0+\sqrt3+2+\sqrt3=2+2\sqrt3\approx5.46$`],
      ["Right sum", t`$R_4=\sqrt3+2+\sqrt3+0=2+2\sqrt3$, the same by symmetry.`],
      ["Compare", t`The exact area is a half-disk: $\frac12\pi(2)^2=2\pi\approx6.28$. Each rectangle sits under the curve on one side, so both sums underestimate.`],
    ],
    check: [
      { kind: "value", expr: "Sum(sqrt(4 - (-2 + (i - 1))**2), (i, 1, 4))", value: "2 + 2*sqrt(3)" },
      { kind: "value", expr: "Sum(sqrt(4 - (-2 + i)**2), (i, 1, 4))", value: "2 + 2*sqrt(3)" },
      { kind: "definite", f: "sqrt(4 - x**2)", a: "-2", b: "2", value: "2*pi" },
    ],
  },
  {
    n: 53, d: "Ch", c: ["over-under"],
    q: t`Explain why, if $f(a)\ge0$ and $f$ is increasing on $[a,b]$, the left-endpoint estimate is a lower bound for the area below the graph of $f$ on $[a,b]$.`,
    hints: [t`On one subinterval $[x_{i-1},x_i]$, compare $f(x_{i-1})$ with $f(x)$ for every $x$ in that subinterval.`],
    a: t`On each subinterval the left endpoint gives the smallest value of $f$ (because $f$ is increasing), so each left rectangle fits under the curve. Since $f\ge f(a)\ge0$, the rectangles are above the axis, and their total area $L_n$ is at most the area under the curve.`,
    steps: [
      ["One subinterval", t`For $x$ in $[x_{i-1},x_i]$, increasing means $f(x_{i-1})\le f(x)$.`],
      ["Rectangles fit underneath", t`So the rectangle of height $f(x_{i-1})$ lies under the graph on that piece. It is nonnegative because $f(x_{i-1})\ge f(a)\ge0$.`],
      ["Add them up", t`Summing over all subintervals: $L_n\le$ (area under the curve).`],
    ],
    check: { kind: "manual", note: "Conceptual: monotonicity argument." },
  },
  {
    n: 55, d: "Ch", c: ["endpoint-sums"],
    q: t`Show that, in general,
$$R_N-L_N=(b-a)\cdot\frac{f(b)-f(a)}{N}.$$`,
    hints: [
      t`Write both sums with the same $\Delta x=\frac{b-a}{N}$ and subtract term by term.`,
      t`The difference is a telescoping sum: most terms cancel.`,
    ],
    a: t`$R_N-L_N=\Delta x\sum_{i=1}^{N}\left[f(x_i)-f(x_{i-1})\right]=\Delta x\left[f(x_N)-f(x_0)\right]=\frac{b-a}{N}\left[f(b)-f(a)\right]$.`,
    steps: [
      ["Write both sums", t`$R_N=\Delta x\sum_{i=1}^{N}f(x_i)$ and $L_N=\Delta x\sum_{i=1}^{N}f(x_{i-1})$, with $\Delta x=\frac{b-a}{N}$.`],
      ["Subtract", t`$$R_N-L_N=\Delta x\sum_{i=1}^{N}\left[f(x_i)-f(x_{i-1})\right]$$`],
      ["Telescope", t`Every middle term cancels, leaving $f(x_N)-f(x_0)=f(b)-f(a)$.`],
      ["Conclude", t`$R_N-L_N=\frac{b-a}{N}\left[f(b)-f(a)\right]$. Example: $f(x)=x^2$ on $[0,2]$ with $N=4$ gives $3.75-1.75=2=\frac{2(4-0)}{4}$.`],
    ],
    check: { kind: "value", expr: "Sum((i/2)**2/2, (i, 1, 4)) - Sum(((i - 1)/2)**2/2, (i, 1, 4))", value: "2*(4 - 0)/4" },
  },
]);
