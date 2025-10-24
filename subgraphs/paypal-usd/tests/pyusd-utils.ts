import { newMockEvent } from "matchstick-as"
import { ethereum, Address, BigInt, Bytes } from "@graphprotocol/graph-ts"
import {
  Approval,
  AuthorizationAlreadyUsed,
  AuthorizationCanceled,
  AuthorizationUsed,
  DefaultAdminDelayChangeCanceled,
  DefaultAdminDelayChangeScheduled,
  DefaultAdminTransferCanceled,
  DefaultAdminTransferScheduled,
  FreezeAddress,
  FrozenAddressWiped,
  Initialized,
  Pause,
  RoleAdminChanged,
  RoleGranted,
  RoleRevoked,
  SanctionedAddressListUpdate,
  SupplyControlSet,
  SupplyDecreased,
  SupplyIncreased,
  Transfer,
  UnfreezeAddress,
  Unpause
} from "../generated/PYUSD/PYUSD"

export function createApprovalEvent(
  owner: Address,
  spender: Address,
  value: BigInt
): Approval {
  let approvalEvent = changetype<Approval>(newMockEvent())

  approvalEvent.parameters = new Array()

  approvalEvent.parameters.push(
    new ethereum.EventParam("owner", ethereum.Value.fromAddress(owner))
  )
  approvalEvent.parameters.push(
    new ethereum.EventParam("spender", ethereum.Value.fromAddress(spender))
  )
  approvalEvent.parameters.push(
    new ethereum.EventParam("value", ethereum.Value.fromUnsignedBigInt(value))
  )

  return approvalEvent
}

export function createAuthorizationAlreadyUsedEvent(
  authorizer: Address,
  nonce: Bytes
): AuthorizationAlreadyUsed {
  let authorizationAlreadyUsedEvent =
    changetype<AuthorizationAlreadyUsed>(newMockEvent())

  authorizationAlreadyUsedEvent.parameters = new Array()

  authorizationAlreadyUsedEvent.parameters.push(
    new ethereum.EventParam(
      "authorizer",
      ethereum.Value.fromAddress(authorizer)
    )
  )
  authorizationAlreadyUsedEvent.parameters.push(
    new ethereum.EventParam("nonce", ethereum.Value.fromFixedBytes(nonce))
  )

  return authorizationAlreadyUsedEvent
}

export function createAuthorizationCanceledEvent(
  authorizer: Address,
  nonce: Bytes
): AuthorizationCanceled {
  let authorizationCanceledEvent =
    changetype<AuthorizationCanceled>(newMockEvent())

  authorizationCanceledEvent.parameters = new Array()

  authorizationCanceledEvent.parameters.push(
    new ethereum.EventParam(
      "authorizer",
      ethereum.Value.fromAddress(authorizer)
    )
  )
  authorizationCanceledEvent.parameters.push(
    new ethereum.EventParam("nonce", ethereum.Value.fromFixedBytes(nonce))
  )

  return authorizationCanceledEvent
}

export function createAuthorizationUsedEvent(
  authorizer: Address,
  nonce: Bytes
): AuthorizationUsed {
  let authorizationUsedEvent = changetype<AuthorizationUsed>(newMockEvent())

  authorizationUsedEvent.parameters = new Array()

  authorizationUsedEvent.parameters.push(
    new ethereum.EventParam(
      "authorizer",
      ethereum.Value.fromAddress(authorizer)
    )
  )
  authorizationUsedEvent.parameters.push(
    new ethereum.EventParam("nonce", ethereum.Value.fromFixedBytes(nonce))
  )

  return authorizationUsedEvent
}

export function createDefaultAdminDelayChangeCanceledEvent(): DefaultAdminDelayChangeCanceled {
  let defaultAdminDelayChangeCanceledEvent =
    changetype<DefaultAdminDelayChangeCanceled>(newMockEvent())

  defaultAdminDelayChangeCanceledEvent.parameters = new Array()

  return defaultAdminDelayChangeCanceledEvent
}

