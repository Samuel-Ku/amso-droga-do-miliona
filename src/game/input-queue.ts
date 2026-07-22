import type { ControlMethod } from "./contracts";

export const INPUT_QUEUE_CAPACITY = 256;
export type GameplayInputAction = "jump" | "crouch";

export interface StepInput {
  readonly jumpPressed: boolean;
  readonly crouchHeld: boolean;
  readonly appliedCrouch: boolean;
  readonly controlMethod: ControlMethod;
}
/** Allocation-free bounded ring buffer. consume() returns one stable mutable view. */
export class GameplayInputQueue {
  private readonly targetSteps: Float64Array;
  private readonly sequences: Float64Array;
  private readonly actions: Uint8Array;
  private readonly active: Uint8Array;
  private readonly methods: Uint8Array;
  private head = 0;
  private tail = 0;
  private size = 0;
  private sequence = 0;
  private crouchHeld = false;
  private readonly stepView = { jumpPressed: false, crouchHeld: false, appliedCrouch: false, controlMethod: "keyboard" as ControlMethod };
  public overflowed = false;
  public overflowIncidents = 0;
  public droppedEvents = 0;

  public constructor(public readonly capacity = INPUT_QUEUE_CAPACITY) {
    if (!Number.isInteger(capacity) || capacity < 1) throw new Error("input_queue_capacity_invalid");
    this.targetSteps = new Float64Array(capacity);
    this.sequences = new Float64Array(capacity);
    this.actions = new Uint8Array(capacity);
    this.active = new Uint8Array(capacity);
    this.methods = new Uint8Array(capacity);
  }

  public get count(): number { return this.size; }

  public push(step: number, action: GameplayInputAction, active: boolean, method: ControlMethod): boolean {
    if (this.overflowed || this.size === this.capacity) {
      if (!this.overflowed) this.overflowIncidents += 1;
      this.overflowed = true;
      this.droppedEvents += 1;
      return false;
    }
    const index = this.tail;
    this.targetSteps[index] = step;
    this.sequences[index] = this.sequence++;
    this.actions[index] = action === "jump" ? 1 : 2;
    this.active[index] = active ? 1 : 0;
    this.methods[index] = method === "keyboard" ? 0 : method === "pointer" ? 1 : 2;
    this.tail = (index + 1) % this.capacity;
    this.size += 1;
    return true;
  }

  public consume(step: number): StepInput {
    let jumpPressed = false;
    let method: ControlMethod = "keyboard";
    while (this.size > 0 && (this.targetSteps[this.head] ?? Infinity) <= step) {
      const index = this.head;
      const eventMethod = this.methods[index] === 0 ? "keyboard" : this.methods[index] === 1 ? "pointer" : "touch";
      if (this.actions[index] === 1 && this.active[index] === 1) {
        jumpPressed = true;
        method = eventMethod;
      } else if (this.actions[index] === 2) {
        this.crouchHeld = this.active[index] === 1;
        method = eventMethod;
      }
      this.head = (index + 1) % this.capacity;
      this.size -= 1;
    }
    this.stepView.jumpPressed = jumpPressed;
    this.stepView.crouchHeld = this.crouchHeld;
    this.stepView.appliedCrouch = !jumpPressed && this.crouchHeld;
    this.stepView.controlMethod = method;
    return this.stepView;
  }

  public recover(physicalCrouchHeld: boolean): void {
    this.clear();
    this.crouchHeld = physicalCrouchHeld;
    this.overflowed = false;
  }

  public clear(): void {
    this.head = 0;
    this.tail = 0;
    this.size = 0;
  }

  public reset(): void {
    this.clear();
    this.sequence = 0;
    this.crouchHeld = false;
    this.overflowed = false;
    this.overflowIncidents = 0;
    this.droppedEvents = 0;
  }
}
