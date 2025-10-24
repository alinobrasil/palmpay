import {
  BackendVerifierUpdated as BackendVerifierUpdatedEvent,
  ChargeRecorded as ChargeRecordedEvent,
  CustomerDeactivated as CustomerDeactivatedEvent,
  CustomerRegistered as CustomerRegisteredEvent,
  LimitsUpdated as LimitsUpdatedEvent,
  MaxSpendingLimitCeilingUpdated as MaxSpendingLimitCeilingUpdatedEvent,
  OwnershipTransferred as OwnershipTransferredEvent,
  StoreDeactivated as StoreDeactivatedEvent,
  StoreRegistered as StoreRegisteredEvent
} from "../generated/PalmPay/PalmPay"
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
} from "../generated/schema"

export function handleBackendVerifierUpdated(
  event: BackendVerifierUpdatedEvent
): void {
  let entity = new BackendVerifierUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.oldVerifier = event.params.oldVerifier
  entity.newVerifier = event.params.newVerifier
  entity.timestamp = event.params.timestamp

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleChargeRecorded(event: ChargeRecordedEvent): void {
  let entity = new ChargeRecorded(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.customer = event.params.customer
  entity.store = event.params.store
  entity.amount = event.params.amount
  entity.nonce = event.params.nonce
  entity.timestamp = event.params.timestamp
  entity.receiptHash = event.params.receiptHash

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleCustomerDeactivated(
  event: CustomerDeactivatedEvent
): void {
  let entity = new CustomerDeactivated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.customer = event.params.customer
  entity.timestamp = event.params.timestamp

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleCustomerRegistered(event: CustomerRegisteredEvent): void {
  let entity = new CustomerRegistered(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.customer = event.params.customer
  entity.timestamp = event.params.timestamp

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleLimitsUpdated(event: LimitsUpdatedEvent): void {
  let entity = new LimitsUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.customer = event.params.customer
  entity.maxTransactionAmount = event.params.maxTransactionAmount

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleMaxSpendingLimitCeilingUpdated(
  event: MaxSpendingLimitCeilingUpdatedEvent
): void {
  let entity = new MaxSpendingLimitCeilingUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.oldCeiling = event.params.oldCeiling
  entity.newCeiling = event.params.newCeiling
  entity.timestamp = event.params.timestamp

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleOwnershipTransferred(
  event: OwnershipTransferredEvent
): void {
  let entity = new OwnershipTransferred(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.previousOwner = event.params.previousOwner
  entity.newOwner = event.params.newOwner

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleStoreDeactivated(event: StoreDeactivatedEvent): void {
  let entity = new StoreDeactivated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.store = event.params.store
  entity.timestamp = event.params.timestamp

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleStoreRegistered(event: StoreRegisteredEvent): void {
  let entity = new StoreRegistered(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.store = event.params.store
  entity.name = event.params.name
  entity.city = event.params.city
  entity.timestamp = event.params.timestamp

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}
