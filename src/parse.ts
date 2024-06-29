import { AT, PT, T, Z, ONE, LOMEGA, OMEGA, sanitize_plus_term, Goal, IOTA } from "./code";

function from_nat(num: number): PT | AT {
    let numterm: PT[] = [];
    while (num > 0) {
        numterm.push(ONE);
        num--;
    }
    return sanitize_plus_term(numterm);
}

function is_numchar(ch: string): boolean {
    // クソが代斉唱
    return (
        ch === "0" ||
        ch === "1" ||
        ch === "2" ||
        ch === "3" ||
        ch === "4" ||
        ch === "5" ||
        ch === "6" ||
        ch === "7" ||
        ch === "8" ||
        ch === "9"
    );
}

export class Scanner {
    str: string;
    pos: number;
    constructor(str: string) {
        this.str = str.replace(/\s/g, ""); // 空白は無視
        this.pos = 0;
    }

    // 次の文字が期待した文字なら1文字進め、trueを返す。
    // 次の文字が期待した文字でないなら何もせず、falseを返す。
    consume(op: string): boolean {
        if (this.str[this.pos] !== op) return false;
        this.pos += 1;
        return true;
    }

    // 次の文字が期待した文字なら1文字進める。
    // 次の文字が期待した文字でないなら例外を投げる。
    expect(op: string): void {
        const ch = this.str[this.pos];
        if (ch === undefined)
            throw Error(
                `${this.pos + 1}文字目に${op}が期待されていましたが、これ以上文字がありません`,
            );
        if (ch !== op)
            throw Error(`${this.pos + 1}文字目に${op}が期待されていましたが、${ch}が見つかりました`);
        this.pos += 1;
    }

    expect2(op1: string, op2: string): void {
        const ch = this.str[this.pos];
        if (ch === undefined)
            throw Error(
                `${this.pos + 1}文字目に${op1}または${op2}が期待されていましたが、これ以上文字がありません`,
            );
        if (ch !== op1 && ch !== op2)
            throw Error(`${this.pos + 1}文字目に${op1}または${op2}が期待されていましたが、${ch}が見つかりました`);
        this.pos += 1;
    }

    // 式をパース
    parse_term(): T {
        if (this.str === "") throw Error(`Empty string`);
        if (this.consume("0")) {
            return Z;
        } else if (is_numchar(this.str[this.pos])) {
            // 0以外の数字にマッチ
            const num_start = this.pos;
            let num_end = num_start;
            while (is_numchar(this.str[num_end])) {
                num_end += 1;
            }
            const num = parseInt(this.str.slice(num_start, num_end + 1));
            this.pos = num_end;
            return from_nat(num);
        } else {
            let list: PT[] = [];
            const first = this.parse_principal();
            list.push(first);
            while (this.consume("+")) {
                if (is_numchar(this.str[this.pos])) {
                    // 0以外の数字にマッチ
                    const num_start = this.pos;
                    let num_end = num_start;
                    while (is_numchar(this.str[num_end])) {
                        num_end += 1;
                    }
                    const num = parseInt(this.str.slice(num_start, num_end + 1));
                    this.pos = num_end;
                    const st = from_nat(num);
                    if (st.type === "plus") {
                        list = [...list, ...st.add];
                    } else {
                        list.push(st);
                    }
                } else {
                    const term = this.parse_principal();
                    list.push(term);
                }
            }
            return sanitize_plus_term(list);
        }
    }

    // principal psi termのパース
    parse_principal(): PT {
        if (this.consume("1")) {
            return ONE;
        } else if (this.consume("w") || this.consume("ω")) {
            return OMEGA;
        } else if (this.consume("W") || this.consume("Ω")) {
            return LOMEGA;
        } else if (this.consume("i") || this.consume("I")) {
            return IOTA;
        } else {
            this.expect2("伊", "い");
            this.consume("_"); // optional "_"
            let argarr: T[] = [];
            if (this.consume("(")) {
                const term = this.parse_term();
                if (this.consume(")")) return Goal([Z, Z, term]);
                argarr.push(term);
                this.expect(",");
            } else if (this.consume("{")) {
                const term = this.parse_term();
                argarr.push(term);
                this.expect("}");
                this.expect("(");
            } else {
                const term = this.parse_term();
                argarr.push(term);
                this.expect("(");
            }
            let term = this.parse_term();
            if (this.consume(")")) return Goal([Z, argarr[0], term]);
            argarr.push(term);
            this.expect(",");
            term = this.parse_term();
            argarr.push(term);
            this.expect(")");
            return Goal(argarr);
        }
    }
}