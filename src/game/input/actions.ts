export type InputState = {
  left: boolean;
  right: boolean;
  jumpHeld: boolean;
  jumpPressed: boolean;
  thrusterPressed: boolean;
  dashPressed: boolean;
  shootPressed: boolean;
};

export const defaultInputState = (): InputState => ({
  left: false,
  right: false,
  jumpHeld: false,
  jumpPressed: false,
  thrusterPressed: false,
  dashPressed: false,
  shootPressed: false,
});
