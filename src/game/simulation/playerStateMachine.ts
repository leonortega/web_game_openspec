import { assign, createMachine, type Actor } from 'xstate';

// Context shape for the player state machine
export type PlayerMachineContext = {
  // Locomotion intent
  moveDir: -1 | 0 | 1;           // from input controller
  jumpIntent: boolean;            // jump button pressed this frame
  dashIntent: boolean;            // dash button pressed this frame
  isDashing: boolean;             // for presentation sync
  
  // Derived motion state (read-only for guards)
  lastGroundedVx: number;         // velocity when last touching ground
  jumpInitiatedThisFrame: boolean;
  
  // Player state values needed for guards (updated each frame by GameSession)
  onGround: boolean;              // is player currently on ground
  vy: number;                     // vertical velocity (for airborne checks)
  coyoteMs: number;               // coyote time remaining
  airJumpsRemaining: number;      // air jumps left
  dashCooldownMs: number;         // dash cooldown timer
  health: number;                 // current health
  maxHealth: number;              // max health
};

// Event types for state machine
export type PlayerMachineEvent =
  | { type: 'MOVE_INPUT'; dir: -1 | 0 | 1 }
  | {
      type: 'SYNC_PHYSICS';
      onGround: boolean;
      vy: number;
      coyoteMs: number;
      airJumpsRemaining: number;
      dashCooldownMs: number;
      health: number;
      maxHealth: number;
      moveDir: -1 | 0 | 1;
    }
  | { type: 'JUMP_INPUT' }
  | { type: 'DASH_INPUT' }
  | { type: 'JUMP_BUFFERED' }
  | { type: 'GROUND_CONTACT' }
  | { type: 'LEAVE_GROUND' }
  | { type: 'DAMAGE_TAKEN'; knockbackVx?: number }
  | { type: 'RESPAWN' }
  | { type: 'DASH_END' }
  | { type: 'JUMP_PEAK' }
  | { type: 'DASH_COOLDOWN_READY' }
  | { type: 'INVULNERABILITY_EXPIRED' };

export type PlayerStateMachineActor = Actor<typeof playerStateMachine>;

