import { bootstrap, createApp } from "./src/app";

const PORT = Number(process.env.PORT) || 3000;

const start = async () => {
  await bootstrap();
  const app = createApp();

  app.listen(PORT, () => {
    console.log(`CEX running at port ${PORT}`);
  });
};

start().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});