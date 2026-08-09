import assert from "node:assert/strict";
import test from "node:test";
import {
  creationTokenRefundUpdate,
  creationTokenSpendFilter,
  creationTokenSpendUpdate,
  refundCreationToken,
  reserveCreationToken,
} from "../../server/utils/creationTokenSpend.js";

test("creationTokenSpendFilter requires an available token", () => {
  assert.deepEqual(creationTokenSpendFilter("user-1"), {
    _id: "user-1",
    creationTokens: { $gte: 1 },
  });
});

test("creationTokenSpendUpdate decrements exactly one token", () => {
  assert.deepEqual(creationTokenSpendUpdate(), {
    $inc: { creationTokens: -1 },
  });
});

test("creationTokenRefundUpdate restores one token", () => {
  assert.deepEqual(creationTokenRefundUpdate(), {
    $inc: { creationTokens: 1 },
  });
});

test("reserveCreationToken uses atomic findOneAndUpdate gate", async () => {
  const calls = [];
  const User = {
    findOneAndUpdate: async (filter, update, options) => {
      calls.push({ filter, update, options });
      return { _id: "user-1", creationTokens: 0 };
    },
  };

  const result = await reserveCreationToken(User, "user-1");

  assert.equal(result.creationTokens, 0);
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0].filter, creationTokenSpendFilter("user-1"));
  assert.deepEqual(calls[0].update, creationTokenSpendUpdate());
  assert.deepEqual(calls[0].options, { new: true });
});

test("reserveCreationToken returns null when no token remains", async () => {
  const User = {
    findOneAndUpdate: async () => null,
  };

  const result = await reserveCreationToken(User, "user-1");
  assert.equal(result, null);
});

test("refundCreationToken increments balance after failed save", async () => {
  const calls = [];
  const User = {
    findByIdAndUpdate: async (id, update) => {
      calls.push({ id, update });
      return { _id: id, creationTokens: 1 };
    },
  };

  await refundCreationToken(User, "user-1");
  assert.deepEqual(calls[0], {
    id: "user-1",
    update: creationTokenRefundUpdate(),
  });
});
