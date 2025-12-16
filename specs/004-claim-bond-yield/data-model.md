# Data Model: Claim Bond Yield Button

## Entities

- Bond Investment
  - Fields: `projectId: number`, `shares: number`, `currentValue: number`, `yield: number`, `apy: number`, `image: string`, `name: string`
  - Relations: belongs to Project

- Claim Transaction
  - Fields: `txHash: string`, `status: "pending" | "confirming" | "success" | "error"`, `amount: number`, `projectId: number`
  - Relations: linked to Bond Investment via `projectId`

## Validation Rules

- Claim enabled only if `yield > 0`, wallet connected, and correct network.
- Disable duplicate claims while `status` is `pending` or `confirming`.

## State Transitions

- Idle → Pending (on click)
- Pending → Confirming (tx broadcasted)
- Confirming → Success (receipt confirmed) → Portfolio refetch
- Confirming → Error (revert or rejection) → show error, remain idle
