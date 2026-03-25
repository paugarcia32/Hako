export class Logger {
  constructor(private readonly name: string) {}

  log(msg: string) {
    console.log(`[${this.name}] ${msg}`);
  }

  warn(msg: string) {
    console.warn(`[${this.name}] ${msg}`);
  }
}
