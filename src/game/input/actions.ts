export type InputState = {
  left: boolean;
  right: boolean;
  jumpHeld: boolean;
  jumpPressed: boolean;
};

export const defaultInputState = (): InputState => ({
  left: false,
  right: false,
  jumpHeld: false,
  jumpPressed: false,
});
