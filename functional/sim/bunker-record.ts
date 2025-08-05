import { Map as ImmutableMap } from 'immutable';

export abstract class BunkerRecord {
	// Underlying storage
	protected _data: ImmutableMap<any, any> = ImmutableMap();

	constructor(initialValues?: any) {
		if (initialValues) {
			this._data = this._data.merge(initialValues);
			Object.keys(initialValues).forEach(key => {
				Object.defineProperty(this, key, {
					get() { return this._data.get(key); },
					set() { throw new Error('Cannot set on an immutable record.'); },
				});
			});
		}
	}

	toJS() {
		return this._data.toJS();
	}

	equals(other: BunkerRecord) {
		return (
			typeof this === typeof other &&
			this._data.equals(other._data)
		);
	}

	with(values: any): any {
		const returnVal = new (this.constructor as any);
		returnVal._data = this._data.merge(values);
		return returnVal;
	}
}
