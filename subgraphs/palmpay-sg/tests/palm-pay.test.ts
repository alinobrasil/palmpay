import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll
} from "matchstick-as/assembly/index"
import { Address, BigInt, Bytes } from "@graphprotocol/graph-ts"
import { BackendVerifierUpdated } from "../generated/schema"
import { BackendVerifierUpdated as BackendVerifierUpdatedEvent } from "../generated/PalmPay/PalmPay"
import { handleBackendVerifierUpdated } from "../src/palm-pay"
import { createBackendVerifierUpdatedEvent } from "./palm-pay-utils"

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#tests-structure

describe("Describe entity assertions", () => {
  beforeAll(() => {
    let oldVerifier = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    )
    let newVerifier = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    )
    let timestamp = BigInt.fromI32(234)
    let newBackendVerifierUpdatedEvent = createBackendVerifierUpdatedEvent(
      oldVerifier,
      newVerifier,
      timestamp
    )
    handleBackendVerifierUpdated(newBackendVerifierUpdatedEvent)
  })

  afterAll(() => {
    clearStore()
  })

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#write-a-unit-test

  test("BackendVerifierUpdated created and stored", () => {
    assert.entityCount("BackendVerifierUpdated", 1)

    // 0xa16081f360e3847006db660bae1c6d1b2e17ec2a is the default address used in newMockEvent() function
    assert.fieldEquals(
      "BackendVerifierUpdated",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "oldVerifier",
      "0x0000000000000000000000000000000000000001"
    )
    assert.fieldEquals(
      "BackendVerifierUpdated",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "newVerifier",
      "0x0000000000000000000000000000000000000001"
    )
    assert.fieldEquals(
      "BackendVerifierUpdated",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "timestamp",
      "234"
    )

    // More assert options:
    // https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#asserts
  })
})
