export class AppError extends Error {
  constructor(
    public ststusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}
