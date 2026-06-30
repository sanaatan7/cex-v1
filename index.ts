import "dotenv/config";
import { createApp, bootstrap } from "./src/app";
const PORT = process.env.PORT || 3000;

const start = async () => {
  await bootstrap();
  const app = createApp();
  app.listen(PORT, () => {
    console.log(`CEX-v2 is running at port ${PORT}`);
  });
};

start().catch((error) => {
  console.error("Failled to start Server: ", error);
  process.exit(1);
});