export function createDefaultAdminDelayChangeScheduledEvent(
  newDelay: BigInt,
  effectSchedule: BigInt
): DefaultAdminDelayChangeScheduled {
  let defaultAdminDelayChangeScheduledEvent =
    changetype<DefaultAdminDelayChangeScheduled>(newMockEvent())

  defaultAdminDelayChangeScheduledEvent.parameters = new Array()

  defaultAdminDelayChangeScheduledEvent.parameters.push(
    new ethereum.EventParam(
      "newDelay",
      ethereum.Value.fromUnsignedBigInt(newDelay)
    )
  )
  defaultAdminDelayChangeScheduledEvent.parameters.push(
    new ethereum.EventParam(
      "effectSchedule",
      ethereum.Value.fromUnsignedBigInt(effectSchedule)
    )
  )

  return defaultAdminDelayChangeScheduledEvent
}

export function createDefaultAdminTransferCanceledEvent(): DefaultAdminTransferCanceled {
  let defaultAdminTransferCanceledEvent =
    changetype<DefaultAdminTransferCanceled>(newMockEvent())

  defaultAdminTransferCanceledEvent.parameters = new Array()

  return defaultAdminTransferCanceledEvent
}

export function createDefaultAdminTransferScheduledEvent(
  newAdmin: Address,
  acceptSchedule: BigInt
): DefaultAdminTransferScheduled {
  let defaultAdminTransferScheduledEvent =
    changetype<DefaultAdminTransferScheduled>(newMockEvent())

  defaultAdminTransferScheduledEvent.parameters = new Array()

  defaultAdminTransferScheduledEvent.parameters.push(
    new ethereum.EventParam("newAdmin", ethereum.Value.fromAddress(newAdmin))
  )
  defaultAdminTransferScheduledEvent.parameters.push(
    new ethereum.EventParam(
      "acceptSchedule",
      ethereum.Value.fromUnsignedBigInt(acceptSchedule)
    )
  )

  return defaultAdminTransferScheduledEvent
}

export function createFreezeAddressEvent(addr: Address): FreezeAddress {
  let freezeAddressEvent = changetype<FreezeAddress>(newMockEvent())

  freezeAddressEvent.parameters = new Array()

  freezeAddressEvent.parameters.push(
    new ethereum.EventParam("addr", ethereum.Value.fromAddress(addr))
  )

  return freezeAddressEvent
}

export function createFrozenAddressWipedEvent(
  addr: Address
): FrozenAddressWiped {
  let frozenAddressWipedEvent = changetype<FrozenAddressWiped>(newMockEvent())

  frozenAddressWipedEvent.parameters = new Array()

  frozenAddressWipedEvent.parameters.push(
    new ethereum.EventParam("addr", ethereum.Value.fromAddress(addr))
  )

  return frozenAddressWipedEvent
}

export function createInitializedEvent(version: i32): Initialized {
  let initializedEvent = changetype<Initialized>(newMockEvent())

  initializedEvent.parameters = new Array()

  initializedEvent.parameters.push(
    new ethereum.EventParam(
      "version",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(version))
    )
  )

  return initializedEvent
}

export function createPauseEvent(): Pause {
  let pauseEvent = changetype<Pause>(newMockEvent())

  pauseEvent.parameters = new Array()

  return pauseEvent
}

export function createRoleAdminChangedEvent(
  role: Bytes,
  previousAdminRole: Bytes,
  newAdminRole: Bytes
): RoleAdminChanged {
  let roleAdminChangedEvent = changetype<RoleAdminChanged>(newMockEvent())

  roleAdminChangedEvent.parameters = new Array()

  roleAdminChangedEvent.parameters.push(
    new ethereum.EventParam("role", ethereum.Value.fromFixedBytes(role))
  )
  roleAdminChangedEvent.parameters.push(
    new ethereum.EventParam(
      "previousAdminRole",
      ethereum.Value.fromFixedBytes(previousAdminRole)
    )
  )
  roleAdminChangedEvent.parameters.push(
    new ethereum.EventParam(
      "newAdminRole",
      ethereum.Value.fromFixedBytes(newAdminRole)
    )
  )

  return roleAdminChangedEvent
}

export function createRoleGrantedEvent(
  role: Bytes,
  account: Address,
  sender: Address
): RoleGranted {
  let roleGrantedEvent = changetype<RoleGranted>(newMockEvent())

  roleGrantedEvent.parameters = new Array()

  roleGrantedEvent.parameters.push(
    new ethereum.EventParam("role", ethereum.Value.fromFixedBytes(role))
  )
  roleGrantedEvent.parameters.push(
    new ethereum.EventParam("account", ethereum.Value.fromAddress(account))
  )
  roleGrantedEvent.parameters.push(
    new ethereum.EventParam("sender", ethereum.Value.fromAddress(sender))
  )

  return roleGrantedEvent
}

