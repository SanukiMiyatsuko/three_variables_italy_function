import { headname } from "./App";

export type ZT = { readonly type: "zero" };
export type AT = { readonly type: "plus", readonly add: PT[] };
export type PT = { readonly type: "psi", readonly arr: T[] };
export type T = ZT | AT | PT;

export const Z: ZT = { type: "zero" };
export const ONE: PT = { type: "psi", arr: [Z, Z, Z] };
export const OMEGA: PT = { type: "psi", arr: [Z, Z, ONE] };
export const LOMEGA: PT = { type: "psi", arr: [Z, ONE, Z] };
export const IOTA: PT = { type: "psi", arr: [ONE, Z, Z] };

// オブジェクトの相等判定
export function equal(s: T, t: T): boolean {
    if (s.type === "zero") {
        return t.type === "zero";
    } else if (s.type === "plus") {
        if (t.type !== "plus") return false;
        if (t.add.length !== s.add.length) return false;
        for (let i = 0; i < t.add.length; i++) {
            if (!equal(s.add[i], t.add[i])) return false;
        }
        return true;
    } else {
        if (t.type !== "psi") return false;
        for (let k = 0; k < t.arr.length; k++) {
            if (!equal(s.arr[k], t.arr[k])) return false;
        }
        return true;
    }
}

export function psi(arr: T[]): PT {
    return { type: "psi", arr: arr };
}

// a+b を適切に整形して返す
function plus(a: T, b: T): T {
    if (a.type === "zero") {
        return b;
    } else if (a.type === "plus") {
        if (b.type === "zero") {
            return a;
        } else if (b.type === "plus") {
            return { type: "plus", add: a.add.concat(b.add) };
        } else {
            return { type: "plus", add: [...a.add, b] };
        }
    } else {
        if (b.type === "zero") {
            return a;
        } else if (b.type === "plus") {
            return { type: "plus", add: [a, ...b.add] };
        } else {
            return { type: "plus", add: [a, b] };
        }
    }
}

// 要素が1個の配列は潰してから返す
export function sanitize_plus_term(add: PT[]): PT | AT {
    if (add.length === 1) {
        return add[0];
    } else {
        return { type: "plus", add: add };
    }
}

// s < t を判定
export function less_than(s: T, t: T): boolean {
    if (s.type === "zero") {
        return t.type !== "zero";
    } else if (s.type === "psi") {
        if (t.type === "zero") {
            return false;
        } else if (t.type === "psi") {
            for (let k = 0; k < t.arr.length; k++) {
                if (!equal(s.arr[k], t.arr[k])) return less_than(s.arr[k], t.arr[k]);
            }
            return false;
        } else {
            return equal(s, t.add[0]) || less_than(s, t.add[0]);
        }
    } else {
        if (t.type === "zero") {
            return false;
        } else if (t.type === "plus") {
            const s2 = sanitize_plus_term(s.add.slice(1));
            const t2 = sanitize_plus_term(t.add.slice(1));
            return less_than(s.add[0], t.add[0]) ||
                (equal(s.add[0], t.add[0]) && less_than(s2, t2));
        } else {
            return less_than(s.add[0], t);
        }
    }
}

// dom(t)
export function dom(s: T): ZT | PT {
    if (s.type === "zero") {
        return Z;
    } else if (s.type === "plus") {
        return dom(s.add[s.add.length - 1]);
    } else {
        const c = s.arr[2];
        const domc = dom(c);
        if (domc.type === "zero") {
            const b = s.arr[1];
            const domb = dom(b);
            if (domb.type === "zero") {
                const doma = dom(s.arr[0]);
                if (doma.type === "zero" || equal(doma, ONE)) {
                    return s;
                } else {
                    return doma;
                }
            } else if (equal(domb, ONE)) {
                return s;
            } else if (equal(domb, OMEGA)) {
                return OMEGA;
            } else {
                if (domb.arr[2].type !== "zero") {
                    return domb;
                } else {
                    const e = domb.arr[1];
                    const dome = dom(e);
                    if (dome.type === "zero") {
                        return s;
                    } else if (equal(dome, ONE)) {
                        return domb;
                    } else {
                        if (less_than(b, e)) {
                            return OMEGA;
                        } else {
                            return domb;
                        }
                    }
                }
            }
        } else if (equal(domc, ONE)) {
            return OMEGA;
        } else if (equal(domc, OMEGA)) {
            return OMEGA;
        } else {
            const f = domc.arr[2];
            if (dom(f).type === "zero") {
                const dome = dom(domc.arr[1]);
                if (equal(dome, ONE)) {
                    return s;
                } else {
                    return OMEGA;
                }
            } else {
                if (less_than(c, f)) {
                    return OMEGA;
                } else {
                    return domc;
                }
            }
        }
    }
}

