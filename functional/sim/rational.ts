import { Semiring } from 'fp-ts/Semiring'
import { Field } from 'fp-ts/Field'
import { pipe } from 'fp-ts/function'

/**
 * Pure‐FP Rational: always kept in lowest terms, denominator > 0
 */
export interface Rational {
	readonly n: bigint  // numerator
	readonly d: bigint  // denominator > 0
}

/** Compute GCD via Euclid’s algorithm */
const gcd = (a: bigint, b: bigint): bigint =>
	b === 0n ? a < 0n ? -a : a : gcd(b, a % b)

/** Smart constructor: normalizes signs and reduces fraction */
export const make = (n: bigint, d: bigint = 1n): Rational => {
	if (d === 0n) throw new Error('Denominator must be non-zero')
	const sign = d < 0n ? -1n : 1n
	const g = gcd(n, d)
	return { n: (n / g) * sign, d: (d / g) * sign }
}

/** Basic operations */
export const add = (x: Rational, y: Rational): Rational =>
	make(x.n * y.d + y.n * x.d, x.d * y.d)

export const sub = (x: Rational, y: Rational): Rational =>
	make(x.n * y.d - y.n * x.d, x.d * y.d)

export const mul = (x: Rational, y: Rational): Rational =>
	make(x.n * y.n, x.d * y.d)

export const div = (x: Rational, y: Rational): Rational =>
	make(x.n * y.d, x.d * y.n)


/**
 * Find the closest fraction p'/q' ≈ p/q with q' ≤ maxDen
 */
function approximate(p: bigint, q: bigint, maxDen: bigint): Rational {
	// build continued fraction representation of p/q
	const cf: bigint[] = [];
	let a = p, b = q;
	while (b !== 0n) {
		cf.push(a / b);
		[a, b] = [b, a % b];
	}

	// now walk the convergents, stopping before denominators exceed maxDen
	let n0 = 0n, d0 = 1n;
	let n1 = 1n, d1 = 0n;
	for (let i = 0; i < cf.length; i++) {
		const ai = cf[i];
		const n2 = ai * n1 + n0;
		const d2 = ai * d1 + d0;
		if (d2 > maxDen) break;
		[n0, d0] = [n1, d1];
		[n1, d1] = [n2, d2];
	}

	return make(n1, d1);
}



/** Convert from number or bigint */
export const fromNumber = (n: number): Rational =>
	make(BigInt(n), 1n);

/** For convenience, to decimal */
export const toString = ({ n, d }: Rational): string =>
	d === 1n ? n.toString() : `${n}/${d}`;

// ———————————————————————————————————————————————————————————————————————————————
// Integrate with fp-ts’s numeric typeclasses so you can `getMonoid`, etc.
// ———————————————————————————————————————————————————————————————————————————————

// HKT registration
export const URI = 'Rational';
export type URI = typeof URI;

declare module 'fp-ts/HKT' {
	interface URItoKind<A> {
		readonly [URI]: Rational
	}
}

/**
 * Semiring instance for Rational
 */
export const semiringRational: Semiring<Rational> = {
	add,
	mul,
	zero: make(0n),
	one: make(1n)
};

/**
 * Field instance for Rational (adds sub & div)
 */
export const fieldRational: Field<Rational> = {
	...semiringRational,
	sub,
	div,
	// “Remainder” – rationals divide exactly, so always zero
	mod: (_x, _y) => make(0n),
	// “Degree” – no notion here, so constant
	degree: () => 0
};
