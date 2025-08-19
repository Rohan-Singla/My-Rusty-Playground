import * as borsh from "borsh";

export class CounterContract {
    count:number;

    constructor({count}:{count:number}){
        this.count = count;
    }

}

export const schema  : borsh.Schema = {
    struct : {
        count: 'u32',
    }
}

export const COUNTER_SIZE = borsh.serialize(schema,new CounterContract({count:0})).length;