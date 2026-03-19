import { env } from "./env.js";
import app from "./app.js";

app.listen(env.PORT, () => {
  console.log(`Auth backend listening on http://localhost:${env.PORT}`);
});