export function createRoleRevokedEvent(
  role: Bytes,
  account: Address,
  sender: Address
): RoleRevoked {
  let roleRevokedEvent = changetype<RoleRevoked>(newMockEvent())

  roleRevokedEvent.parameters = new Array()

  roleRevokedEvent.parameters.push(
    new ethereum.EventParam("role", ethereum.Value.fromFixedBytes(role))
  )
  roleRevokedEvent.parameters.push(
    new ethereum.EventParam("account", ethereum.Value.fromAddress(account))
  )
  roleRevokedEvent.parameters.push(
    new ethereum.EventParam("sender", ethereum.Value.fromAddress(sender))
  )

  return roleRevokedEvent
}

export function createSanctionedAddressListUpdateEvent(
  newSanctionedAddress: Address
): SanctionedAddressListUpdate {
  let sanctionedAddressListUpdateEvent =
    changetype<SanctionedAddressListUpdate>(newMockEvent())

  sanctionedAddressListUpdateEvent.parameters = new Array()

  sanctionedAddressListUpdateEvent.parameters.push(
    new ethereum.EventParam(
      "newSanctionedAddress",
      ethereum.Value.fromAddress(newSanctionedAddress)
    )
  )

  return sanctionedAddressListUpdateEvent
}

export function createSupplyControlSetEvent(
  supplyControlAddress: Address
): SupplyControlSet {
  let supplyControlSetEvent = changetype<SupplyControlSet>(newMockEvent())

  supplyControlSetEvent.parameters = new Array()

  supplyControlSetEvent.parameters.push(
    new ethereum.EventParam(
      "supplyControlAddress",
      ethereum.Value.fromAddress(supplyControlAddress)
    )
  )

  return supplyControlSetEvent
}

export function createSupplyDecreasedEvent(
  from: Address,
  value: BigInt
): SupplyDecreased {
  let supplyDecreasedEvent = changetype<SupplyDecreased>(newMockEvent())

  supplyDecreasedEvent.parameters = new Array()

  supplyDecreasedEvent.parameters.push(
    new ethereum.EventParam("from", ethereum.Value.fromAddress(from))
  )
  supplyDecreasedEvent.parameters.push(
    new ethereum.EventParam("value", ethereum.Value.fromUnsignedBigInt(value))
  )

  return supplyDecreasedEvent
}

export function createSupplyIncreasedEvent(
  to: Address,
  value: BigInt
): SupplyIncreased {
  let supplyIncreasedEvent = changetype<SupplyIncreased>(newMockEvent())

  supplyIncreasedEvent.parameters = new Array()

  supplyIncreasedEvent.parameters.push(
    new ethereum.EventParam("to", ethereum.Value.fromAddress(to))
  )
  supplyIncreasedEvent.parameters.push(
    new ethereum.EventParam("value", ethereum.Value.fromUnsignedBigInt(value))
  )

  return supplyIncreasedEvent
}

export function createTransferEvent(
  from: Address,
  to: Address,
  value: BigInt
): Transfer {
  let transferEvent = changetype<Transfer>(newMockEvent())

  transferEvent.parameters = new Array()

  transferEvent.parameters.push(
    new ethereum.EventParam("from", ethereum.Value.fromAddress(from))
  )
  transferEvent.parameters.push(
    new ethereum.EventParam("to", ethereum.Value.fromAddress(to))
  )
  transferEvent.parameters.push(
    new ethereum.EventParam("value", ethereum.Value.fromUnsignedBigInt(value))
  )

  return transferEvent
}

export function createUnfreezeAddressEvent(addr: Address): UnfreezeAddress {
  let unfreezeAddressEvent = changetype<UnfreezeAddress>(newMockEvent())

  unfreezeAddressEvent.parameters = new Array()

  unfreezeAddressEvent.parameters.push(
    new ethereum.EventParam("addr", ethereum.Value.fromAddress(addr))
  )

  return unfreezeAddressEvent
}

export function createUnpauseEvent(): Unpause {
  let unpauseEvent = changetype<Unpause>(newMockEvent())

  unpauseEvent.parameters = new Array()

  return unpauseEvent
}