// find(s, t)
function find(n: number, s: T, t: T): T {
    if (s.type === "zero") {
        return Z;
    } else if (s.type === "plus") {
        const b = s.add[0].arr[n];
        const remnant = sanitize_plus_term(s.add.slice(1));
        if (equal(b, t)) return s;
        return find(n, remnant, t);
    } else {
        return s;
    }
}

// replace(s, t)
function replace(n: number, s: T, t: T): T {
    if (s.type === "zero") {
        return Z;
    } else if (s.type === "plus") {
        const a = s.add[0];
        const remnant = sanitize_plus_term(s.add.slice(1));
        return plus(replace(n, a, t), replace(n, remnant, t));
    } else {
        let sarr = [...s.arr];
        sarr[n] = t;
        return psi(sarr);
    }
}

// x[y]
export function fund(s: T, t: T): T {
    if (s.type === "zero") {
        return Z;
    } else if (s.type === "plus") {
        const lastfund = fund(s.add[s.add.length - 1], t);
        const remains = sanitize_plus_term(s.add.slice(0, s.add.length - 1));
        return plus(remains, lastfund);
    } else {
        const a = s.arr[0];
        const b = s.arr[1];
        const c = s.arr[2];
        const domc = dom(c);
        if (domc.type === "zero") {
            const domb = dom(b);
            if (domb.type === "zero") {
                const doma = dom(a);
                if (doma.type === "zero" || equal(doma, ONE)) {
                    return t;
                } else {
                    return psi([fund(a, t), b, c]);
                }
            } else if (equal(domb, ONE)) {
                return t;
            } else if (equal(domb, OMEGA)) {
                return psi([a, fund(b, t), c]);
            } else {
                const f = domb.arr[2];
                if (dom(f).type !== "zero") {
                    return psi([a, fund(b, t), c]);
                } else {
                    const e = domb.arr[1];
                    const dome = dom(e);
                    if (dome.type === "zero" || equal(dome, ONE)) {
                        return psi([a, fund(b, t), c]);
                    } else {
                        if (less_than(e, b) || equal(e, b)) {
                            return psi([a, fund(b, t), c]);
                        } else {
                            const g = dome.arr[0];
                            if (b.type === "plus") {
                                const i = b.add[b.add.length - 1].arr[0];
                                if (less_than(t, OMEGA) && equal(dom(t), ONE)) {
                                    const p = fund(s, fund(t, Z));
                                    if (p.type !== "psi") throw Error("pがPTの元ではない");
                                    const Gamma = p.arr[1];
                                    return psi([a, fund(b, replace(0, find(0, Gamma, i), fund(g, Z))), c]);
                                } else {
                                    return psi([a, fund(b, Z), c]);
                                }
                            } else {
                                if (less_than(t, OMEGA) && equal(dom(t), ONE)) {
                                    const p = fund(s, fund(t, Z));
                                    if (p.type !== "psi") throw Error("pがPTの元ではない");
                                    const Gamma = p.arr[1];
                                    return psi([a, fund(b, replace(0, Gamma, fund(g, Z))), c]);
                                } else {
                                    return psi([a, fund(b, Z), c]);
                                }
                            }
                        }
                    }
                }
            }
        } else if (equal(domc, ONE)) {
            if (less_than(t, OMEGA) && equal(dom(t), ONE)) {
                return plus(fund(s, fund(t, Z)), psi([a, b, fund(c, Z)]));
            } else {
                return Z;
            }
        } else if (equal(domc, OMEGA)) {
            return psi([a, b, fund(c, t)]);
        } else {
            const f = domc.arr[2];
            const domf = dom(f);
            if (domf.type === "zero") {
                const e = domc.arr[1];
                const dome = dom(e);
                if (dome.type === "zero") {
                    const d = domc.arr[0];
                    if (less_than(t, OMEGA) && equal(dom(t), ONE)) {
                        const p = fund(s, fund(t, Z));
                        if (p.type !== "psi") throw Error("pがPTの元ではないです");
                        const Gamma = p.arr[2];
                        return psi([a, b, fund(c, psi([fund(d, Z), Gamma, Z]))]);
                    } else {
                        return psi([a, b, fund(c, psi([fund(d, Z), Z, Z]))]);
                    }
                } else if (equal(dome, ONE)) {
                    return psi([a, b, fund(c, t)]);
                } else {
                    const g = dome.arr[0];
                    if (less_than(t, OMEGA) && equal(dom(t), ONE)) {
                        const p = fund(s, fund(t, Z));
                        if (p.type !== "psi") throw Error("pがPTの元ではないです");
                        const Gamma = p.arr[2];
                        return psi([a, b, fund(c, psi([fund(g, Z), Gamma, Z]))]);
                    } else {
                        return psi([a, b, fund(c, psi([fund(g, Z), Z, Z]))]);
                    }
                }
            } else {
                if (less_than(f, c) || equal(f, c)) {
                    return psi([a, b, fund(c, t)]);
                } else {
                    const h = domf.arr[1];
                    if (b.type === "plus") {
                        const k = b.add[b.add.length - 1].arr[1];
                        if (less_than(t, OMEGA) && equal(dom(t), ONE)) {
                            const p = fund(s, fund(t, Z));
                            if (p.type !== "psi") throw Error("pがPTの元ではないです");
                            const Gamma = p.arr[2];
                            return psi([a, b, fund(c, replace(1, find(1, Gamma, k), fund(h, Z)))]);
                        } else {
                            return psi([a, b, fund(c, Z)]);
                        }
                    } else {
                        if (less_than(t, OMEGA) && equal(dom(t), ONE)) {
                            const p = fund(s, fund(t, Z));
                            if (p.type !== "psi") throw Error("pがPTの元ではないです");
                            const Gamma = p.arr[2];
                            return psi([a, b, fund(c, replace(1, Gamma, fund(h, Z)))]);
                        } else {
                            return psi([a, b, fund(c, Z)]);
                        }
                    }
                }
            }
        }
    }
}

