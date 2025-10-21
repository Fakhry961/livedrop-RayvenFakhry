import "dotenv/config";
import { answer } from "./engine.js";

(async () => {
  console.log(await answer("where is my order 12345?"));
  console.log(await answer("recommend me a product under $50"));
})();