const playerStateMachine = createMachine(
  {
    id: 'playerStateMachine',
    initial: 'idle',
    types: {
      context: {} as PlayerMachineContext,
      events: {} as PlayerMachineEvent,
    },
    context: {
      moveDir: 0,
      jumpIntent: false,
      dashIntent: false,
      isDashing: false,
      lastGroundedVx: 0,
      jumpInitiatedThisFrame: false,
      onGround: true,
      vy: 0,
      coyoteMs: 0,
      airJumpsRemaining: 1,
      dashCooldownMs: 0,
      health: 5,
      maxHealth: 5,
    },
    on: {
      SYNC_PHYSICS: {
        actions: 'syncPhysicsContext',
      },
    },
    states: {
      idle: {
        on: {
          MOVE_INPUT: {
            target: 'run',
            guard: ({ event }) => (event as any).dir !== 0,
          },
          JUMP_INPUT: {
            target: 'jump',
            guard: 'canJump',
          },
          DASH_INPUT: {
            target: 'dash',
            guard: 'canDash',
          },
          LEAVE_GROUND: {
            target: 'fall',
          },
          DAMAGE_TAKEN: [
            {
              target: 'dead',
              guard: 'isHealthZero',
            },
            {
              target: 'hurt',
            },
          ],
        },
      },
      run: {
        on: {
          MOVE_INPUT: [
            {
              target: 'idle',
              guard: ({ event }) => (event as any).dir === 0,
            },
            {
              reenter: true,
            },
          ],
          JUMP_INPUT: {
            target: 'jump',
            guard: 'canJump',
          },
          DASH_INPUT: {
            target: 'dash',
            guard: 'canDash',
          },
          LEAVE_GROUND: {
            target: 'fall',
          },
          DAMAGE_TAKEN: [
            {
              target: 'dead',
              guard: 'isHealthZero',
            },
            {
              target: 'hurt',
            },
          ],
        },
      },
      jump: {
        always: {
          target: 'fall',
          guard: 'isJumpPeakReached',
        },
        on: {
          JUMP_PEAK: {
            target: 'fall',
          },
          DASH_INPUT: {
            target: 'dash',
            guard: 'canDash',
          },
          DAMAGE_TAKEN: [
            {
              target: 'dead',
              guard: 'isHealthZero',
            },
            {
              target: 'hurt',
            },
          ],
          LEAVE_GROUND: {
            reenter: true,
          },
        },
      },
      fall: {
        on: {
          GROUND_CONTACT: [
            {
              target: 'idle',
              guard: ({ context }) => context.moveDir === 0,
            },
            {
              target: 'run',
              guard: ({ context }) => context.moveDir !== 0,
            },
          ],
          JUMP_INPUT: {
            target: 'jump',
            guard: 'canJump',
          },
          JUMP_BUFFERED: {
            target: 'jump',
            guard: 'canJump',
          },
          DASH_INPUT: {
            target: 'dash',
            guard: 'canDash',
          },
          DAMAGE_TAKEN: [
            {
              target: 'dead',
              guard: 'isHealthZero',
            },
            {
              target: 'hurt',
            },
          ],
          MOVE_INPUT: {
            reenter: true,
          },
        },
      },
      dash: {
        on: {
          DASH_END: [
            {
              target: 'fall',
              guard: 'isDashEndAirborne',
            },
            {
              target: 'idle',
              guard: ({ context }) => context.moveDir === 0,
            },
            {
              target: 'run',
              guard: ({ context }) => context.moveDir !== 0,
            },
          ],
          DAMAGE_TAKEN: [
            {
              target: 'dead',
              guard: 'isHealthZero',
            },
            {
              target: 'hurt',
            },
          ],
          MOVE_INPUT: {
            reenter: true,
          },
        },
      },
      hurt: {
        on: {
          INVULNERABILITY_EXPIRED: [
            {
              target: 'fall',
              guard: 'isHurtEndAirborne',
            },
            {
              target: 'idle',
              guard: ({ context }) => context.moveDir === 0,
            },
            {
              target: 'run',
              guard: ({ context }) => context.moveDir !== 0,
            },
          ],
          DAMAGE_TAKEN: {
            target: 'dead',
            guard: 'isHealthZero',
          },
        },
      },
      dead: {
        on: {
          RESPAWN: {
            target: 'idle',
          },
        },
      },
    },
  },
  {
    actions: {
      syncPhysicsContext: assign(({ event }) => {
        if (event.type !== 'SYNC_PHYSICS') {
          return {};
        }

        return {
          onGround: event.onGround,
          vy: event.vy,
          coyoteMs: event.coyoteMs,
          airJumpsRemaining: event.airJumpsRemaining,
          dashCooldownMs: event.dashCooldownMs,
          health: event.health,
          maxHealth: event.maxHealth,
          moveDir: event.moveDir,
        };
      }),
    },
    guards: {
      canJump: ({ context }) => {
        // Can jump if: on ground, OR have coyote time, OR have air jumps remaining
        return context.onGround || context.coyoteMs > 0 || context.airJumpsRemaining > 0;
      },
      canDash: ({ context }) => {
        // Can dash if: dash cooldown has expired
        return context.dashCooldownMs <= 0;
      },
      isDashEndAirborne: ({ context }) => {
        // Check if player is airborne after dash ends: vy > 0 (descending) or not on ground
        return context.vy > 0 || !context.onGround;
      },
      isHurtEndAirborne: ({ context }) => {
        // Check if player is airborne after hurt ends: vy > 0 (descending) or not on ground
        return context.vy > 0 || !context.onGround;
      },
      isJumpPeakReached: ({ context }) => {
        return context.vy >= 0;
      },
      isHealthZero: ({ context }) => {
        // Check if health is depleted
        return context.health <= 0;
      },
    },
  }
);

export { playerStateMachine };

