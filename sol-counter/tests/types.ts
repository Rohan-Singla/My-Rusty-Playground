export class Counter {
    count: number;

    constructor({ count }: { count: number }) {
        this.count = count;
    }
}

export class IncrementInstruction {
    enum: string = 'Increment';
    value: number;

    constructor(value: number) {
        this.value = value;
    }
}

export class DecrementInstruction {
    enum: string = 'Decrement';
    value: number;

    constructor(value: number) {
        this.value = value;
    }
}

export const counterSchema = new Map([
    [Counter, { kind: 'struct', fields: [['count', 'u32']] }]
]);

export const instructionSchema = new Map([
    [IncrementInstruction, { kind: 'enum', field: 'enum', values: [['Increment', 'u32']] }],
    [DecrementInstruction, { kind: 'enum', field: 'enum', values: [['Decrement', 'u32']] }]
]);

export const schema = counterSchema;

export const COUNTER_SIZE = 4;