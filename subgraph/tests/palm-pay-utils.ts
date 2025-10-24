import { newMockEvent } from "matchstick-as"
import { ethereum, Address, BigInt, Bytes } from "@graphprotocol/graph-ts"
import {
  BackendVerifierUpdated,
  ChargeRecorded,
  CustomerDeactivated,
  CustomerRegistered,
  LimitsUpdated,
  MaxSpendingLimitCeilingUpdated,
  OwnershipTransferred,
  StoreDeactivated,
  StoreRegistered
} from "../generated/PalmPay/PalmPay"

export function createBackendVerifierUpdatedEvent(
  oldVerifier: Address,
  newVerifier: Address,
  timestamp: BigInt
): BackendVerifierUpdated {
  let backendVerifierUpdatedEvent =
    changetype<BackendVerifierUpdated>(newMockEvent())

  backendVerifierUpdatedEvent.parameters = new Array()

  backendVerifierUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "oldVerifier",
      ethereum.Value.fromAddress(oldVerifier)
    )
  )
  backendVerifierUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "newVerifier",
      ethereum.Value.fromAddress(newVerifier)
    )
  )
  backendVerifierUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "timestamp",
      ethereum.Value.fromUnsignedBigInt(timestamp)
    )
  )

  return backendVerifierUpdatedEvent
}

export function createChargeRecordedEvent(
  customer: Address,
  store: Address,
  amount: BigInt,
  nonce: BigInt,
  timestamp: BigInt,
  receiptHash: Bytes
): ChargeRecorded {
  let chargeRecordedEvent = changetype<ChargeRecorded>(newMockEvent())

  chargeRecordedEvent.parameters = new Array()

  chargeRecordedEvent.parameters.push(
    new ethereum.EventParam("customer", ethereum.Value.fromAddress(customer))
  )
  chargeRecordedEvent.parameters.push(
    new ethereum.EventParam("store", ethereum.Value.fromAddress(store))
  )
  chargeRecordedEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )
  chargeRecordedEvent.parameters.push(
    new ethereum.EventParam("nonce", ethereum.Value.fromUnsignedBigInt(nonce))
  )
  chargeRecordedEvent.parameters.push(
    new ethereum.EventParam(
      "timestamp",
      ethereum.Value.fromUnsignedBigInt(timestamp)
    )
  )
  chargeRecordedEvent.parameters.push(
    new ethereum.EventParam(
      "receiptHash",
      ethereum.Value.fromFixedBytes(receiptHash)
    )
  )

  return chargeRecordedEvent
}

export function createCustomerDeactivatedEvent(
  customer: Address,
  timestamp: BigInt
): CustomerDeactivated {
  let customerDeactivatedEvent = changetype<CustomerDeactivated>(newMockEvent())

  customerDeactivatedEvent.parameters = new Array()

  customerDeactivatedEvent.parameters.push(
    new ethereum.EventParam("customer", ethereum.Value.fromAddress(customer))
  )
  customerDeactivatedEvent.parameters.push(
    new ethereum.EventParam(
      "timestamp",
      ethereum.Value.fromUnsignedBigInt(timestamp)
    )
  )

  return customerDeactivatedEvent
}

export function createCustomerRegisteredEvent(
  customer: Address,
  timestamp: BigInt
): CustomerRegistered {
  let customerRegisteredEvent = changetype<CustomerRegistered>(newMockEvent())

  customerRegisteredEvent.parameters = new Array()

  customerRegisteredEvent.parameters.push(
    new ethereum.EventParam("customer", ethereum.Value.fromAddress(customer))
  )
  customerRegisteredEvent.parameters.push(
    new ethereum.EventParam(
      "timestamp",
      ethereum.Value.fromUnsignedBigInt(timestamp)
    )
  )

  return customerRegisteredEvent
}

export function createLimitsUpdatedEvent(
  customer: Address,
  maxTransactionAmount: BigInt
): LimitsUpdated {
  let limitsUpdatedEvent = changetype<LimitsUpdated>(newMockEvent())

  limitsUpdatedEvent.parameters = new Array()

  limitsUpdatedEvent.parameters.push(
    new ethereum.EventParam("customer", ethereum.Value.fromAddress(customer))
  )
  limitsUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "maxTransactionAmount",
      ethereum.Value.fromUnsignedBigInt(maxTransactionAmount)
    )
  )

  return limitsUpdatedEvent
}

export function createMaxSpendingLimitCeilingUpdatedEvent(
  oldCeiling: BigInt,
  newCeiling: BigInt,
  timestamp: BigInt
): MaxSpendingLimitCeilingUpdated {
  let maxSpendingLimitCeilingUpdatedEvent =
    changetype<MaxSpendingLimitCeilingUpdated>(newMockEvent())

  maxSpendingLimitCeilingUpdatedEvent.parameters = new Array()

  maxSpendingLimitCeilingUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "oldCeiling",
      ethereum.Value.fromUnsignedBigInt(oldCeiling)
    )
  )
  maxSpendingLimitCeilingUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "newCeiling",
      ethereum.Value.fromUnsignedBigInt(newCeiling)
    )
  )
  maxSpendingLimitCeilingUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "timestamp",
      ethereum.Value.fromUnsignedBigInt(timestamp)
    )
  )

  return maxSpendingLimitCeilingUpdatedEvent
}

export function createOwnershipTransferredEvent(
  previousOwner: Address,
  newOwner: Address
): OwnershipTransferred {
  let ownershipTransferredEvent =
    changetype<OwnershipTransferred>(newMockEvent())

  ownershipTransferredEvent.parameters = new Array()

  ownershipTransferredEvent.parameters.push(
    new ethereum.EventParam(
      "previousOwner",
      ethereum.Value.fromAddress(previousOwner)
    )
  )
  ownershipTransferredEvent.parameters.push(
    new ethereum.EventParam("newOwner", ethereum.Value.fromAddress(newOwner))
  )

  return ownershipTransferredEvent
}

export function createStoreDeactivatedEvent(
  store: Address,
  timestamp: BigInt
): StoreDeactivated {
  let storeDeactivatedEvent = changetype<StoreDeactivated>(newMockEvent())

  storeDeactivatedEvent.parameters = new Array()

  storeDeactivatedEvent.parameters.push(
    new ethereum.EventParam("store", ethereum.Value.fromAddress(store))
  )
  storeDeactivatedEvent.parameters.push(
    new ethereum.EventParam(
      "timestamp",
      ethereum.Value.fromUnsignedBigInt(timestamp)
    )
  )

  return storeDeactivatedEvent
}

export function createStoreRegisteredEvent(
  store: Address,
  name: string,
  city: string,
  timestamp: BigInt
): StoreRegistered {
  let storeRegisteredEvent = changetype<StoreRegistered>(newMockEvent())

  storeRegisteredEvent.parameters = new Array()

  storeRegisteredEvent.parameters.push(
    new ethereum.EventParam("store", ethereum.Value.fromAddress(store))
  )
  storeRegisteredEvent.parameters.push(
    new ethereum.EventParam("name", ethereum.Value.fromString(name))
  )
  storeRegisteredEvent.parameters.push(
    new ethereum.EventParam("city", ethereum.Value.fromString(city))
  )
  storeRegisteredEvent.parameters.push(
    new ethereum.EventParam(
      "timestamp",
      ethereum.Value.fromUnsignedBigInt(timestamp)
    )
  )

  return storeRegisteredEvent
}
