import type { ActivationNodeState, GravityCapsuleState, GravityFieldState, PlatformState } from '../../game/simulation/state';

export type TraversalVisualCategory = 'terrain' | 'assistedMovement' | 'routeToggle' | 'gravityModifier' | 'neutral';

export const getTerrainTraversalVisualCategory = (_platform: Pick<PlatformState, 'surfaceMechanic'>): TraversalVisualCategory => 'terrain';

export const getPlatformTraversalVisualCategory = (
  platform: Pick<PlatformState, 'kind' | 'reveal' | 'temporaryBridge' | 'magnetic'>,
): TraversalVisualCategory => {
  if (platform.magnetic || platform.reveal || platform.temporaryBridge) {
    return 'routeToggle';
  }

  if (platform.kind === 'moving' || platform.kind === 'falling' || platform.kind === 'spring') {
    return 'assistedMovement';
  }

  return 'neutral';
};

export const getActivationNodeTraversalVisualCategory = (
  _node: Pick<ActivationNodeState, 'activated'>,
): TraversalVisualCategory => 'routeToggle';

export const getGravityCapsuleShellTraversalVisualCategory = (
  _capsule: Pick<GravityCapsuleState, 'enabled'>,
): TraversalVisualCategory => 'routeToggle';

export const getGravityCapsuleButtonTraversalVisualCategory = (
  _capsule: Pick<GravityCapsuleState, 'enabled' | 'button'>,
): TraversalVisualCategory => 'routeToggle';

export const getGravityFieldTraversalVisualCategory = (
  field: Pick<GravityFieldState, 'gravityCapsuleId'>,
  capsule: Pick<GravityCapsuleState, 'enabled'> | null = null,
): TraversalVisualCategory => {
  if (field.gravityCapsuleId && capsule && !capsule.enabled) {
    return 'routeToggle';
  }

  return 'gravityModifier';
};