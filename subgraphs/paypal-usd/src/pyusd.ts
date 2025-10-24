import {
  Approval as ApprovalEvent,
  AuthorizationAlreadyUsed as AuthorizationAlreadyUsedEvent,
  AuthorizationCanceled as AuthorizationCanceledEvent,
  AuthorizationUsed as AuthorizationUsedEvent,
  DefaultAdminDelayChangeCanceled as DefaultAdminDelayChangeCanceledEvent,
  DefaultAdminDelayChangeScheduled as DefaultAdminDelayChangeScheduledEvent,
  DefaultAdminTransferCanceled as DefaultAdminTransferCanceledEvent,
  DefaultAdminTransferScheduled as DefaultAdminTransferScheduledEvent,
  FreezeAddress as FreezeAddressEvent,
  FrozenAddressWiped as FrozenAddressWipedEvent,
  Initialized as InitializedEvent,
  Pause as PauseEvent,
  RoleAdminChanged as RoleAdminChangedEvent,
  RoleGranted as RoleGrantedEvent,
  RoleRevoked as RoleRevokedEvent,
  SanctionedAddressListUpdate as SanctionedAddressListUpdateEvent,
  SupplyControlSet as SupplyControlSetEvent,
  SupplyDecreased as SupplyDecreasedEvent,
  SupplyIncreased as SupplyIncreasedEvent,
  Transfer as TransferEvent,
  UnfreezeAddress as UnfreezeAddressEvent,
  Unpause as UnpauseEvent
} from "../generated/PYUSD/PYUSD"
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
} from "../generated/schema"

export function handleApproval(event: ApprovalEvent): void {
  let entity = new Approval(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.owner = event.params.owner
  entity.spender = event.params.spender
  entity.value = event.params.value

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleAuthorizationAlreadyUsed(
  event: AuthorizationAlreadyUsedEvent
): void {
  let entity = new AuthorizationAlreadyUsed(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.authorizer = event.params.authorizer
  entity.nonce = event.params.nonce

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleAuthorizationCanceled(
  event: AuthorizationCanceledEvent
): void {
  let entity = new AuthorizationCanceled(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.authorizer = event.params.authorizer
  entity.nonce = event.params.nonce

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleAuthorizationUsed(event: AuthorizationUsedEvent): void {
  let entity = new AuthorizationUsed(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.authorizer = event.params.authorizer
  entity.nonce = event.params.nonce

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleDefaultAdminDelayChangeCanceled(
  event: DefaultAdminDelayChangeCanceledEvent
): void {
  let entity = new DefaultAdminDelayChangeCanceled(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleDefaultAdminDelayChangeScheduled(
  event: DefaultAdminDelayChangeScheduledEvent
): void {
  let entity = new DefaultAdminDelayChangeScheduled(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.newDelay = event.params.newDelay
  entity.effectSchedule = event.params.effectSchedule

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleDefaultAdminTransferCanceled(
  event: DefaultAdminTransferCanceledEvent
): void {
  let entity = new DefaultAdminTransferCanceled(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleDefaultAdminTransferScheduled(
  event: DefaultAdminTransferScheduledEvent
): void {
  let entity = new DefaultAdminTransferScheduled(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.newAdmin = event.params.newAdmin
  entity.acceptSchedule = event.params.acceptSchedule

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleFreezeAddress(event: FreezeAddressEvent): void {
  let entity = new FreezeAddress(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.addr = event.params.addr

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleFrozenAddressWiped(event: FrozenAddressWipedEvent): void {
  let entity = new FrozenAddressWiped(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.addr = event.params.addr

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleInitialized(event: InitializedEvent): void {
  let entity = new Initialized(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.version = event.params.version

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handlePause(event: PauseEvent): void {
  let entity = new Pause(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleRoleAdminChanged(event: RoleAdminChangedEvent): void {
  let entity = new RoleAdminChanged(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.role = event.params.role
  entity.previousAdminRole = event.params.previousAdminRole
  entity.newAdminRole = event.params.newAdminRole

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleRoleGranted(event: RoleGrantedEvent): void {
  let entity = new RoleGranted(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.role = event.params.role
  entity.account = event.params.account
  entity.sender = event.params.sender

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleRoleRevoked(event: RoleRevokedEvent): void {
  let entity = new RoleRevoked(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.role = event.params.role
  entity.account = event.params.account
  entity.sender = event.params.sender

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleSanctionedAddressListUpdate(
  event: SanctionedAddressListUpdateEvent
): void {
  let entity = new SanctionedAddressListUpdate(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.newSanctionedAddress = event.params.newSanctionedAddress

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleSupplyControlSet(event: SupplyControlSetEvent): void {
  let entity = new SupplyControlSet(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.supplyControlAddress = event.params.supplyControlAddress

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleSupplyDecreased(event: SupplyDecreasedEvent): void {
  let entity = new SupplyDecreased(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.from = event.params.from
  entity.value = event.params.value

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleSupplyIncreased(event: SupplyIncreasedEvent): void {
  let entity = new SupplyIncreased(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.to = event.params.to
  entity.value = event.params.value

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleTransfer(event: TransferEvent): void {
  let entity = new Transfer(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.from = event.params.from
  entity.to = event.params.to
  entity.value = event.params.value

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleUnfreezeAddress(event: UnfreezeAddressEvent): void {
  let entity = new UnfreezeAddress(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.addr = event.params.addr

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleUnpause(event: UnpauseEvent): void {
  let entity = new Unpause(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}
