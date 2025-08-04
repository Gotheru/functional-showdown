
import * as R from './rational'
import stringify from 'fast-json-stable-stringify'
import { flow } from 'fp-ts/function'
import * as P from 'fp-ts/Predicate'
import { URIS, Kind } from 'fp-ts/HKT'
import { Functor1 } from 'fp-ts/Functor'
import { Applicative1 } from 'fp-ts/Applicative'
import { Monad1 } from 'fp-ts/Monad'

// --- Distribution definition and constructors ---

/**
 * A discrete probability distribution over values of type A.
 */
export interface Distribution<A> {
	readonly pmf: Map<string, R.Rational>,    // probability mass function
	readonly repr: Map<string, A>,          // string keys back to original values
}

/** Construct a Distribution from a list of [value, weight] pairs. */
export const fromPmf = <A>(entries: [A, R.Rational][]): Distribution<A> => {
	const pmf = new Map<string, R.Rational>();
	const repr = new Map<string, A>();
	for (const [value, weight] of entries) {
		const key = stringify(value);
		const prev = pmf.get(key);
		const newWeight = prev ? R.add(prev, weight) : weight;
		pmf.set(key, newWeight);
		if (!repr.has(key)) repr.set(key, value);
	}
	return { pmf, repr };
};

/** Deterministic distribution returning a single value. */
export const of = <A>(a: A): Distribution<A> =>
	fromPmf([[a, R.make(1n)]]);

/** Uniform distribution over the given array. */
export const uniform = <A>(as: readonly A[]): Distribution<A> =>
	fromPmf(as.map(a => [a, R.make(1n, BigInt(as.length))]));


// --- Functor/Monad operations ---

/** Map a function over a Distribution. */
export const map = <A, B>(fa: Distribution<A>, f: (a: A) => B): Distribution<B> =>
	flatMap((a: A) => of(f(a)))(fa);

/** Chain/flatMap for dependent distributions. */
export const flatMap = <A, B>(f: (a: A) => Distribution<B>) =>
	(fa: Distribution<A>): Distribution<B> => {
		const out: [B, R.Rational][] = []
		for (const [keyA, pA] of fa.pmf) {
			const a = fa.repr.get(keyA)!;
			const fb = f(a);
			for (const [keyB, pB] of fb.pmf) {
				const b = fb.repr.get(keyB)!;
				out.push([b, R.mul(pA, pB)]);
			}
		}
		return fromPmf(out);
	}

/** Applicative ap: apply a distributed function to a distributed value. */
export const ap = <A, B>(fab: Distribution<(a: A) => B>, fa: Distribution<A>): Distribution<B> =>
	flatMap((f: (a: A) => B) => map(fa, f))(fab);

/** Get the probability for a specific outcome. */
export const get = <A>(fa: Distribution<A>) =>
	(a: A): R.Rational => fa.pmf.get(stringify(a)) || R.make(0n);

/** Predicate holds for all outcomes with non-zero probability. */
export const all = <A>(p: P.Predicate<A>) =>
	(fa: Distribution<A>): boolean => {
		for (const [key, weight] of fa.pmf) {
			if (weight.n === 0n) continue;
			if (!p(fa.repr.get(key)!)) return false;
		}
		return true;
	}


// --- fp-ts HKT registration and typeclass instances ---

/** Unique identifier for the Distribution type in fp-ts. */
export const URI = 'Distribution';
export type URI = typeof URI;

declare module 'fp-ts/HKT' {
	interface URItoKind<A> {
		readonly [URI]: Distribution<A>
	}
}

/** Functor instance for Distribution */
export const Functor: Functor1<URI> = {
	URI,
	map: (fa, f) => map(fa, f)
};

/** Applicative instance for Distribution */
export const Applicative: Applicative1<URI> = {
	URI,
	map: Functor.map,
	of,
	ap: (fab, fa) => ap(fab, fa)
};

/** Monad instance for Distribution */
export const Monad: Monad1<URI> = {
	URI,
	map: Functor.map,
	of,
	ap: Applicative.ap,
	chain: (fa, f) => flatMap(f)(fa)
};
