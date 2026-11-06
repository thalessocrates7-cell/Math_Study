"""Verify every problem's answer with SymPy.

Usage: python -I dev/verify_content.py dev/checks.json
Exit code 0 only if every non-manual check passes.

Each check compares two expressions numerically at many sample points (and symbolically when that is
cheap), so equivalent forms (e.g. -cos(x)**2/2 vs sin(x)**2/2 + C) are handled by allowing a constant
offset only where the math allows it (antiderivatives).
"""
import json
import math
import sys

from sympy import (Abs, E, Integral, N, Rational, Symbol, acos, asec, asin, atan, cos, cot, csc,
                   diff, exp, integrate, log, oo, pi, sec, simplify, sin, sqrt, symbols, tan)
from sympy.parsing.sympy_parser import parse_expr, standard_transformations

TRANSFORMS = standard_transformations

NAMES = {
    "x": Symbol("x", real=True), "t": Symbol("t", real=True), "u": Symbol("u", real=True),
    "y": Symbol("y", real=True), "s": Symbol("s", real=True), "theta": Symbol("theta", real=True),
    "a": Symbol("a", positive=True), "b": Symbol("b", positive=True), "k": Symbol("k", positive=True),
    "s0": Symbol("s0", positive=True), "R": Symbol("R", positive=True), "A": Symbol("A", positive=True),
    "i": Symbol("i", integer=True, positive=True), "j": Symbol("j", integer=True, positive=True),
    "n": Symbol("n", integer=True, positive=True),
    "Abs": Abs, "E": E, "Integral": Integral, "Rational": Rational, "acos": acos, "asec": asec,
    "asin": asin, "atan": atan, "cos": cos, "cot": cot, "csc": csc, "diff": diff, "exp": exp,
    "integrate": integrate, "log": log, "oo": oo, "pi": pi, "sec": sec, "sin": sin, "sqrt": sqrt,
    "tan": tan,
}
from sympy import Sum, limit  # noqa: E402  (kept separate so the NAMES table stays readable)
NAMES["Sum"] = Sum
NAMES["limit"] = limit

SAMPLES = [0.05, 0.12, 0.2, 0.37, 0.71, 0.9, 1.13, 1.57, 1.91, 2.63, 3.3, 4.4, 5.5, 7.2,
           -0.08, -0.17, -0.43, -0.66, -1.27, -2.2, -3.6, -5.1]
TOL = 1e-9


def P(src):
    return parse_expr(src, local_dict=dict(NAMES), transformations=TRANSFORMS)


def num(e):
    v = complex(N(e, 30))
    return v


def real_value(e):
    try:
        v = num(e)
    except Exception:
        return None
    if not (math.isfinite(v.real) and math.isfinite(v.imag)):
        return None
    if abs(v.imag) > 1e-12 * max(1.0, abs(v.real)):
        return None
    return v.real


def close(a, b):
    return abs(a - b) <= TOL * max(1.0, abs(a), abs(b))


def free_syms(*exprs):
    out = set()
    for e in exprs:
        out |= e.free_symbols
    return sorted(out, key=lambda s: s.name)


def same_function(e1, e2, var, allow_constant=False):
    """e1 == e2 as functions of var (other free symbols get fixed positive sample values)."""
    others = [s for s in free_syms(e1, e2) if s != var]
    fixes = {s: Rational(7, 5) + Rational(k, 3) for k, s in enumerate(others)}
    e1, e2 = e1.subs(fixes), e2.subs(fixes)
    offset = None
    valid = 0
    for p in SAMPLES:
        v1 = real_value(e1.subs(var, p))
        v2 = real_value(e2.subs(var, p))
        if v1 is None or v2 is None:
            continue
        d = v1 - v2
        if allow_constant:
            if offset is None:
                offset = d
            elif not close(d, offset):
                return False, f"differ by a non-constant amount near {var}={p}"
        elif not close(v1, v2):
            return False, f"{var}={p}: {v1!r} vs {v2!r}"
        valid += 1
    if valid < 3:
        return False, f"only {valid} valid sample points"
    return True, "ok"


def same_value(e1, e2):
    syms = free_syms(e1, e2)
    if syms:
        # compare as functions of the first symbol, others fixed
        return same_function(e1, e2, syms[0])
    v1, v2 = real_value(e1), real_value(e2)
    if v1 is None or v2 is None:
        return False, f"could not evaluate: {e1} / {e2}"
    return (close(v1, v2), "ok" if close(v1, v2) else f"{v1!r} vs {v2!r}")


def definite_value(f, var, a, b):
    """Exact value when SymPy can integrate in closed form; otherwise a 30-digit numeric value."""
    try:
        exact = integrate(f, (var, a, b))
        if not exact.has(Integral) and real_value(exact) is not None:
            return exact
    except Exception:
        pass
    return Integral(f, (var, a, b)).evalf(30)


def run_check(c):
    kind = c["kind"]
    if kind == "manual":
        return True, "manual: " + c["note"]
    var = NAMES[c.get("var", "x")]
    if kind == "antiderivative":
        f, F = P(c["f"]), P(c["F"])
        return same_function(diff(F, var), f, var)
    if kind == "definite":
        f, a, b, value = P(c["f"]), P(c["a"]), P(c["b"]), P(c["value"])
        return same_value(definite_value(f, var, a, b), value)
    if kind == "value":
        return same_value(P(c["expr"]), P(c["value"]))
    if kind == "ivp":
        order = int(c.get("order", 1))
        df, F = P(c["df"]), P(c["F"])
        ok, msg = same_function(diff(F, var, order), df, var)
        if not ok:
            return ok, "derivative: " + msg
        return same_value(F.subs(var, P(c["x0"])), P(c["y0"]))
    if kind == "derivative":
        expr, value = P(c["expr"]), P(c["value"])
        d = diff(expr, var).doit()
        return same_function(d, value, var)
    return False, f"unknown check kind {kind}"


def main(path):
    sys.stdout.reconfigure(encoding="utf-8")
    data = json.load(open(path, encoding="utf-8"))
    failures, manual, passed = [], 0, 0
    for item in data:
        for c in item["checks"]:
            try:
                ok, msg = run_check(c)
            except Exception as exc:  # parsing or evaluation error is a failure
                ok, msg = False, f"error: {exc!r}"
            if c["kind"] == "manual":
                manual += 1
            elif ok:
                passed += 1
            else:
                failures.append((item["id"], c, msg))
    for pid, c, msg in failures:
        print(f"FAIL {pid}: {c['kind']} -> {msg}\n     {json.dumps(c)}")
    print(f"\n{passed} checks passed, {len(failures)} failed, {manual} manual (conceptual) across {len(data)} problems")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1]))