// ===========================================
// オブジェクトから文字列へ
export function term_to_string(t: T, boolArr: boolean[]): string {
    if (t.type === "zero") {
        return "0";
    } else if (t.type === "psi") {
        if (boolArr[5] && t.arr[0].type === "zero") {
            if (!(boolArr[7] && t.arr[1].type === "zero")) {
                if (boolArr[6]) {
                    if (boolArr[4] || boolArr[8])
                        return headname + "_{" + term_to_string(t.arr[1], boolArr) + "}(" + term_to_string(t.arr[2], boolArr) + ")";
                    if (t.arr[1].type === "zero") {
                        return headname + "_0(" + term_to_string(t.arr[2], boolArr) + ")";
                    } else if (t.arr[1].type === "plus") {
                        if (t.arr[1].add.every((x) => equal(x, ONE)))
                            return headname + "_" + term_to_string(t.arr[1], boolArr) + "(" + term_to_string(t.arr[2], boolArr) + ")";
                        return headname + "_{" + term_to_string(t.arr[1], boolArr) + "}(" + term_to_string(t.arr[2], boolArr) + ")";
                    } else {
                        if (equal(t.arr[1], ONE) || (boolArr[0] && equal(t.arr[1], OMEGA)) || (boolArr[1] && equal(t.arr[1], LOMEGA)) || (boolArr[2] && equal(t.arr[1], IOTA)))
                            return headname + "_" + term_to_string(t.arr[1], boolArr) + "(" + term_to_string(t.arr[2], boolArr) + ")";
                        return headname + "_{" + term_to_string(t.arr[1], boolArr) + "}(" + term_to_string(t.arr[2], boolArr) + ")";
                    }
                }
                return headname + "(" + term_to_string(t.arr[1], boolArr) + "," + term_to_string(t.arr[2], boolArr) + ")";
            }
            return headname + "(" + term_to_string(t.arr[2], boolArr) + ")";
        }
        if (boolArr[3]) {
            if (boolArr[4] || boolArr[8])
                return headname + "_{" + term_to_string(t.arr[0], boolArr) + "}(" + term_to_string(t.arr[1], boolArr) + "," + term_to_string(t.arr[2], boolArr) + ")";
            if (t.arr[0].type === "zero") {
                return headname + "_0(" + term_to_string(t.arr[1], boolArr) + "," + term_to_string(t.arr[2], boolArr) + ")";
            } else if (t.arr[0].type === "plus") {
                if (t.arr[0].add.every((x) => equal(x, ONE)))
                    return headname + "_" + term_to_string(t.arr[0], boolArr) + "(" + term_to_string(t.arr[1], boolArr) + "," + term_to_string(t.arr[2], boolArr) + ")";
                return headname + "_{" + term_to_string(t.arr[0], boolArr) + "}(" + term_to_string(t.arr[1], boolArr) + "," + term_to_string(t.arr[2], boolArr) + ")";
            } else {
                if (equal(t.arr[0], ONE) || (boolArr[0] && equal(t.arr[0], OMEGA)) || (boolArr[1] && equal(t.arr[0], LOMEGA)) || (boolArr[2] && equal(t.arr[0], IOTA)))
                    return headname + "_" + term_to_string(t.arr[0], boolArr) + "(" + term_to_string(t.arr[1], boolArr) + "," + term_to_string(t.arr[2], boolArr) + ")";
                return headname + "_{" + term_to_string(t.arr[0], boolArr) + "}(" + term_to_string(t.arr[1], boolArr) + "," + term_to_string(t.arr[2], boolArr) + ")";
            }
        }
        return headname + "(" + term_to_string(t.arr[0], boolArr) + "," + term_to_string(t.arr[1], boolArr) + "," + term_to_string(t.arr[2], boolArr) + ")";
    } else {
        return t.add.map((x) => term_to_string(x, boolArr)).join("+");
    }
}

