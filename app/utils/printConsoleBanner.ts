import { CONSOLE_BANNER } from "../constants/consoleBanner";

const BANNER_STYLE = ["color: #d74894"].join("; ");

export function printConsoleBanner(): void {
  console.log(`%c${CONSOLE_BANNER}`, BANNER_STYLE);
}
