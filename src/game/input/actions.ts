export type InputState = {
  left: boolean;
  right: boolean;
  jumpHeld: boolean;
  jumpPressed: boolean;
  dashPressed: boolean;
  shootPressed: boolean;
};

export const defaultInputState = (): InputState => ({
  left: false,
  right: false,
  jumpHeld: false,
  jumpPressed: false,
  dashPressed: false,
  shootPressed: false,
});