export function abbrviate(str: string, boolArr: boolean[]): string {
    str = str.replace(RegExp(headname + "\\(0\\)", "g"), "1");
    str = str.replace(RegExp(headname + "_\\{0\\}\\(0\\)", "g"), "1");
    str = str.replace(RegExp(headname + "_0\\(0\\)", "g"), "1");
    str = str.replace(RegExp(headname + "\\(0,0\\)", "g"), "1");
    str = str.replace(RegExp(headname + "_\\{0\\}\\(0,0\\)", "g"), "1");
    str = str.replace(RegExp(headname + "_0\\(0,0\\)", "g"), "1");
    str = str.replace(RegExp(headname + "\\(0,0,0\\)", "g"), "1");
    if (boolArr[0]) {
        str = str.replace(RegExp(headname + "\\(1\\)", "g"), "1");
        str = str.replace(RegExp(headname + "_\\{0\\}\\(1\\)", "g"), "1");
        str = str.replace(RegExp(headname + "_0\\(1\\)", "g"), "1");
        str = str.replace(RegExp(headname + "\\(0,1\\)", "g"), "1");
        str = str.replace(RegExp(headname + "_\\{0\\}\\(0,1\\)", "g"), "1");
        str = str.replace(RegExp(headname + "_0\\(0,1\\)", "g"), "1");
        str = str.replace(RegExp(headname + "\\(0,0,1\\)", "g"), "1");
    }
    if (boolArr[1]) {
        str = str.replace(RegExp(headname + "_\\{1\\}\\(0\\)", "g"), "1");
        str = str.replace(RegExp(headname + "_1\\(0\\)", "g"), "1");
        str = str.replace(RegExp(headname + "\\(1,0\\)", "g"), "1");
        str = str.replace(RegExp(headname + "_\\{0\\}\\(1,0\\)", "g"), "1");
        str = str.replace(RegExp(headname + "_0\\(1,0\\)", "g"), "1");
        str = str.replace(RegExp(headname + "\\(0,1,0\\)", "g"), "1");
    }
    if (boolArr[2]) {
        str = str.replace(RegExp(headname + "_\\{1\\}\\(0,0\\)", "g"), "1");
        str = str.replace(RegExp(headname + "_1\\(0,0\\)", "g"), "1");
        str = str.replace(RegExp(headname + "\\(1,0,0\\)", "g"), "1");
    }
    if (boolArr[8]) str = to_TeX(str);
    while (true) {
        const numterm = str.match(/1(\+1)+/);
        if (!numterm) break;
        const matches = numterm[0].match(/1/g);
        if (!matches) throw Error("そんなことある？");
        const count = matches.length;
        str = str.replace(numterm[0], count.toString());
    }
    return str;
}

function to_TeX(str: string): string {
    str = str.replace(RegExp(headname, "g"), "\\textrm{" + headname + "}");
    str = str.replace(/ω/g, "\\omega");
    str = str.replace(/Ω/g, "\\Omega");
    str = str.replace(/I/g, "\\textrm{I}");
    return str;
}