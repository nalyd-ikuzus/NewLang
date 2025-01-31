import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert'
import { deepEqual } from 'node:assert';



describe("Compiler", () => {
    it("can assert 1 === 1", () => {
        deepEqual(1, 1);
    });
});